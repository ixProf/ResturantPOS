namespace Application.DTOs.Payments;

public class ApplyDiscountDto
{
    public decimal DiscountAmount { get; set; }
    public string? Reason { get; set; }
}
