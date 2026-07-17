using Application.DTOs.Employees;

namespace Application.Services.Interfaces;

public interface IManagerService
{
    Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto dto);
    Task<EmployeeDto> GetEmployeeByIdAsync(int id);
    Task<IEnumerable<EmployeeDto>> GetAllEmployeesAsync();
    Task<EmployeeDto> UpdateEmployeeAsync(int id, UpdateEmployeeDto dto);
    Task<EmployeeDto> UpdateEmployeeStatusAsync(int id, UpdateEmployeeStatusDto dto);
    Task<bool> DeleteEmployeeAsync(int id);
}