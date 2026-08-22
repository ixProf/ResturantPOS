using System;
using Domain.Enums;

namespace Application.DTOs.Notifications;

public class NotificationDto
{
    public int Id { get; set; }
    public int? EmployeeId { get; set; }
    public EmployeeRole? TargetRole { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? TargetUrl { get; set; }
}

