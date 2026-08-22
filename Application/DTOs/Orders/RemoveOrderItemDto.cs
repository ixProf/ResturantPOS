namespace Application.DTOs.Orders;

public class RemoveOrderItemDto
{
    public int OrderItemId { get; set; }
    public int? MenuItemId { get; set; }
}