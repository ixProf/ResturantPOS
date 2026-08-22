namespace Application.DTOs.Reports;

public class TopSellingItemDto
{
    public int MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public int TotalQuantitySold { get; set; }
    public int QuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
}