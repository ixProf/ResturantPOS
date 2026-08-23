using System.Threading.Tasks;
using Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Presentation.Hubs;

namespace Presentation.Services;

public class OrderNotificationService : IOrderNotificationService
{
    private readonly IHubContext<OrderHub> _hubContext;

    public OrderNotificationService(IHubContext<OrderHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyOrderUpdatedAsync(int orderId, string action)
    {
        if (_hubContext != null)
        {
            await _hubContext.Clients.All.SendAsync("ReceiveOrderUpdate", new { orderId, action });
        }
    }

    public async Task NotifyOrderReadyForWaiterAsync(int orderId, int tableId, int tableNumber)
    {
        if (_hubContext != null)
        {
            var payload = new
            {
                orderId,
                tableId,
                tableNumber,
                timestamp = System.DateTime.UtcNow,
                message = $"Order #{orderId} for Table {tableNumber} is ready to be served!"
            };
            await _hubContext.Clients.All.SendAsync("OrderReadyForWaiter", payload);
            await _hubContext.Clients.All.SendAsync("ReceiveOrderUpdate", new { orderId, action = "Ready", tableId, tableNumber });
        }
    }

    public async Task NotifySalesUpdatedAsync(int orderId, int paymentId, decimal amount)
    {
        if (_hubContext != null)
        {
            var payload = new
            {
                orderId,
                paymentId,
                amount,
                timestamp = System.DateTime.UtcNow
            };
            await _hubContext.Clients.All.SendAsync("SalesUpdated", payload);
            await _hubContext.Clients.All.SendAsync("ReceiveOrderUpdate", new { orderId, action = "PaymentCompleted", paymentId, amount });
        }
    }
}
