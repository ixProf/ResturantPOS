using Domain.Enums;

namespace Application.DTOs.Inventory;

public class StockTransactionDto
{
    public int Id { get; set; }
    public int IngredientId { get; set; }
    public string IngredientName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal QuantityChanged { get => Quantity; set => Quantity = value; }
    public decimal PreviousStock { get; set; }
    public decimal NewStock { get; set; }
    public InventoryReasonType ReasonType { get; set; }
    public string? ReasonDetail { get; set; }
    public string? Reason { get => ReasonDetail; set => ReasonDetail = value; }
    public DateTime CreatedAt { get; set; }
    public DateTime Timestamp { get => CreatedAt; set => CreatedAt = value; }
}