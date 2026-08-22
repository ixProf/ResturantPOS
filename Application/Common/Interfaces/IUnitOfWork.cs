using System;
using System.Threading;
using System.Threading.Tasks;
using Domain.Models;

namespace Application.Common.Interfaces;

public interface IUnitOfWork
{
    IRepository<Order> Orders { get; }
    IRepository<OrderItem> OrderItems { get; }
    IRepository<Employee> Employees { get; }
    IRepository<RestaurantTable> Tables { get; }
    IRepository<MenuItem> MenuItems { get; }
    IRepository<Category> Categories { get; }
    IRepository<Payment> Payments { get; }
    IRepository<Discount> Discounts { get; }
    IRepository<Refund> Refunds { get; }
    IRepository<Ingredient> Ingredients { get; }
    IRepository<InventoryLog> InventoryLogs { get; }
    IRepository<MenuItemIngredient> MenuItemIngredients { get; }
    IRepository<TableTransferLog> TableTransferLogs { get; }
    IRepository<Notification> Notifications { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IDisposable> BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}

