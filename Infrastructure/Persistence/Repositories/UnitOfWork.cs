using System.Threading;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Domain.Models;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Storage;

namespace Infrastructure.Persistence.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IDbContextTransaction? _currentTransaction;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
        Orders = new Repository<Order>(_context);
        OrderItems = new Repository<OrderItem>(_context);
        Employees = new Repository<Employee>(_context);
        Tables = new Repository<RestaurantTable>(_context);
        MenuItems = new Repository<MenuItem>(_context);
        Categories = new Repository<Category>(_context);
        Payments = new Repository<Payment>(_context);
        Discounts = new Repository<Discount>(_context);
        Refunds = new Repository<Refund>(_context);
        Ingredients = new Repository<Ingredient>(_context);
        InventoryLogs = new Repository<InventoryLog>(_context);
        MenuItemIngredients = new Repository<MenuItemIngredient>(_context);
        TableTransferLogs = new Repository<TableTransferLog>(_context);
        Notifications = new Repository<Notification>(_context);
    }

    public IRepository<Order> Orders { get; }
    public IRepository<OrderItem> OrderItems { get; }
    public IRepository<Employee> Employees { get; }
    public IRepository<RestaurantTable> Tables { get; }
    public IRepository<MenuItem> MenuItems { get; }
    public IRepository<Category> Categories { get; }
    public IRepository<Payment> Payments { get; }
    public IRepository<Discount> Discounts { get; }
    public IRepository<Refund> Refunds { get; }
    public IRepository<Ingredient> Ingredients { get; }
    public IRepository<InventoryLog> InventoryLogs { get; }
    public IRepository<MenuItemIngredient> MenuItemIngredients { get; }
    public IRepository<TableTransferLog> TableTransferLogs { get; }
    public IRepository<Notification> Notifications { get; }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IDisposable> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_currentTransaction != null)
        {
            return _currentTransaction;
        }

        _currentTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        return _currentTransaction;
    }


    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await SaveChangesAsync(cancellationToken);
            if (_currentTransaction != null)
            {
                await _currentTransaction.CommitAsync(cancellationToken);
            }
        }
        catch
        {
            await RollbackTransactionAsync(cancellationToken);
            throw;
        }
        finally
        {
            if (_currentTransaction != null)
            {
                _currentTransaction.Dispose();
                _currentTransaction = null;
            }
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (_currentTransaction != null)
            {
                await _currentTransaction.RollbackAsync(cancellationToken);
            }
        }
        finally
        {
            if (_currentTransaction != null)
            {
                _currentTransaction.Dispose();
                _currentTransaction = null;
            }
        }
    }
}
