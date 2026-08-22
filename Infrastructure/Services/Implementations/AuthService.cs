using System;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.Common.Security;
using Application.DTOs.Authentication;
using Application.Services.Interfaces;
using Domain.Models;

namespace Infrastructure.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public AuthService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher, IJwtTokenGenerator tokenGenerator)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var employee = await _unitOfWork.Employees
            .SingleOrDefaultAsync(e => e.Email == dto.Email);

        if (employee == null || !employee.IsActive)
        {
            throw new InvalidOperationException("Invalid credentials or inactive account.");
        }

        bool isValidPassword = _passwordHasher.VerifyPassword(dto.Password, employee.PasswordHash);
        if (!isValidPassword)
        {
            throw new InvalidOperationException("Invalid credentials.");
        }

        string token = _tokenGenerator.GenerateToken(employee);

        return new AuthResponseDto
        {
            Token = token,
            EmployeeId = employee.Id,
            FullName = employee.FullName,
            Email = employee.Email,
            Role = employee.Role
        };
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        bool emailExists = await _unitOfWork.Employees.AnyAsync(e => e.Email == dto.Email);
        if (emailExists)
        {
            throw new InvalidOperationException($"An employee with email '{dto.Email}' already exists.");
        }

        string passwordHash = _passwordHasher.HashPassword(dto.Password);

        var employee = new Employee
        {
            FullName = dto.FullName,
            Email = dto.Email,
            PasswordHash = passwordHash,
            Phone = dto.Phone,
            Role = dto.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Employees.AddAsync(employee);
        await _unitOfWork.SaveChangesAsync();

        string token = _tokenGenerator.GenerateToken(employee);

        return new AuthResponseDto
        {
            Token = token,
            EmployeeId = employee.Id,
            FullName = employee.FullName,
            Email = employee.Email,
            Role = employee.Role
        };
    }
}

