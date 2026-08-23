namespace Application.DTOs.Payments;

public class ApplyDiscountDto
{
    public int? DiscountId { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal? DiscountPercent { get; set; }
    public string? Reason { get; set; }
}
