using Domain.Enums;

namespace Application.DTOs.Orders;

public class OrderItemDto
{
    public int Id { get; set; }
    public int MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public OrderItemStatus Status { get; set; }
    public string? Notes { get; set; }
    public string? CancellationReason { get; set; }
}