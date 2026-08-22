using System.Threading.Tasks;
using Application.DTOs.Inventory;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "InventoryManager,Manager")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpPost("ingredients")]
    public async Task<IActionResult> CreateIngredient([FromBody] CreateIngredientDto dto)
    {
        var result = await _inventoryService.CreateIngredientAsync(dto);
        return CreatedAtAction(nameof(GetIngredientById), new { id = result.Id }, result);
    }

    [HttpGet("ingredients/{id:int}")]
    public async Task<IActionResult> GetIngredientById(int id)
    {
        var result = await _inventoryService.GetIngredientByIdAsync(id);
        return Ok(result);
    }

    [HttpGet("ingredients")]
    public async Task<IActionResult> GetAllIngredients()
    {
        var result = await _inventoryService.GetAllIngredientsAsync();
        return Ok(result);
    }

    [HttpPut("ingredients/{id:int}")]
    public async Task<IActionResult> UpdateIngredient(int id, [FromBody] UpdateIngredientDto dto)
    {
        var result = await _inventoryService.UpdateIngredientAsync(id, dto);
        return Ok(result);
    }

    [HttpPost("stock/adjust")]
    public async Task<IActionResult> AdjustStock([FromBody] StockAdjustmentDto dto)
    {
        var result = await _inventoryService.AdjustStockAsync(dto);
        return Ok(result);
    }

    [HttpGet("alerts/low-stock")]
    public async Task<IActionResult> GetLowStockAlerts()
    {
        var alerts = await _inventoryService.GetLowStockAlertsAsync();
        return Ok(alerts);
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetInventoryOverview()
    {
        var overview = await _inventoryService.GetInventoryOverviewAsync();
        return Ok(overview);
    }
}
