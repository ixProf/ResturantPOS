using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Inventory;
using Domain.Enums;
using Domain.Models;
using FluentAssertions;
using Infrastructure.Services.Implementations;
using Moq;
using Xunit;

namespace Tests.Services;

public class InventoryServiceTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IRepository<Ingredient>> _mockIngredientRepo;
    private readonly Mock<IRepository<InventoryLog>> _mockLogRepo;
    private readonly Mock<IDisposable> _mockTransaction;
    private readonly InventoryService _service;

    public InventoryServiceTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockIngredientRepo = new Mock<IRepository<Ingredient>>();
        _mockLogRepo = new Mock<IRepository<InventoryLog>>();
        _mockTransaction = new Mock<IDisposable>();

        _mockUnitOfWork.Setup(u => u.Ingredients).Returns(_mockIngredientRepo.Object);
        _mockUnitOfWork.Setup(u => u.InventoryLogs).Returns(_mockLogRepo.Object);
        _mockUnitOfWork.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(_mockTransaction.Object);

        _service = new InventoryService(_mockUnitOfWork.Object);
    }

    [Fact]
    public async Task AdjustStockAsync_ValidIngredient_UpdatesStockAndAddsLog()
    {
        var ingredient = new Ingredient
        {
            Id = 5,
            Name = "Cheese",
            TotalStock = 10.0m,
            Unit = "kg"
        };

        var dto = new StockAdjustmentDto
        {
            IngredientId = 5,
            Quantity = 5.5m,
            Reason = "Delivery restock",
            Type = InventoryReasonType.Restock
        };

        _mockIngredientRepo.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(ingredient);

        var result = await _service.AdjustStockAsync(dto);

        result.Should().NotBeNull();
        result.PreviousStock.Should().Be(10.0m);
        result.NewStock.Should().Be(15.5m);
        ingredient.TotalStock.Should().Be(15.5m);

        _mockLogRepo.Verify(r => r.AddAsync(It.Is<InventoryLog>(l => l.IngredientId == 5 && l.QuantityChange == 5.5m)), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AdjustStockAsync_NonExistentIngredient_ThrowsKeyNotFoundException()
    {
        var dto = new StockAdjustmentDto { IngredientId = 99, Quantity = 2.0m };
        _mockIngredientRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Ingredient?)null);

        Func<Task> act = async () => await _service.AdjustStockAsync(dto);

        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*99*");
    }
}
