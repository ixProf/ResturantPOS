using System;
using System.Linq;
using System.Threading.Tasks;
using Application.Common.Security;
using Domain.Enums;
using FluentAssertions;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Tests.Services;

public class DatabaseSeederTests
{
    private readonly Mock<IPasswordHasher> _mockPasswordHasher;
    private readonly Mock<ILogger<DatabaseSeeder>> _mockLogger;

    public DatabaseSeederTests()
    {
        _mockPasswordHasher = new Mock<IPasswordHasher>();
        _mockPasswordHasher.Setup(p => p.HashPassword(It.IsAny<string>()))
            .Returns<string>(pw => $"HASHED_{pw}");
        _mockLogger = new Mock<ILogger<DatabaseSeeder>>();
    }

    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task SeedAsync_EmptyDatabase_SeedsFiveTestEmployees()
    {
        using var context = CreateInMemoryDbContext();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new[] { new System.Collections.Generic.KeyValuePair<string, string?>("Seed:CreateDefaultEmployees", "true") })
            .Build();

        var seeder = new DatabaseSeeder(context, _mockPasswordHasher.Object, config, _mockLogger.Object);

        await seeder.SeedAsync();

        var employees = await context.Employees.ToListAsync();
        employees.Should().HaveCount(5);

        employees.Select(e => e.Email).Should().Contain(new[]
        {
            "manager@alarisflowx.com",
            "waiter@alarisflowx.com",
            "chef@alarisflowx.com",
            "cashier@alarisflowx.com",
            "inventory@alarisflowx.com"
        });

        employees.Select(e => e.Role).Should().Contain(new[]
        {
            EmployeeRole.Manager,
            EmployeeRole.Waiter,
            EmployeeRole.Chef,
            EmployeeRole.Cashier,
            EmployeeRole.InventoryManager
        });

        employees.All(e => e.PasswordHash.StartsWith("HASHED_")).Should().BeTrue();
    }

    [Fact]
    public async Task SeedAsync_RunTwice_IsIdempotentAndDoesNotDuplicate()
    {
        using var context = CreateInMemoryDbContext();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new[] { new System.Collections.Generic.KeyValuePair<string, string?>("Seed:CreateDefaultEmployees", "true") })
            .Build();

        var seeder = new DatabaseSeeder(context, _mockPasswordHasher.Object, config, _mockLogger.Object);

        await seeder.SeedAsync();
        await seeder.SeedAsync(); // Second run

        var employees = await context.Employees.ToListAsync();
        employees.Should().HaveCount(5);
    }

    [Fact]
    public async Task SeedAsync_SeedingDisabled_DoesNotInsertEmployees()
    {
        using var context = CreateInMemoryDbContext();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new[] { new System.Collections.Generic.KeyValuePair<string, string?>("Seed:CreateDefaultEmployees", "false") })
            .Build();

        var seeder = new DatabaseSeeder(context, _mockPasswordHasher.Object, config, _mockLogger.Object);

        await seeder.SeedAsync();

        var employees = await context.Employees.ToListAsync();
        employees.Should().BeEmpty();
    }
}
