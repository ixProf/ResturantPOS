using System.Threading.Tasks;
using Application.DTOs.Menu;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MenuItemsController : ControllerBase
{
    private readonly IMenuService _menuService;

    public MenuItemsController(IMenuService menuService)
    {
        _menuService = menuService;
    }

    [HttpPost]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> CreateMenuItem([FromBody] CreateMenuItemDto dto)
    {
        var result = await _menuService.CreateMenuItemAsync(dto);
        return CreatedAtAction(nameof(GetMenuItemById), new { id = result.Id }, result);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMenuItemById(int id)
    {
        var result = await _menuService.GetMenuItemByIdAsync(id);
        return Ok(result);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllMenuItems([FromQuery] MenuFilterDto? filter)
    {
        var result = await _menuService.GetAllMenuItemsAsync(filter);
        return Ok(result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> UpdateMenuItem(int id, [FromBody] UpdateMenuItemDto dto)
    {
        var result = await _menuService.UpdateMenuItemAsync(id, dto);
        return Ok(result);
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Manager,Chef")]
    public async Task<IActionResult> UpdateMenuItemStatus(int id, [FromBody] UpdateMenuItemStatusDto dto)
    {
        var result = await _menuService.UpdateMenuItemStatusAsync(id, dto);
        return Ok(result);
    }

    [HttpPost("{id:int}/ingredients")]
    [Authorize(Roles = "Manager,InventoryManager")]
    public async Task<IActionResult> AddIngredient(int id, [FromQuery] int ingredientId, [FromQuery] decimal quantityUsed)
    {
        bool success = await _menuService.AddIngredientToMenuItemAsync(id, ingredientId, quantityUsed);
        return success ? Ok(new { message = "Ingredient added to menu item recipe." }) : BadRequest();
    }

    [HttpDelete("{id:int}/ingredients/{ingredientId:int}")]
    [Authorize(Roles = "Manager,InventoryManager")]
    public async Task<IActionResult> RemoveIngredient(int id, int ingredientId)
    {
        bool success = await _menuService.RemoveIngredientFromMenuItemAsync(id, ingredientId);
        return success ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> DeleteMenuItem(int id)
    {
        bool success = await _menuService.DeleteMenuItemAsync(id);
        return success ? NoContent() : NotFound();
    }
}
