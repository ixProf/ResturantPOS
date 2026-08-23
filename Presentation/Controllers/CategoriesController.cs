using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Menu.Categories;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly IMenuService _menuService;
    private readonly IOrderNotificationService _notificationService;

    public CategoriesController(IMenuService menuService, IOrderNotificationService notificationService)
    {
        _menuService = menuService;
        _notificationService = notificationService;
    }

    [HttpPost]
    [Authorize(Roles = "Manager,Chef")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        var category = await _menuService.CreateCategoryAsync(dto);
        _ = _notificationService.NotifyMenuUpdatedAsync(null, "CategoryCreated");
        return CreatedAtAction(nameof(GetCategoryById), new { id = category.Id }, category);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategoryById(int id)
    {
        var category = await _menuService.GetCategoryByIdAsync(id);
        return Ok(category);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllCategories()
    {
        var categories = await _menuService.GetAllCategoriesAsync();
        return Ok(categories);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Manager,Chef")]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateCategoryDto dto)
    {
        var updated = await _menuService.UpdateCategoryAsync(id, dto);
        _ = _notificationService.NotifyMenuUpdatedAsync(null, "CategoryUpdated");
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Manager,Chef")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        bool success = await _menuService.DeleteCategoryAsync(id);
        if (success) _ = _notificationService.NotifyMenuUpdatedAsync(null, "CategoryDeleted");
        return success ? NoContent() : NotFound();
    }
}
