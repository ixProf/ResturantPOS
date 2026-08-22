using Application.DTOs.Menu;
using Application.DTOs.Menu.Categories;

namespace Application.Services.Interfaces;

public interface IMenuService
{
    // Menu Items
    Task<MenuItemDto> CreateMenuItemAsync(CreateMenuItemDto dto);
    Task<MenuItemDetailsDto> GetMenuItemByIdAsync(int id);
    Task<IEnumerable<MenuItemDto>> GetAllMenuItemsAsync(MenuFilterDto? filter = null);
    Task<MenuItemDto> UpdateMenuItemAsync(int id, UpdateMenuItemDto dto);
    Task<MenuItemDto> UpdateMenuItemStatusAsync(int id, UpdateMenuItemStatusDto dto);
    Task<bool> DeleteMenuItemAsync(int id);

    // Recipe Management
    Task<bool> AddIngredientToMenuItemAsync(int menuItemId, int ingredientId, decimal quantityUsed);
    Task<bool> RemoveIngredientFromMenuItemAsync(int menuItemId, int ingredientId);

    // Categories
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto);
    Task<CategoryDto> GetCategoryByIdAsync(int id);
    Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync();
    Task<CategoryDto> UpdateCategoryAsync(int id, UpdateCategoryDto dto);
    Task<bool> DeleteCategoryAsync(int id);
}
