using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Menu;
using Application.DTOs.Menu.Categories;
using Domain.Models;
using FluentAssertions;
using Infrastructure.Services.Implementations;
using Moq;
using Xunit;

namespace Tests.Services;

public class MenuServiceTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IRepository<MenuItem>> _mockMenuItemRepo;
    private readonly Mock<IRepository<Category>> _mockCategoryRepo;
    private readonly Mock<IRepository<Ingredient>> _mockIngredientRepo;
    private readonly Mock<IRepository<MenuItemIngredient>> _mockMenuItemIngredientRepo;
    private readonly MenuService _service;

    public MenuServiceTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMenuItemRepo = new Mock<IRepository<MenuItem>>();
        _mockCategoryRepo = new Mock<IRepository<Category>>();
        _mockIngredientRepo = new Mock<IRepository<Ingredient>>();
        _mockMenuItemIngredientRepo = new Mock<IRepository<MenuItemIngredient>>();

        _mockUnitOfWork.Setup(u => u.MenuItems).Returns(_mockMenuItemRepo.Object);
        _mockUnitOfWork.Setup(u => u.Categories).Returns(_mockCategoryRepo.Object);
        _mockUnitOfWork.Setup(u => u.Ingredients).Returns(_mockIngredientRepo.Object);
        _mockUnitOfWork.Setup(u => u.MenuItemIngredients).Returns(_mockMenuItemIngredientRepo.Object);

        _service = new MenuService(_mockUnitOfWork.Object);
    }

    [Fact]
    public async Task CreateMenuItemAsync_ValidDto_CreatesAndReturnsMenuItem()
    {
        var dto = new CreateMenuItemDto
        {
            Name = "Burger",
            Price = 12.99m,
            CategoryId = 1,
            IsAvailable = true
        };

        var category = new Category { Id = 1, Name = "Main Courses" };
        _mockCategoryRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(category);

        var result = await _service.CreateMenuItemAsync(dto);

        result.Should().NotBeNull();
        result.Name.Should().Be("Burger");
        result.Price.Should().Be(12.99m);
        result.CategoryName.Should().Be("Main Courses");
        _mockMenuItemRepo.Verify(r => r.AddAsync(It.IsAny<MenuItem>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task GetAllIngredientsAsync_ReturnsIngredientsList()
    {
        var ingredients = new List<Ingredient>
        {
            new Ingredient { Id = 1, Name = "Tomato", TotalStock = 50, Unit = "kg" },
            new Ingredient { Id = 2, Name = "Cheese", TotalStock = 20, Unit = "kg" }
        };

        _mockIngredientRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(ingredients);

        var result = await _service.GetAllIngredientsAsync();

        result.Should().HaveCount(2);
        result.First().Name.Should().Be("Tomato");
    }

    [Fact]
    public async Task DeleteMenuItemAsync_ExistingId_DeletesAndReturnsTrue()
    {
        var menuItem = new MenuItem { Id = 10, Name = "Pizza" };
        _mockMenuItemRepo.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(menuItem);

        var result = await _service.DeleteMenuItemAsync(10);

        result.Should().BeTrue();
        _mockMenuItemRepo.Verify(r => r.Remove(menuItem), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task GetCategoryByIdAsync_ExistingId_ReturnsCategory()
    {
        var category = new Category { Id = 3, Name = "Desserts", Description = "Sweet treats" };
        _mockCategoryRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(category);

        var result = await _service.GetCategoryByIdAsync(3);

        result.Should().NotBeNull();
        result.Name.Should().Be("Desserts");
        result.Description.Should().Be("Sweet treats");
    }
}
