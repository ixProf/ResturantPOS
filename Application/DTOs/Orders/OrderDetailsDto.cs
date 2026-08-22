using Domain.Enums;

namespace Application.DTOs.Orders;

public class OrderDetailsDto
{
    public int Id { get; set; }
    public int TableId { get; set; }
    public int TableNumber { get; set; }
    public int WaiterId { get; set; }
    public string WaiterName { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal FinalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CancellationReason { get; set; }
    public List<OrderItemDto> Items { get; set; } = [];
}