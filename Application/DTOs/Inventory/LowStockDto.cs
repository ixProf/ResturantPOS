namespace Application.DTOs.Inventory;

public class LowStockDto
{
    public int IngredientId { get; set; }
    public string IngredientName { get; set; } = string.Empty;
    public decimal CurrentQuantity { get; set; }
    public decimal CurrentStock { get => CurrentQuantity; set => CurrentQuantity = value; }
    public decimal MinimumStockLevel { get; set; }
    public decimal LowStockThreshold { get => MinimumStockLevel; set => MinimumStockLevel = value; }
    public string Unit { get; set; } = string.Empty;
}