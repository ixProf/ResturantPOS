using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Application.DTOs.Orders;
using Application.Services.Interfaces;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost]
    [Authorize(Roles = "Waiter,Manager")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
    {
        int waiterId = GetCurrentUserId();
        var result = await _orderService.CreateOrderAsync(dto, waiterId);
        return CreatedAtAction(nameof(GetOrderById), new { id = result.Id }, result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOrderById(int id)
    {
        var order = await _orderService.GetOrderByIdAsync(id);
        return Ok(order);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllOrders([FromQuery] OrderStatus? status)
    {
        if (status.HasValue)
        {
            var filtered = await _orderService.GetOrdersByStatusAsync(status.Value);
            return Ok(filtered);
        }

        var orders = await _orderService.GetAllOrdersAsync();
        return Ok(orders);
    }

    [HttpPost("{id:int}/submit")]
    [Authorize(Roles = "Waiter,Manager")]
    public async Task<IActionResult> SubmitOrder(int id)
    {
        var result = await _orderService.SubmitOrderAsync(id);
        return Ok(result);
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        int employeeId = GetCurrentUserId();
        var result = await _orderService.UpdateOrderStatusAsync(id, dto, employeeId);
        return Ok(result);
    }

    [HttpPut("{id:int}/items/{itemId:int}/status")]
    public async Task<IActionResult> UpdateOrderItemStatus(int id, int itemId, [FromBody] UpdateOrderItemStatusDto dto)
    {
        int employeeId = GetCurrentUserId();
        var result = await _orderService.UpdateOrderItemStatusAsync(id, itemId, dto, employeeId);
        return Ok(result);
    }

    [HttpPost("{id:int}/items")]
    [Authorize(Roles = "Waiter,Manager")]
    public async Task<IActionResult> AddOrderItem(int id, [FromBody] AddOrderItemDto dto)
    {
        var result = await _orderService.AddOrderItemAsync(id, dto);
        return Ok(result);
    }

    [HttpDelete("{id:int}/items")]
    [Authorize(Roles = "Waiter,Manager")]
    public async Task<IActionResult> RemoveOrderItem(int id, [FromBody] RemoveOrderItemDto dto)
    {
        bool success = await _orderService.RemoveOrderItemAsync(id, dto);
        return success ? NoContent() : NotFound();
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> CancelOrder(int id, [FromBody] CancelOrderDto dto)
    {
        int employeeId = GetCurrentUserId();
        bool success = await _orderService.CancelOrderAsync(id, dto, employeeId);
        return success ? Ok(new { message = "Order cancelled successfully." }) : BadRequest();
    }

    [HttpPost("{id:int}/items/{itemId:int}/cancel")]
    public async Task<IActionResult> CancelOrderItem(int id, int itemId, [FromBody] CancelOrderDto dto)
    {
        int employeeId = GetCurrentUserId();
        bool success = await _orderService.CancelOrderItemAsync(id, itemId, dto, employeeId);
        return success ? Ok(new { message = "Order item cancelled." }) : BadRequest();
    }

    private int GetCurrentUserId()
    {
        string? val = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(val, out int userId) ? userId : 1;
    }
}
