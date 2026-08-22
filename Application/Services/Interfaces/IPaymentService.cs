using Application.DTOs.Payments;

namespace Application.Services.Interfaces;

public interface IPaymentService
{
    Task<PaymentDto> ProcessPaymentAsync(CreatePaymentDto dto, int cashierId);
    Task<PaymentDetailsDto> GetPaymentByIdAsync(int id);
    Task<IEnumerable<PaymentSummaryDto>> GetAllPaymentsAsync(PaymentFilterDto? filter = null);
    Task<InvoiceDto> GetInvoiceByOrderIdAsync(int orderId);
    Task<PaymentDto> IssueRefundAsync(int paymentId, IssueRefundDto dto, int approvedById);
    Task<bool> ApplyDiscountAsync(int orderId, ApplyDiscountDto dto, int approvedByEmployeeId);
}
