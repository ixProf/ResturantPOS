using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Inventory;
using Application.DTOs.Menu;
using Application.DTOs.Menu.Categories;
using Application.Services.Interfaces;
using Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Implementations;

public class MenuService : IMenuService
{
    private readonly IUnitOfWork _unitOfWork;

    public MenuService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<MenuItemDto> CreateMenuItemAsync(CreateMenuItemDto dto)
    {
        var menuItem = new MenuItem
        {
            Name = dto.Name,
            Price = dto.Price,
            CategoryId = dto.CategoryId,
            IsAvailable = dto.IsAvailable,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.MenuItems.AddAsync(menuItem);
        await _unitOfWork.SaveChangesAsync();

        var categoryName = dto.CategoryId.HasValue
            ? (await _unitOfWork.Categories.GetByIdAsync(dto.CategoryId.Value))?.Name ?? string.Empty
            : string.Empty;

        return MapToMenuItemDto(menuItem, categoryName);
    }

    public async Task<MenuItemDetailsDto> GetMenuItemByIdAsync(int id)
    {
        var item = await _unitOfWork.MenuItems.Query()
            .Include(m => m.Category)
            .Include(m => m.MenuItemIngredients)
                .ThenInclude(mi => mi.Ingredient)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (item == null)
            throw new KeyNotFoundException($"Menu item with ID '{id}' was not found.");

        return new MenuItemDetailsDto
        {
            Id = item.Id,
            Name = item.Name,
            Price = item.Price,
            CategoryId = item.CategoryId,
            CategoryName = item.Category?.Name ?? string.Empty,
            IsAvailable = item.IsAvailable ?? true,
            CreatedAt = item.CreatedAt ?? DateTime.UtcNow,
            Ingredients = item.MenuItemIngredients.Select(mi => new MenuItemIngredientDto
            {
                IngredientId = mi.IngredientId,
                IngredientName = mi.Ingredient.Name,
                QuantityUsed = mi.QuantityUsed,
                Unit = mi.Ingredient.Unit
            }).ToList()
        };
    }

    public async Task<IEnumerable<MenuItemDto>> GetAllMenuItemsAsync(MenuFilterDto? filter = null)
    {
        IQueryable<MenuItem> query = _unitOfWork.MenuItems.Query().Include(m => m.Category);

        if (filter != null)
        {
            if (filter.CategoryId.HasValue)
                query = query.Where(m => m.CategoryId == filter.CategoryId.Value);

            if (filter.IsAvailable.HasValue)
                query = query.Where(m => m.IsAvailable == filter.IsAvailable.Value);

            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
                query = query.Where(m => m.Name.Contains(filter.SearchTerm));
        }

        var items = await query.ToListAsync();
        return items.Select(m => MapToMenuItemDto(m, m.Category?.Name ?? string.Empty));
    }

    public async Task<IEnumerable<MenuItemDto>> GetAvailableMenuItemsAsync()
    {
        var items = await _unitOfWork.MenuItems.Query()
            .Include(m => m.Category)
            .Where(m => m.IsAvailable == true)
            .ToListAsync();
        return items.Select(m => MapToMenuItemDto(m, m.Category?.Name ?? string.Empty));
    }

    public async Task<MenuItemDto> UpdateMenuItemAsync(int id, UpdateMenuItemDto dto)
    {
        var item = await _unitOfWork.MenuItems.GetByIdAsync(id);
        if (item == null)
            throw new KeyNotFoundException($"Menu item with ID '{id}' was not found.");

        item.Name = dto.Name;
        item.Price = dto.Price;
        item.CategoryId = dto.CategoryId;
        item.IsAvailable = dto.IsAvailable;

        _unitOfWork.MenuItems.Update(item);
        await _unitOfWork.SaveChangesAsync();

        var categoryName = dto.CategoryId.HasValue
            ? (await _unitOfWork.Categories.GetByIdAsync(dto.CategoryId.Value))?.Name ?? string.Empty
            : string.Empty;

        return MapToMenuItemDto(item, categoryName);
    }

    public async Task<MenuItemDto> UpdateMenuItemStatusAsync(int id, UpdateMenuItemStatusDto dto)
    {
        var item = await _unitOfWork.MenuItems.Query().Include(m => m.Category).FirstOrDefaultAsync(m => m.Id == id);
        if (item == null)
            throw new KeyNotFoundException($"Menu item with ID '{id}' was not found.");

        item.IsAvailable = dto.IsAvailable;
        _unitOfWork.MenuItems.Update(item);
        await _unitOfWork.SaveChangesAsync();

        return MapToMenuItemDto(item, item.Category?.Name ?? string.Empty);
    }

    public async Task<bool> DeleteMenuItemAsync(int id)
    {
        var item = await _unitOfWork.MenuItems.GetByIdAsync(id);
        if (item == null)
            return false;

        _unitOfWork.MenuItems.Remove(item);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<IngredientDto>> GetAllIngredientsAsync()
    {
        var ingredients = await _unitOfWork.Ingredients.GetAllAsync();
        return ingredients.Select(i => new IngredientDto
        {
            Id = i.Id,
            Name = i.Name,
            TotalStock = i.TotalStock,
            Unit = i.Unit,
            LowStockAlert = i.LowStockAlert
        });
    }

    public async Task<bool> AddIngredientToMenuItemAsync(int menuItemId, int ingredientId, decimal quantityUsed)
    {
        var menuItem = await _unitOfWork.MenuItems.GetByIdAsync(menuItemId);
        if (menuItem == null)
            throw new KeyNotFoundException($"Menu item '{menuItemId}' not found.");

        var ingredient = await _unitOfWork.Ingredients.GetByIdAsync(ingredientId);
        if (ingredient == null)
            throw new KeyNotFoundException($"Ingredient '{ingredientId}' not found.");

        var existing = await _unitOfWork.MenuItemIngredients.Query()
            .FirstOrDefaultAsync(mi => mi.MenuItemId == menuItemId && mi.IngredientId == ingredientId);

        if (existing != null)
        {
            existing.QuantityUsed = quantityUsed;
            _unitOfWork.MenuItemIngredients.Update(existing);
        }
        else
        {
            await _unitOfWork.MenuItemIngredients.AddAsync(new MenuItemIngredient
            {
                MenuItemId = menuItemId,
                IngredientId = ingredientId,
                QuantityUsed = quantityUsed
            });
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveIngredientFromMenuItemAsync(int menuItemId, int ingredientId)
    {
        var existing = await _unitOfWork.MenuItemIngredients.Query()
            .FirstOrDefaultAsync(mi => mi.MenuItemId == menuItemId && mi.IngredientId == ingredientId);

        if (existing == null)
            return false;

        _unitOfWork.MenuItemIngredients.Remove(existing);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto)
    {
        var category = new Category
        {
            Name = dto.Name,
            Description = dto.Description
        };

        await _unitOfWork.Categories.AddAsync(category);
        await _unitOfWork.SaveChangesAsync();

        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description
        };
    }

    public async Task<CategoryDto> GetCategoryByIdAsync(int id)
    {
        var category = await _unitOfWork.Categories.GetByIdAsync(id);
        if (category == null)
            throw new KeyNotFoundException($"Category with ID '{id}' was not found.");

        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description
        };
    }

    public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
    {
        var categories = await _unitOfWork.Categories.GetAllAsync();
        return categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description
        });
    }

    public async Task<CategoryDto> UpdateCategoryAsync(int id, UpdateCategoryDto dto)
    {
        var category = await _unitOfWork.Categories.GetByIdAsync(id);
        if (category == null)
            throw new KeyNotFoundException($"Category with ID '{id}' was not found.");

        category.Name = dto.Name;
        category.Description = dto.Description;

        _unitOfWork.Categories.Update(category);
        await _unitOfWork.SaveChangesAsync();

        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description
        };
    }

    public async Task<bool> DeleteCategoryAsync(int id)
    {
        var category = await _unitOfWork.Categories.GetByIdAsync(id);
        if (category == null)
            return false;

        _unitOfWork.Categories.Remove(category);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private static MenuItemDto MapToMenuItemDto(MenuItem item, string categoryName)
    {
        return new MenuItemDto
        {
            Id = item.Id,
            Name = item.Name,
            Price = item.Price,
            CategoryId = item.CategoryId,
            CategoryName = categoryName,
            IsAvailable = item.IsAvailable ?? true
        };
    }
}

