using Domain.Enums;

namespace Application.DTOs.Payments;

public class IssueRefundDto
{
    public decimal Amount { get; set; }
    public RefundType RefundType { get; set; }
    public string RefundDetail { get; set; } = string.Empty;
}
