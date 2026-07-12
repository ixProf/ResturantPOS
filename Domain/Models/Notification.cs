using System;
using Domain.Enums;

namespace Domain.Models;

public class Notification
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // If null, it could be broadcasted to a Role instead of a specific user
    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    
    public EmployeeRole? TargetRole { get; set; }
}
