using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Orders;
using Application.Services.Interfaces;
using Domain.Enums;
using Domain.Models;
using FluentAssertions;
using Infrastructure.Services.Implementations;
using Moq;
using Xunit;

namespace Tests.Services;

public class OrderServiceTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IRepository<Order>> _mockOrderRepo;
    private readonly Mock<IRepository<RestaurantTable>> _mockTableRepo;
    private readonly Mock<IRepository<Employee>> _mockEmployeeRepo;
    private readonly Mock<IRepository<MenuItem>> _mockMenuItemRepo;
    private readonly Mock<IInventoryService> _mockInventoryService;
    private readonly Mock<IDisposable> _mockTransaction;
    private readonly OrderService _service;

    public OrderServiceTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockOrderRepo = new Mock<IRepository<Order>>();
        _mockTableRepo = new Mock<IRepository<RestaurantTable>>();
        _mockEmployeeRepo = new Mock<IRepository<Employee>>();
        _mockMenuItemRepo = new Mock<IRepository<MenuItem>>();
        _mockInventoryService = new Mock<IInventoryService>();
        _mockTransaction = new Mock<IDisposable>();

        _mockUnitOfWork.Setup(u => u.Orders).Returns(_mockOrderRepo.Object);
        _mockUnitOfWork.Setup(u => u.Tables).Returns(_mockTableRepo.Object);
        _mockUnitOfWork.Setup(u => u.Employees).Returns(_mockEmployeeRepo.Object);
        _mockUnitOfWork.Setup(u => u.MenuItems).Returns(_mockMenuItemRepo.Object);
        _mockUnitOfWork.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(_mockTransaction.Object);

        _service = new OrderService(_mockUnitOfWork.Object, _mockInventoryService.Object);
    }

    [Fact]
    public async Task CreateOrderAsync_ValidRequest_CreatesDraftOrderAndOccupyTable()
    {
        // Arrange
        var dto = new CreateOrderDto
        {
            TableId = 1,
            Items = new List<AddOrderItemDto>
            {
                new AddOrderItemDto { MenuItemId = 10, Quantity = 2 }
            }
        };

        var table = new RestaurantTable { Id = 1, TableNumber = 5, Status = TableStatus.Available };
        var waiter = new Employee { Id = 2, FullName = "Jane Waiter", Role = EmployeeRole.Waiter };
        var menuItem = new MenuItem { Id = 10, Name = "Steak", Price = 25.00m, IsAvailable = true };

        _mockTableRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(table);
        _mockEmployeeRepo.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(waiter);
        _mockMenuItemRepo.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(menuItem);

        // Act
        var response = await _service.CreateOrderAsync(dto, 2);

        // Assert
        response.Should().NotBeNull();
        response.Status.Should().Be(OrderStatus.Draft);
        response.TotalAmount.Should().Be(50.00m);
        table.Status.Should().Be(TableStatus.Occupied);

        _mockOrderRepo.Verify(r => r.AddAsync(It.IsAny<Order>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateOrderAsync_TableOutOfService_ThrowsInvalidOperationException()
    {
        // Arrange
        var dto = new CreateOrderDto { TableId = 1 };
        var table = new RestaurantTable { Id = 1, TableNumber = 5, Status = TableStatus.OutOfService };

        _mockTableRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(table);

        // Act
        Func<Task> act = async () => await _service.CreateOrderAsync(dto, 2);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*out of service*");
    }
}
