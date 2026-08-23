using System.Threading.Tasks;
using Application.Common.Interfaces;
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
    private readonly IOrderNotificationService _notificationService;

    public MenuItemsController(IMenuService menuService, IOrderNotificationService notificationService)
    {
        _menuService = menuService;
        _notificationService = notificationService;
    }

    [HttpPost]
    [Authorize(Roles = "Manager,Chef")]
    public async Task<IActionResult> CreateMenuItem([FromBody] CreateMenuItemDto dto)
    {
        var result = await _menuService.CreateMenuItemAsync(dto);
        _ = _notificationService.NotifyMenuUpdatedAsync(result.Id, "Created");
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

    [HttpGet("available")]
    [Authorize(Roles = "Manager,Chef,Waiter,Cashier")]
    public async Task<IActionResult> GetAvailableMenuItems()
    {
        var result = await _menuService.GetAvailableMenuItemsAsync();
        return Ok(result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Manager,Chef")]
    public async Task<IActionResult> UpdateMenuItem(int id, [FromBody] UpdateMenuItemDto dto)
    {
        var result = await _menuService.UpdateMenuItemAsync(id, dto);
        _ = _notificationService.NotifyMenuUpdatedAsync(id, "Updated");
        return Ok(result);
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Manager,Chef")]
    public async Task<IActionResult> UpdateMenuItemStatus(int id, [FromBody] UpdateMenuItemStatusDto dto)
    {
        var result = await _menuService.UpdateMenuItemStatusAsync(id, dto);
        _ = _notificationService.NotifyMenuUpdatedAsync(id, "StatusUpdated");
        return Ok(result);
    }

    [HttpPost("{id:int}/ingredients")]
    [Authorize(Roles = "Manager,Chef,InventoryManager")]
    public async Task<IActionResult> AddIngredient(int id, [FromQuery] int ingredientId, [FromQuery] decimal quantityUsed)
    {
        bool success = await _menuService.AddIngredientToMenuItemAsync(id, ingredientId, quantityUsed);
        if (success) _ = _notificationService.NotifyMenuUpdatedAsync(id, "RecipeUpdated");
        return success ? Ok(new { message = "Ingredient added to menu item recipe." }) : BadRequest();
    }

    [HttpDelete("{id:int}/ingredients/{ingredientId:int}")]
    [Authorize(Roles = "Manager,Chef,InventoryManager")]
    public async Task<IActionResult> RemoveIngredient(int id, int ingredientId)
    {
        bool success = await _menuService.RemoveIngredientFromMenuItemAsync(id, ingredientId);
        if (success) _ = _notificationService.NotifyMenuUpdatedAsync(id, "RecipeUpdated");
        return success ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Manager,Chef")]
    public async Task<IActionResult> DeleteMenuItem(int id)
    {
        bool success = await _menuService.DeleteMenuItemAsync(id);
        if (success) _ = _notificationService.NotifyMenuUpdatedAsync(id, "Deleted");
        return success ? NoContent() : NotFound();
    }

    [HttpGet("ingredients")]
    [Authorize(Roles = "Manager,Chef,InventoryManager")]
    public async Task<IActionResult> GetAllRecipeIngredients()
    {
        var result = await _menuService.GetAllIngredientsAsync();
        return Ok(result);
    }
}
