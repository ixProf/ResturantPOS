namespace Application.DTOs.Inventory;

public class CreateIngredientDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal TotalStock { get => Quantity; set => Quantity = value; }
    public string Unit { get; set; } = string.Empty;
    public decimal MinimumStockLevel { get; set; }
    public decimal? LowStockAlert { get => MinimumStockLevel; set => MinimumStockLevel = value ?? 0; }
}