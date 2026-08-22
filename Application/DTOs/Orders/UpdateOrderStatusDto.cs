using Domain.Enums;

namespace Application.DTOs.Orders;

public class UpdateOrderStatusDto
{
    public OrderStatus Status { get; set; }
    public string? Notes { get; set; }
}