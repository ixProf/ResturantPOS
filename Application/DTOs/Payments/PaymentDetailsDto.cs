using Domain.Enums;

namespace Application.DTOs.Payments;

public class PaymentDetailsDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int TableNumber { get; set; }
    public string CashierName { get; set; } = string.Empty;
    public decimal AmountPaid { get; set; }
    public decimal Amount { get => AmountPaid; set => AmountPaid = value; }
    public PaymentMethod PaymentMethod { get; set; }
    public DateTime PaidAt { get; set; }
}