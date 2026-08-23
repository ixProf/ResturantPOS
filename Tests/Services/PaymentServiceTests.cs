using System;
using System.Threading;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Payments;
using Application.Services.Interfaces;
using Domain.Enums;
using Domain.Models;
using FluentAssertions;
using Infrastructure.Services.Implementations;
using Moq;
using Xunit;

namespace Tests.Services;

public class PaymentServiceTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IRepository<Order>> _mockOrderRepo;
    private readonly Mock<IRepository<Payment>> _mockPaymentRepo;
    private readonly Mock<IRepository<Employee>> _mockEmployeeRepo;
    private readonly Mock<IRepository<Discount>> _mockDiscountRepo;
    private readonly Mock<IInventoryService> _mockInventoryService;
    private readonly Mock<IOrderNotificationService> _mockNotificationService;
    private readonly Mock<IDisposable> _mockTransaction;
    private readonly PaymentService _service;

    public PaymentServiceTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockOrderRepo = new Mock<IRepository<Order>>();
        _mockPaymentRepo = new Mock<IRepository<Payment>>();
        _mockEmployeeRepo = new Mock<IRepository<Employee>>();
        _mockDiscountRepo = new Mock<IRepository<Discount>>();
        _mockInventoryService = new Mock<IInventoryService>();
        _mockNotificationService = new Mock<IOrderNotificationService>();
        _mockTransaction = new Mock<IDisposable>();

        _mockUnitOfWork.Setup(u => u.Orders).Returns(_mockOrderRepo.Object);
        _mockUnitOfWork.Setup(u => u.Payments).Returns(_mockPaymentRepo.Object);
        _mockUnitOfWork.Setup(u => u.Employees).Returns(_mockEmployeeRepo.Object);
        _mockUnitOfWork.Setup(u => u.Discounts).Returns(_mockDiscountRepo.Object);
        _mockUnitOfWork.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(_mockTransaction.Object);

        _service = new PaymentService(_mockUnitOfWork.Object, _mockInventoryService.Object, _mockNotificationService.Object);
    }

    [Fact]
    public async Task ApplyDiscountAsync_ValidOrder_UpdatesFinalAmountAndSavesDiscount()
    {
        var order = new Order
        {
            Id = 10,
            TotalAmount = 100.00m,
            DiscountAmount = 0,
            FinalAmount = 100.00m,
            Status = OrderStatus.Served
        };

        var approver = new Employee { Id = 3, FullName = "Manager Mark", Role = EmployeeRole.Manager };
        var dto = new ApplyDiscountDto { DiscountAmount = 15.00m, Reason = "VIP Guest" };

        _mockOrderRepo.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(order);
        _mockEmployeeRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(approver);

        bool result = await _service.ApplyDiscountAsync(10, dto, 3);

        result.Should().BeTrue();
        order.DiscountAmount.Should().Be(15.00m);
        order.FinalAmount.Should().Be(85.00m);

        _mockDiscountRepo.Verify(r => r.AddAsync(It.Is<Discount>(d => d.DiscountAmount == 15.00m && d.OrderId == 10)), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ApplyDiscountAsync_CompletedOrder_ThrowsInvalidOperationException()
    {
        var order = new Order { Id = 10, Status = OrderStatus.Completed };
        var dto = new ApplyDiscountDto { DiscountAmount = 10.00m, Reason = "Test" };

        _mockOrderRepo.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(order);

        Func<Task> act = async () => await _service.ApplyDiscountAsync(10, dto, 3);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*completed order*");
    }
}
