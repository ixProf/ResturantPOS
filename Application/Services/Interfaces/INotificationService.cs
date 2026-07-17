using Application.DTOs.Notifications;
using Domain.Enums;

namespace Application.Services.Interfaces;

public interface INotificationService
{
    Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto);
    Task<NotificationDto> GetNotificationByIdAsync(int id);
    Task<IEnumerable<NotificationDto>> GetNotificationsForEmployeeAsync(int employeeId);
    Task<IEnumerable<NotificationDto>> GetNotificationsByRoleAsync(EmployeeRole role);
    Task<bool> MarkAsReadAsync(int id);
    Task<bool> MarkAllAsReadAsync(int employeeId);
    Task<bool> DeleteNotificationAsync(int id);
}
