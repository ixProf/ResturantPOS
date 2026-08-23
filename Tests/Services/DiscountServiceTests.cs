using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Discounts;
using Domain.Enums;
using Domain.Models;
using FluentAssertions;
using Infrastructure.Services.Implementations;
using Moq;
using Xunit;

namespace Tests.Services;

public class DiscountServiceTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IRepository<Discount>> _mockDiscountRepo;
    private readonly Mock<IRepository<Employee>> _mockEmployeeRepo;
    private readonly DiscountService _service;

    public DiscountServiceTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockDiscountRepo = new Mock<IRepository<Discount>>();
        _mockEmployeeRepo = new Mock<IRepository<Employee>>();

        _mockUnitOfWork.Setup(u => u.Discounts).Returns(_mockDiscountRepo.Object);
        _mockUnitOfWork.Setup(u => u.Employees).Returns(_mockEmployeeRepo.Object);

        _service = new DiscountService(_mockUnitOfWork.Object);
    }

    [Fact]
    public async Task CreateDiscountAsync_ValidManager_CreatesDiscountSuccessfully()
    {
        var manager = new Employee { Id = 1, FullName = "Sarah Manager", Role = EmployeeRole.Manager };
        _mockEmployeeRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(manager);

        var dto = new CreateDiscountDto
        {
            Name = "VIP 10%",
            Type = DiscountType.Percentage,
            Value = 10.0m,
            Reason = "Loyalty Program",
            IsActive = true,
            IsApproved = true
        };

        var result = await _service.CreateDiscountAsync(dto, 1);

        result.Should().NotBeNull();
        result.Name.Should().Be("VIP 10%");
        result.Value.Should().Be(10.0m);
        result.Type.Should().Be(DiscountType.Percentage);

        _mockDiscountRepo.Verify(r => r.AddAsync(It.Is<Discount>(d => d.Name == "VIP 10%" && d.Value == 10.0m)), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateDiscountAsync_PercentageGreaterThan100_ThrowsArgumentException()
    {
        var dto = new CreateDiscountDto
        {
            Name = "Invalid Discount",
            Type = DiscountType.Percentage,
            Value = 150.0m,
            Reason = "Testing bounds"
        };

        Func<Task> act = async () => await _service.CreateDiscountAsync(dto, 1);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Percentage discount cannot exceed 100%*");
    }

    [Fact]
    public async Task DeleteDiscountAsync_ValidId_RemovesDiscount()
    {
        var discount = new Discount { Id = 5, Name = "Seasonal Promo" };
        _mockDiscountRepo.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(discount);

        bool result = await _service.DeleteDiscountAsync(5);

        result.Should().BeTrue();
        _mockDiscountRepo.Verify(r => r.Remove(discount), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
