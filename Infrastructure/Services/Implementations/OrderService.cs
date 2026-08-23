using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Orders;
using Application.Services.Interfaces;
using Domain.Enums;
using Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Implementations;

public class OrderService : IOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IInventoryService _inventoryService;
    private readonly IOrderNotificationService _notificationService;

    public OrderService(IUnitOfWork unitOfWork, IInventoryService inventoryService, IOrderNotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _inventoryService = inventoryService;
        _notificationService = notificationService;
    }

    public async Task<OrderResponseDto> CreateOrderAsync(CreateOrderDto dto, int waiterId)
    {
        using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var table = await _unitOfWork.Tables.GetByIdAsync(dto.TableId);
            if (table == null)
                throw new KeyNotFoundException($"Table '{dto.TableId}' not found.");

            if (table.Status == TableStatus.OutOfService)
                throw new InvalidOperationException($"Table '{table.TableNumber}' is out of service.");

            var waiter = await _unitOfWork.Employees.GetByIdAsync(waiterId);
            if (waiter == null)
                throw new KeyNotFoundException($"Waiter '{waiterId}' not found.");

            var order = new Order
            {
                TableId = dto.TableId,
                WaiterId = waiterId,
                Status = OrderStatus.Draft,
                CreatedAt = DateTime.UtcNow,
                TotalAmount = 0,
                DiscountAmount = 0,
                FinalAmount = 0
            };

            if (dto.Items != null && dto.Items.Any())
            {
                foreach (var itemDto in dto.Items)
                {
                    var menuItem = await _unitOfWork.MenuItems.GetByIdAsync(itemDto.MenuItemId);
                    if (menuItem == null || menuItem.IsAvailable == false)
                        throw new InvalidOperationException($"Menu item '{itemDto.MenuItemId}' is unavailable.");

                    order.OrderItems.Add(new OrderItem
                    {
                        MenuItemId = itemDto.MenuItemId,
                        Quantity = itemDto.Quantity,
                        UnitPrice = menuItem.Price,
                        Notes = itemDto.Notes,
                        Status = OrderItemStatus.Draft
                    });
                }

                RecalculateTotals(order);
            }

            table.Status = TableStatus.Occupied;
            _unitOfWork.Tables.Update(table);

            await _unitOfWork.Orders.AddAsync(order);
            await _unitOfWork.SaveChangesAsync();

            order.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                OldStatus = null,
                NewStatus = OrderStatus.Draft,
                ChangedBy = waiterId,
                ChangedAt = DateTime.UtcNow,
                Notes = "Order draft created."
            });

            await _unitOfWork.CommitTransactionAsync();

            _ = _notificationService.NotifyOrderUpdatedAsync(order.Id, "Created");

            return MapToOrderResponseDto(order);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<OrderDetailsDto> GetOrderByIdAsync(int id)
    {
        var order = await _unitOfWork.Orders.Query()
            .Include(o => o.Table)
            .Include(o => o.Waiter)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            throw new KeyNotFoundException($"Order with ID '{id}' was not found.");

        return new OrderDetailsDto
        {
            Id = order.Id,
            TableId = order.TableId,
            TableNumber = order.Table.TableNumber,
            WaiterId = order.WaiterId,
            WaiterName = order.Waiter.FullName,
            Status = order.Status,
            TotalAmount = order.TotalAmount,
            DiscountAmount = order.DiscountAmount,
            FinalAmount = order.FinalAmount,
            CreatedAt = order.CreatedAt ?? DateTime.UtcNow,
            UpdatedAt = order.UpdatedAt,
            CancellationReason = order.CancellationReason,
            Items = order.OrderItems.Select(oi => new OrderItemDto
            {
                Id = oi.Id,
                MenuItemId = oi.MenuItemId,
                MenuItemName = oi.MenuItem?.Name ?? $"Item #{oi.MenuItemId}",
                UnitPrice = oi.UnitPrice,
                Quantity = oi.Quantity,
                TotalPrice = oi.UnitPrice * oi.Quantity,
                Status = oi.Status,
                Notes = oi.Notes,
                CancellationReason = oi.CancellationReason
            }).ToList()
        };
    }

    public async Task<IEnumerable<OrderSummaryDto>> GetAllOrdersAsync()
    {
        var orders = await _unitOfWork.Orders.Query()
            .Include(o => o.Table)
            .Include(o => o.Waiter)
            .Include(o => o.OrderItems)
            .ToListAsync();

        return orders.Select(MapToOrderSummaryDto);
    }

    public async Task<IEnumerable<OrderSummaryDto>> GetOrdersByStatusAsync(OrderStatus status)
    {
        var orders = await _unitOfWork.Orders.Query()
            .Where(o => o.Status == status)
            .Include(o => o.Table)
            .Include(o => o.Waiter)
            .Include(o => o.OrderItems)
            .ToListAsync();

        return orders.Select(MapToOrderSummaryDto);
    }

    public async Task<OrderResponseDto> SubmitOrderAsync(int orderId)
    {
        using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var order = await _unitOfWork.Orders.Query()
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
                throw new KeyNotFoundException($"Order '{orderId}' not found.");

            if (order.Status != OrderStatus.Draft)
                throw new InvalidOperationException($"Only Draft orders can be submitted. Current status: '{order.Status}'.");

            if (!order.OrderItems.Any())
                throw new InvalidOperationException("Cannot submit an empty order.");

            bool isStockAvailable = await ValidateStockForOrderAsync(orderId);
            if (!isStockAvailable)
            {
                throw new InvalidOperationException("One or more ingredients are out of stock for items in this order.");
            }

            var oldStatus = order.Status;
            order.Status = OrderStatus.Submitted;
            order.UpdatedAt = DateTime.UtcNow;

            foreach (var item in order.OrderItems)
            {
                if (item.Status == OrderItemStatus.Draft)
                {
                    item.Status = OrderItemStatus.Submitted;
                }
            }

            order.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                OldStatus = oldStatus,
                NewStatus = OrderStatus.Submitted,
                ChangedBy = order.WaiterId,
                ChangedAt = DateTime.UtcNow,
                Notes = "Order submitted to kitchen."
            });

            _unitOfWork.Orders.Update(order);
            await _unitOfWork.CommitTransactionAsync();

            _ = _notificationService.NotifyOrderUpdatedAsync(order.Id, "Submitted");

            return MapToOrderResponseDto(order);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<OrderResponseDto> UpdateOrderStatusAsync(int id, UpdateOrderStatusDto dto, int employeeId)
    {
        using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var order = await _unitOfWork.Orders.Query()
                .Include(o => o.OrderItems)
                .Include(o => o.Table)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                throw new KeyNotFoundException($"Order '{id}' not found.");

            var oldStatus = order.Status;
            ValidateStatusTransition(oldStatus, dto.Status);

            order.Status = dto.Status;
            order.UpdatedAt = DateTime.UtcNow;

            if (dto.Status == OrderStatus.Preparing)
            {
                foreach (var item in order.OrderItems.Where(i => i.Status == OrderItemStatus.Submitted))
                    item.Status = OrderItemStatus.Preparing;
            }
            else if (dto.Status == OrderStatus.Ready)
            {
                foreach (var item in order.OrderItems.Where(i => i.Status == OrderItemStatus.Preparing || i.Status == OrderItemStatus.Submitted))
                    item.Status = OrderItemStatus.Ready;
            }
            else if (dto.Status == OrderStatus.Served)
            {
                foreach (var item in order.OrderItems.Where(i => i.Status == OrderItemStatus.Ready))
                    item.Status = OrderItemStatus.Served;
            }
            else if (dto.Status == OrderStatus.Completed)
            {
                if (order.Table != null)
                {
                    order.Table.Status = TableStatus.Available;
                    _unitOfWork.Tables.Update(order.Table);
                }

                await _inventoryService.DeductInventoryForOrderAsync(order.Id);
            }

            order.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                OldStatus = oldStatus,
                NewStatus = dto.Status,
                ChangedBy = employeeId,
                ChangedAt = DateTime.UtcNow,
                Notes = dto.Notes ?? $"Status updated to {dto.Status}."
            });

            _unitOfWork.Orders.Update(order);
            await _unitOfWork.CommitTransactionAsync();

            if (dto.Status == OrderStatus.Ready)
            {
                _ = _notificationService.NotifyOrderReadyForWaiterAsync(order.Id, order.TableId, order.Table?.TableNumber ?? 0);
            }
            else
            {
                _ = _notificationService.NotifyOrderUpdatedAsync(order.Id, dto.Status.ToString());
            }

            return MapToOrderResponseDto(order);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<OrderResponseDto> UpdateOrderItemStatusAsync(int orderId, int itemId, UpdateOrderItemStatusDto dto, int employeeId)
    {
        var order = await _unitOfWork.Orders.Query()
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
            throw new KeyNotFoundException($"Order '{orderId}' not found.");

        var item = order.OrderItems.FirstOrDefault(i => i.Id == itemId);
        if (item == null)
            throw new KeyNotFoundException($"Order item '{itemId}' not found in order '{orderId}'.");

        item.Status = dto.Status;
        if (!string.IsNullOrWhiteSpace(dto.CancellationReason))
        {
            item.CancellationReason = dto.CancellationReason;
            item.CancelledBy = employeeId;
            item.CancelledAt = DateTime.UtcNow;
        }

        var activeItems = order.OrderItems.Where(i => i.Status != OrderItemStatus.Cancelled && i.Status != OrderItemStatus.Voided).ToList();

        if (activeItems.All(i => i.Status == OrderItemStatus.Ready))
        {
            if (order.Status == OrderStatus.Preparing || order.Status == OrderStatus.Submitted)
            {
                order.Status = OrderStatus.Ready;
            }
        }
        else if (activeItems.Any(i => i.Status == OrderItemStatus.Preparing))
        {
            if (order.Status == OrderStatus.Submitted)
            {
                order.Status = OrderStatus.Preparing;
            }
        }
        else if (activeItems.All(i => i.Status == OrderItemStatus.Served))
        {
            if (order.Status == OrderStatus.Ready)
            {
                order.Status = OrderStatus.Served;
            }
        }

        RecalculateTotals(order);
        order.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Orders.Update(order);
        await _unitOfWork.SaveChangesAsync();

        if (order.Status == OrderStatus.Ready)
        {
            _ = _notificationService.NotifyOrderReadyForWaiterAsync(orderId, order.TableId, order.Table?.TableNumber ?? 0);
        }
        else
        {
            _ = _notificationService.NotifyOrderUpdatedAsync(orderId, "ItemStatusUpdated");
        }

        return MapToOrderResponseDto(order);
    }

    public async Task<OrderResponseDto> AddOrderItemAsync(int orderId, AddOrderItemDto dto)
    {
        var order = await _unitOfWork.Orders.Query()
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
            throw new KeyNotFoundException($"Order '{orderId}' not found.");

        if (order.Status == OrderStatus.Completed || order.Status == OrderStatus.Cancelled || order.Status == OrderStatus.Voided)
            throw new InvalidOperationException($"Cannot add items to closed order in status '{order.Status}'.");

        var menuItem = await _unitOfWork.MenuItems.GetByIdAsync(dto.MenuItemId);
        if (menuItem == null || menuItem.IsAvailable == false)
            throw new InvalidOperationException($"Menu item '{dto.MenuItemId}' is unavailable.");

        var initialItemStatus = (order.Status == OrderStatus.Draft)
            ? OrderItemStatus.Draft
            : OrderItemStatus.Submitted;

        order.OrderItems.Add(new OrderItem
        {
            MenuItemId = dto.MenuItemId,
            Quantity = dto.Quantity,
            UnitPrice = menuItem.Price,
            Notes = dto.Notes,
            Status = initialItemStatus
        });

        RecalculateTotals(order);
        order.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Orders.Update(order);
        await _unitOfWork.SaveChangesAsync();
        return MapToOrderResponseDto(order);
    }

    public async Task<bool> RemoveOrderItemAsync(int orderId, RemoveOrderItemDto dto)
    {
        var order = await _unitOfWork.Orders.Query()
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
            throw new KeyNotFoundException($"Order '{orderId}' not found.");

        var item = order.OrderItems.FirstOrDefault(i => (dto.OrderItemId > 0 && i.Id == dto.OrderItemId) || (dto.MenuItemId.HasValue && i.MenuItemId == dto.MenuItemId.Value));
        if (item == null)
            return false;

        if (item.Status != OrderItemStatus.Draft)
            throw new InvalidOperationException($"Only Draft items can be directly removed. Use cancel endpoint for submitted items.");

        _unitOfWork.OrderItems.Remove(item);
        RecalculateTotals(order);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CancelOrderAsync(int orderId, CancelOrderDto dto, int employeeId)
    {
        using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var order = await _unitOfWork.Orders.Query()
                .Include(o => o.Table)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
                throw new KeyNotFoundException($"Order '{orderId}' not found.");

            if (order.Status == OrderStatus.Completed)
                throw new InvalidOperationException("Cannot cancel a completed order. Process a refund instead.");

            var oldStatus = order.Status;
            order.Status = (oldStatus == OrderStatus.Draft) ? OrderStatus.Cancelled : OrderStatus.Voided;
            order.CancellationReason = dto.Reason;
            order.CancelledBy = employeeId;
            order.CancelledAt = DateTime.UtcNow;
            order.UpdatedAt = DateTime.UtcNow;

            foreach (var item in order.OrderItems)
            {
                item.Status = (oldStatus == OrderStatus.Draft) ? OrderItemStatus.Cancelled : OrderItemStatus.Voided;
                item.CancellationReason = dto.Reason;
                item.CancelledBy = employeeId;
                item.CancelledAt = DateTime.UtcNow;
            }

            if (order.Table != null)
            {
                order.Table.Status = TableStatus.Available;
                _unitOfWork.Tables.Update(order.Table);
            }

            order.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                OldStatus = oldStatus,
                NewStatus = order.Status,
                ChangedBy = employeeId,
                ChangedAt = DateTime.UtcNow,
                Notes = $"Order cancelled/voided. Reason: {dto.Reason}"
            });

            _unitOfWork.Orders.Update(order);
            await _unitOfWork.CommitTransactionAsync();

            return true;
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<bool> CancelOrderItemAsync(int orderId, int itemId, CancelOrderDto dto, int employeeId)
    {
        var order = await _unitOfWork.Orders.Query()
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
            throw new KeyNotFoundException($"Order '{orderId}' not found.");

        var item = order.OrderItems.FirstOrDefault(i => i.Id == itemId);
        if (item == null)
            throw new KeyNotFoundException($"Item '{itemId}' not found in order '{orderId}'.");

        item.Status = OrderItemStatus.Cancelled;
        item.CancellationReason = dto.Reason;
        item.CancelledBy = employeeId;
        item.CancelledAt = DateTime.UtcNow;

        RecalculateTotals(order);
        _unitOfWork.Orders.Update(order);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ValidateStockForOrderAsync(int orderId)
    {
        var orderItems = await _unitOfWork.OrderItems.Query()
            .Where(oi => oi.OrderId == orderId && oi.Status != OrderItemStatus.Cancelled && oi.Status != OrderItemStatus.Voided)
            .ToListAsync();

        foreach (var item in orderItems)
        {
            bool isAvailable = await _inventoryService.CheckRecipeAvailabilityAsync(item.MenuItemId, item.Quantity);
            if (!isAvailable)
                return false;
        }

        return true;
    }

    private static void RecalculateTotals(Order order)
    {
        order.TotalAmount = order.OrderItems
            .Where(i => i.Status != OrderItemStatus.Cancelled && i.Status != OrderItemStatus.Voided)
            .Sum(i => i.UnitPrice * i.Quantity);

        order.FinalAmount = Math.Max(0, order.TotalAmount - order.DiscountAmount);
    }

    private static void ValidateStatusTransition(OrderStatus current, OrderStatus target)
    {
        if (current == target) return;

        if (current == OrderStatus.Completed || current == OrderStatus.Cancelled || current == OrderStatus.Voided)
        {
            throw new InvalidOperationException($"Cannot transition from final state '{current}'.");
        }

        bool isValid = (current, target) switch
        {
            (OrderStatus.Draft, OrderStatus.Submitted) => true,
            (OrderStatus.Draft, OrderStatus.Cancelled) => true,
            (OrderStatus.Draft, OrderStatus.Voided) => true,

            (OrderStatus.Submitted, OrderStatus.Preparing) => true,
            (OrderStatus.Submitted, OrderStatus.Ready) => true,
            (OrderStatus.Submitted, OrderStatus.Cancelled) => true,
            (OrderStatus.Submitted, OrderStatus.Voided) => true,

            (OrderStatus.Preparing, OrderStatus.Ready) => true,
            (OrderStatus.Preparing, OrderStatus.Cancelled) => true,
            (OrderStatus.Preparing, OrderStatus.Voided) => true,

            (OrderStatus.Ready, OrderStatus.Served) => true,
            (OrderStatus.Ready, OrderStatus.PaymentPending) => true,
            (OrderStatus.Ready, OrderStatus.Cancelled) => true,
            (OrderStatus.Ready, OrderStatus.Voided) => true,

            (OrderStatus.Served, OrderStatus.PaymentPending) => true,
            (OrderStatus.Served, OrderStatus.Completed) => true,
            (OrderStatus.Served, OrderStatus.Voided) => true,

            (OrderStatus.PaymentPending, OrderStatus.Completed) => true,
            (OrderStatus.PaymentPending, OrderStatus.Voided) => true,

            _ => false
        };

        if (!isValid)
        {
            throw new InvalidOperationException($"Invalid order status transition from '{current}' to '{target}'.");
        }
    }

    private static OrderResponseDto MapToOrderResponseDto(Order order)
    {
        return new OrderResponseDto
        {
            Id = order.Id,
            TableId = order.TableId,
            Status = order.Status,
            TotalAmount = order.FinalAmount
        };
    }

    private static OrderSummaryDto MapToOrderSummaryDto(Order order)
    {
        decimal total = order.TotalAmount > 0
            ? order.TotalAmount
            : (order.OrderItems?.Where(i => i.Status != OrderItemStatus.Cancelled && i.Status != OrderItemStatus.Voided).Sum(i => i.UnitPrice * i.Quantity) ?? 0m);

        decimal discount = order.DiscountAmount;
        decimal final = order.FinalAmount > 0 || discount > 0
            ? order.FinalAmount
            : Math.Max(0m, total - discount);

        return new OrderSummaryDto
        {
            Id = order.Id,
            TableId = order.TableId,
            TableNumber = order.Table?.TableNumber ?? 0,
            WaiterName = order.Waiter?.FullName ?? string.Empty,
            Status = order.Status,
            TotalAmount = total,
            DiscountAmount = discount,
            FinalAmount = final,
            ItemCount = order.OrderItems.Count(i => i.Status != OrderItemStatus.Cancelled && i.Status != OrderItemStatus.Voided),
            CreatedAt = order.CreatedAt ?? DateTime.UtcNow
        };
    }
}

