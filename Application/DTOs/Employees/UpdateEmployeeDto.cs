using Domain.Enums;

namespace Application.DTOs.Employees;

public class UpdateEmployeeDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public EmployeeRole Role { get; set; }
    public bool? IsActive { get; set; }
}
