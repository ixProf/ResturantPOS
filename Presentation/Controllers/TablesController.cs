using System.Security.Claims;
using System.Threading.Tasks;
using Application.DTOs.Tables;
using Application.Services.Interfaces;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TablesController : ControllerBase
{
    private readonly ITableService _tableService;

    public TablesController(ITableService tableService)
    {
        _tableService = tableService;
    }

    [HttpPost]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> CreateTable([FromBody] CreateTableDto dto)
    {
        var table = await _tableService.CreateTableAsync(dto);
        return CreatedAtAction(nameof(GetTableById), new { id = table.Id }, table);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetTableById(int id)
    {
        var table = await _tableService.GetTableByIdAsync(id);
        return Ok(table);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllTables([FromQuery] TableStatus? status)
    {
        if (status.HasValue)
        {
            var filtered = await _tableService.GetTablesByStatusAsync(status.Value);
            return Ok(filtered);
        }

        var tables = await _tableService.GetAllTablesAsync();
        return Ok(tables);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> UpdateTable(int id, [FromBody] UpdateTableDto dto)
    {
        var updated = await _tableService.UpdateTableAsync(id, dto);
        return Ok(updated);
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateTableStatus(int id, [FromBody] UpdateTableStatusDto dto)
    {
        var updated = await _tableService.UpdateTableStatusAsync(id, dto);
        return Ok(updated);
    }

    [HttpPost("transfer")]
    [Authorize(Roles = "Waiter,Manager")]
    public async Task<IActionResult> TransferTable([FromBody] TransferTableDto dto)
    {
        int employeeId = GetCurrentUserId();
        bool success = await _tableService.TransferTableAsync(dto, employeeId);
        return success ? Ok(new { message = "Table transferred successfully." }) : BadRequest();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> DeleteTable(int id)
    {
        bool success = await _tableService.DeleteTableAsync(id);
        return success ? NoContent() : NotFound();
    }

    private int GetCurrentUserId()
    {
        string? val = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(val, out int userId) ? userId : 1;
    }
}
