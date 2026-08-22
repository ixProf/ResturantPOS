namespace Application.DTOs.Inventory;

public class InventoryItemDto
{
    public int Id { get; set; }
    public int IngredientId { get => Id; set => Id = value; }
    public string IngredientName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal TotalStock { get => Quantity; set => Quantity = value; }
    public string Unit { get; set; } = string.Empty;
    public bool IsLowStock { get; set; }
    public DateTime LastUpdated { get; set; }
}