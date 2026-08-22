using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.Common.Security;
using Application.DTOs.Employees;
using Application.Services.Interfaces;
using Domain.Models;

namespace Infrastructure.Services.Implementations;

public class ManagerService : IManagerService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public ManagerService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    public async Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto dto)
    {
        bool emailExists = await _unitOfWork.Employees.AnyAsync(e => e.Email == dto.Email);
        if (emailExists)
        {
            throw new InvalidOperationException($"Employee with email '{dto.Email}' already exists.");
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

        return MapToEmployeeDto(employee);
    }

    public async Task<EmployeeDto> GetEmployeeByIdAsync(int id)
    {
        var employee = await _unitOfWork.Employees.GetByIdAsync(id);
        if (employee == null)
            throw new KeyNotFoundException($"Employee with ID '{id}' was not found.");

        return MapToEmployeeDto(employee);
    }

    public async Task<IEnumerable<EmployeeDto>> GetAllEmployeesAsync()
    {
        var employees = await _unitOfWork.Employees.GetAllAsync();
        return employees.Select(MapToEmployeeDto);
    }

    public async Task<EmployeeDto> UpdateEmployeeAsync(int id, UpdateEmployeeDto dto)
    {
        var employee = await _unitOfWork.Employees.GetByIdAsync(id);
        if (employee == null)
            throw new KeyNotFoundException($"Employee with ID '{id}' was not found.");

        employee.FullName = dto.FullName;
        employee.Email = dto.Email;
        employee.Phone = dto.Phone;
        employee.Role = dto.Role;
        if (dto.IsActive.HasValue)
        {
            employee.IsActive = dto.IsActive.Value;
        }

        _unitOfWork.Employees.Update(employee);
        await _unitOfWork.SaveChangesAsync();
        return MapToEmployeeDto(employee);
    }

    public async Task<EmployeeDto> UpdateEmployeeStatusAsync(int id, UpdateEmployeeStatusDto dto)
    {
        var employee = await _unitOfWork.Employees.GetByIdAsync(id);
        if (employee == null)
            throw new KeyNotFoundException($"Employee with ID '{id}' was not found.");

        employee.IsActive = dto.IsActive;
        _unitOfWork.Employees.Update(employee);
        await _unitOfWork.SaveChangesAsync();
        return MapToEmployeeDto(employee);
    }

    public async Task<bool> DeleteEmployeeAsync(int id)
    {
        var employee = await _unitOfWork.Employees.GetByIdAsync(id);
        if (employee == null)
            return false;

        _unitOfWork.Employees.Remove(employee);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private static EmployeeDto MapToEmployeeDto(Employee e)
    {
        return new EmployeeDto
        {
            Id = e.Id,
            FullName = e.FullName,
            Email = e.Email,
            Phone = e.Phone,
            Role = e.Role,
            IsActive = e.IsActive,
            CreatedAt = e.CreatedAt ?? DateTime.UtcNow
        };
    }
}

