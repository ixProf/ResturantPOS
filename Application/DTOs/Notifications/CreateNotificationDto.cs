using Domain.Enums;

namespace Application.DTOs.Notifications;

public class CreateNotificationDto
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int? EmployeeId { get; set; }
    public EmployeeRole? TargetRole { get; set; }
}
