using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.Common.Security;
using Domain.Enums;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Persistence;

public class DatabaseSeeder : IDatabaseSeeder
{
    private readonly AppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(
        AppDbContext context,
        IPasswordHasher passwordHasher,
        IConfiguration configuration,
        ILogger<DatabaseSeeder> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        bool shouldSeed = _configuration.GetValue<bool>("Seed:CreateDefaultEmployees", true);
        if (!shouldSeed)
        {
            _logger.LogInformation("Employee seeding is disabled in configuration.");
            return;
        }

        var defaultEmployees = new List<(string Email, string Password, string FullName, string Phone, EmployeeRole Role)>
        {
            ("manager@alarisflowx.com", "Manager@123", "FlowX Manager", "1234567890", EmployeeRole.Manager),
            ("waiter@alarisflowx.com", "Waiter@123", "FlowX Waiter", "1234567891", EmployeeRole.Waiter),
            ("chef@alarisflowx.com", "Chef@123", "FlowX Chef", "1234567892", EmployeeRole.Chef),
            ("cashier@alarisflowx.com", "Cashier@123", "FlowX Cashier", "1234567893", EmployeeRole.Cashier),
            ("inventory@alarisflowx.com", "Inventory@123", "FlowX Inventory Manager", "1234567894", EmployeeRole.InventoryManager)
        };

        bool anyAdded = false;

        foreach (var (email, password, fullName, phone, role) in defaultEmployees)
        {
            bool exists = await _context.Employees.AnyAsync(e => e.Email == email);
            if (!exists)
            {
                var employee = new Employee
                {
                    FullName = fullName,
                    Email = email,
                    PasswordHash = _passwordHasher.HashPassword(password),
                    Phone = phone,
                    Role = role,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Employees.AddAsync(employee);
                anyAdded = true;
                _logger.LogInformation("Seeding default employee: {Email} ({Role})", email, role);
            }
            else
            {
                _logger.LogInformation("Employee already exists, skipping: {Email}", email);
            }
        }

        if (anyAdded)
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("DatabaseSeeder: Saved new default employees successfully.");
        }
    }
}
