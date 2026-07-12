using Domain.Enums;

namespace Application.DTOs.Authentication;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public int EmployeeId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public EmployeeRole Role { get; set; }
}
