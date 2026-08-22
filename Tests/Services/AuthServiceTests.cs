using System;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.Common.Security;
using Application.DTOs.Authentication;
using Domain.Enums;
using Domain.Models;
using FluentAssertions;
using Infrastructure.Services.Implementations;
using Moq;
using Xunit;

namespace Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IRepository<Employee>> _mockEmployeeRepo;
    private readonly Mock<IPasswordHasher> _mockPasswordHasher;
    private readonly Mock<IJwtTokenGenerator> _mockTokenGenerator;
    private readonly AuthService _service;

    public AuthServiceTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockEmployeeRepo = new Mock<IRepository<Employee>>();
        _mockPasswordHasher = new Mock<IPasswordHasher>();
        _mockTokenGenerator = new Mock<IJwtTokenGenerator>();

        _mockUnitOfWork.Setup(u => u.Employees).Returns(_mockEmployeeRepo.Object);

        _service = new AuthService(
            _mockUnitOfWork.Object,
            _mockPasswordHasher.Object,
            _mockTokenGenerator.Object
        );
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsLoginResponse()
    {
        var dto = new LoginDto { Email = "waiter@restaurant.com", Password = "password123" };
        var employee = new Employee
        {
            Id = 1,
            FullName = "John Waiter",
            Email = "waiter@restaurant.com",
            PasswordHash = "hashed_pass",
            Role = EmployeeRole.Waiter,
            IsActive = true
        };

        _mockEmployeeRepo.Setup(r => r.SingleOrDefaultAsync(It.IsAny<Expression<Func<Employee, bool>>>()))
            .ReturnsAsync(employee);

        _mockPasswordHasher.Setup(p => p.VerifyPassword("password123", "hashed_pass"))
            .Returns(true);

        _mockTokenGenerator.Setup(t => t.GenerateToken(employee))
            .Returns("fake-jwt-token");

        var result = await _service.LoginAsync(dto);

        result.Should().NotBeNull();
        result.Token.Should().Be("fake-jwt-token");
        result.Email.Should().Be(employee.Email);
        result.Role.Should().Be(EmployeeRole.Waiter);
    }

    [Fact]
    public async Task LoginAsync_InvalidEmail_ThrowsInvalidOperationException()
    {
        var dto = new LoginDto { Email = "nonexistent@restaurant.com", Password = "password123" };

        _mockEmployeeRepo.Setup(r => r.SingleOrDefaultAsync(It.IsAny<Expression<Func<Employee, bool>>>()))
            .ReturnsAsync((Employee?)null);

        Func<Task> act = async () => await _service.LoginAsync(dto);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Invalid credentials*");
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ThrowsInvalidOperationException()
    {
        var dto = new LoginDto { Email = "waiter@restaurant.com", Password = "wrongpassword" };
        var employee = new Employee
        {
            Id = 1,
            Email = "waiter@restaurant.com",
            PasswordHash = "hashed_pass",
            IsActive = true
        };

        _mockEmployeeRepo.Setup(r => r.SingleOrDefaultAsync(It.IsAny<Expression<Func<Employee, bool>>>()))
            .ReturnsAsync(employee);

        _mockPasswordHasher.Setup(p => p.VerifyPassword("wrongpassword", "hashed_pass"))
            .Returns(false);

        Func<Task> act = async () => await _service.LoginAsync(dto);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Invalid credentials*");
    }
}
