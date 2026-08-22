using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Orders;
using Application.DTOs.Payments;
using Application.Services.Interfaces;
using Domain.Enums;
using Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Implementations;

public class PaymentService : IPaymentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IInventoryService _inventoryService;

    public PaymentService(IUnitOfWork unitOfWork, IInventoryService inventoryService)
    {
        _unitOfWork = unitOfWork;
        _inventoryService = inventoryService;
    }

    public async Task<PaymentDto> ProcessPaymentAsync(CreatePaymentDto dto, int cashierId)
    {
        using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var order = await _unitOfWork.Orders.Query()
                .Include(o => o.Table)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == dto.OrderId);

            if (order == null)
                throw new KeyNotFoundException($"Order '{dto.OrderId}' not found.");

            if (order.Status == OrderStatus.Completed)
                throw new InvalidOperationException($"Order '{dto.OrderId}' has already been paid and completed.");

            if (order.Status == OrderStatus.Cancelled || order.Status == OrderStatus.Voided)
                throw new InvalidOperationException($"Cannot process payment for cancelled order.");

            var cashier = await _unitOfWork.Employees.GetByIdAsync(cashierId);
            if (cashier == null)
                throw new KeyNotFoundException($"Cashier '{cashierId}' not found.");

            decimal amountPaid = dto.Amount;
            if (amountPaid < order.FinalAmount)
            {
                throw new InvalidOperationException($"Paid amount ({amountPaid}) is less than order final amount ({order.FinalAmount}).");
            }

            var payment = new Payment
            {
                OrderId = dto.OrderId,
                CashierId = cashierId,
                PaymentMethod = dto.PaymentMethod,
                TotalAmount = order.TotalAmount,
                DiscountAmount = order.DiscountAmount,
                FinalAmount = order.FinalAmount,
                PaidAt = DateTime.UtcNow,
                ReceiptNumber = $"INV-{DateTime.UtcNow:yyyyMMddHHmmss}-{order.Id}"
            };

            await _unitOfWork.Payments.AddAsync(payment);

            var oldStatus = order.Status;
            order.Status = OrderStatus.Completed;
            order.UpdatedAt = DateTime.UtcNow;

            if (order.Table != null)
            {
                order.Table.Status = TableStatus.Available;
                _unitOfWork.Tables.Update(order.Table);
            }

            _unitOfWork.Orders.Update(order);
            await _inventoryService.DeductInventoryForOrderAsync(order.Id);

            order.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                OldStatus = oldStatus,
                NewStatus = OrderStatus.Completed,
                ChangedBy = cashierId,
                ChangedAt = DateTime.UtcNow,
                Notes = $"Payment processed via {dto.PaymentMethod}."
            });

            await _unitOfWork.CommitTransactionAsync();
            return MapToPaymentDto(payment);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<PaymentDetailsDto> GetPaymentByIdAsync(int id)
    {
        var payment = await _unitOfWork.Payments.Query()
            .Include(p => p.Order)
                .ThenInclude(o => o.Table)
            .Include(p => p.Cashier)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null)
            throw new KeyNotFoundException($"Payment with ID '{id}' was not found.");

        return new PaymentDetailsDto
        {
            Id = payment.Id,
            OrderId = payment.OrderId,
            TableNumber = payment.Order.Table?.TableNumber ?? 0,
            CashierName = payment.Cashier?.FullName ?? string.Empty,
            Amount = payment.FinalAmount,
            PaymentMethod = payment.PaymentMethod,
            PaidAt = payment.PaidAt ?? DateTime.UtcNow
        };
    }

    public async Task<IEnumerable<PaymentSummaryDto>> GetAllPaymentsAsync(PaymentFilterDto? filter = null)
    {
        IQueryable<Payment> query = _unitOfWork.Payments.Query()
            .Include(p => p.Order)
            .Include(p => p.Cashier);

        if (filter != null)
        {
            if (filter.PaymentMethod.HasValue)
                query = query.Where(p => p.PaymentMethod == filter.PaymentMethod.Value);

            if (filter.From.HasValue)
                query = query.Where(p => p.PaidAt >= filter.From.Value);

            if (filter.To.HasValue)
                query = query.Where(p => p.PaidAt <= filter.To.Value);
        }

        var payments = await query.ToListAsync();

        decimal totalRev = payments.Sum(p => p.FinalAmount);
        int totalTx = payments.Count;
        decimal avgPay = totalTx > 0 ? totalRev / totalTx : 0;

        return new List<PaymentSummaryDto>
        {
            new PaymentSummaryDto
            {
                TotalRevenue = totalRev,
                TotalTransactions = totalTx,
                AveragePayment = Math.Round(avgPay, 2)
            }
        };
    }

    public async Task<InvoiceDto> GetInvoiceByOrderIdAsync(int orderId)
    {
        var order = await _unitOfWork.Orders.Query()
            .Include(o => o.Table)
            .Include(o => o.Waiter)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
            throw new KeyNotFoundException($"Order '{orderId}' not found.");

        var payment = order.Payments.OrderByDescending(p => p.PaidAt).FirstOrDefault();

        return new InvoiceDto
        {
            OrderId = order.Id,
            TableNumber = order.Table?.TableNumber ?? 0,
            WaiterName = order.Waiter?.FullName ?? string.Empty,
            SubTotal = order.TotalAmount,
            DiscountAmount = order.DiscountAmount,
            FinalAmount = order.FinalAmount,
            PaymentMethod = payment?.PaymentMethod ?? PaymentMethod.Cash,
            PaidAt = payment?.PaidAt ?? DateTime.UtcNow,
            Items = order.OrderItems.Select(oi => new OrderItemDto
            {
                Id = oi.Id,
                MenuItemId = oi.MenuItemId,
                MenuItemName = oi.MenuItem.Name,
                UnitPrice = oi.UnitPrice,
                Quantity = oi.Quantity,
                TotalPrice = oi.UnitPrice * oi.Quantity,
                Status = oi.Status,
                Notes = oi.Notes
            }).ToList()
        };
    }

    public async Task<PaymentDto> IssueRefundAsync(int paymentId, IssueRefundDto dto, int approvedById)
    {
        using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var payment = await _unitOfWork.Payments.Query()
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p => p.Id == paymentId);

            if (payment == null)
                throw new KeyNotFoundException($"Payment '{paymentId}' not found.");

            var approver = await _unitOfWork.Employees.GetByIdAsync(approvedById);
            if (approver == null)
                throw new KeyNotFoundException($"Approving employee '{approvedById}' not found.");

            var refund = new Refund
            {
                PaymentId = paymentId,
                ApprovedBy = approvedById,
                Amount = dto.Amount,
                RefundType = dto.RefundType,
                RefundDetail = dto.RefundDetail ?? "Refund issued",
                RefundedAt = DateTime.UtcNow
            };

            await _unitOfWork.Refunds.AddAsync(refund);

            if (dto.RefundType == RefundType.Full)
            {
                await _inventoryService.RestoreInventoryForOrderAsync(payment.OrderId);
            }

            await _unitOfWork.CommitTransactionAsync();
            return MapToPaymentDto(payment);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<bool> ApplyDiscountAsync(int orderId, ApplyDiscountDto dto, int approvedByEmployeeId)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(orderId);
        if (order == null)
            throw new KeyNotFoundException($"Order '{orderId}' not found.");

        if (order.Status == OrderStatus.Completed)
            throw new InvalidOperationException("Cannot apply discount to a completed order.");

        var approver = await _unitOfWork.Employees.GetByIdAsync(approvedByEmployeeId);
        if (approver == null)
            throw new KeyNotFoundException($"Approving employee '{approvedByEmployeeId}' not found.");

        order.DiscountAmount = dto.DiscountAmount;
        order.FinalAmount = Math.Max(0, order.TotalAmount - dto.DiscountAmount);
        _unitOfWork.Orders.Update(order);

        await _unitOfWork.Discounts.AddAsync(new Discount
        {
            OrderId = orderId,
            ApprovedBy = approvedByEmployeeId,
            DiscountAmount = dto.DiscountAmount,
            Reason = dto.Reason ?? "Manager approved discount",
            CreatedAt = DateTime.UtcNow
        });

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private static PaymentDto MapToPaymentDto(Payment p)
    {
        return new PaymentDto
        {
            Id = p.Id,
            OrderId = p.OrderId,
            AmountPaid = p.FinalAmount,
            PaymentMethod = p.PaymentMethod,
            PaidAt = p.PaidAt ?? DateTime.UtcNow
        };
    }
}

