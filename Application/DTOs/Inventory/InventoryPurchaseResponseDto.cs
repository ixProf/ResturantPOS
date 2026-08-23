using System;

namespace Application.DTOs.Inventory;

public class InventoryPurchaseResponseDto
{
    public int Id { get; set; }
    public int IngredientId { get; set; }
    public string IngredientName { get; set; } = null!;
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TotalAmount { get; set; }
    public string Reason { get; set; } = null!;
    public DateTime PurchaseDate { get; set; }
    public int CreatedById { get; set; }
    public string CreatedByName { get; set; } = null!;
}
