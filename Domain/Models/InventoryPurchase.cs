using System;

namespace Domain.Models;

public class InventoryPurchase
{
    public int Id { get; set; }
    public int IngredientId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TotalAmount { get; set; }
    public string Reason { get; set; } = null!;
    public DateTime PurchaseDate { get; set; }
    public int CreatedById { get; set; }

    public virtual Ingredient Ingredient { get; set; } = null!;
    public virtual Employee CreatedBy { get; set; } = null!;
}
