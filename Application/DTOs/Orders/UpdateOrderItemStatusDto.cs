using Domain.Enums;

namespace Application.DTOs.Orders;

public class UpdateOrderItemStatusDto
{
    public OrderItemStatus Status { get; set; }
    public string? CancellationReason { get; set; }
}
