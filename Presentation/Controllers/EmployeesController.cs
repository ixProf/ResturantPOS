using System.Threading.Tasks;
using Application.DTOs.Employees;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Manager")]
public class EmployeesController : ControllerBase
{
    private readonly IManagerService _managerService;

    public EmployeesController(IManagerService managerService)
    {
        _managerService = managerService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeDto dto)
    {
        var employee = await _managerService.CreateEmployeeAsync(dto);
        return CreatedAtAction(nameof(GetEmployeeById), new { id = employee.Id }, employee);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetEmployeeById(int id)
    {
        var employee = await _managerService.GetEmployeeByIdAsync(id);
        return Ok(employee);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllEmployees()
    {
        var employees = await _managerService.GetAllEmployeesAsync();
        return Ok(employees);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateEmployee(int id, [FromBody] UpdateEmployeeDto dto)
    {
        var updated = await _managerService.UpdateEmployeeAsync(id, dto);
        return Ok(updated);
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateEmployeeStatus(int id, [FromBody] UpdateEmployeeStatusDto dto)
    {
        var updated = await _managerService.UpdateEmployeeStatusAsync(id, dto);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteEmployee(int id)
    {
        bool success = await _managerService.DeleteEmployeeAsync(id);
        return success ? NoContent() : NotFound();
    }
}
