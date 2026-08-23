namespace Application.DTOs.Inventory;

public class CreateInventoryPurchaseDto
{
    public int IngredientId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public string Reason { get; set; } = null!;
}
