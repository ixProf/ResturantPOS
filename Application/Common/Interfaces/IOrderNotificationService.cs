using System.Threading.Tasks;

namespace Application.Common.Interfaces;

public interface IOrderNotificationService
{
    Task NotifyOrderUpdatedAsync(int orderId, string action);
    Task NotifyOrderReadyForWaiterAsync(int orderId, int tableId, int tableNumber);
    Task NotifySalesUpdatedAsync(int orderId, int paymentId, decimal amount);
}
