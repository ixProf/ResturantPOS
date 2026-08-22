using Application.DTOs.Orders;
using Domain.Enums;

namespace Application.Services.Interfaces;

public interface IOrderService
{
    Task<OrderResponseDto> CreateOrderAsync(CreateOrderDto dto, int waiterId);
    Task<OrderDetailsDto> GetOrderByIdAsync(int id);
    Task<IEnumerable<OrderSummaryDto>> GetAllOrdersAsync();
    Task<IEnumerable<OrderSummaryDto>> GetOrdersByStatusAsync(OrderStatus status);
    Task<OrderResponseDto> SubmitOrderAsync(int orderId);
    Task<OrderResponseDto> UpdateOrderStatusAsync(int id, UpdateOrderStatusDto dto, int employeeId);
    Task<OrderResponseDto> UpdateOrderItemStatusAsync(int orderId, int itemId, UpdateOrderItemStatusDto dto, int employeeId);
    Task<OrderResponseDto> AddOrderItemAsync(int orderId, AddOrderItemDto dto);
    Task<bool> RemoveOrderItemAsync(int orderId, RemoveOrderItemDto dto);
    Task<bool> CancelOrderAsync(int orderId, CancelOrderDto dto, int employeeId);
    Task<bool> CancelOrderItemAsync(int orderId, int itemId, CancelOrderDto dto, int employeeId);
    Task<bool> ValidateStockForOrderAsync(int orderId);
}
