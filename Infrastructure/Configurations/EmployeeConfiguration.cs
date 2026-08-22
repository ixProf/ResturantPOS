using Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Employees");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.FullName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Email)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(x => x.PasswordHash)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.Phone)
            .HasMaxLength(20);

        builder.Property(x => x.Role)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.IsActive)
            .HasDefaultValue(true);

        builder.Property(x => x.CreatedAt)
            .HasDefaultValueSql("GETDATE()");

        builder.HasMany(x => x.Orders)
            .WithOne(x => x.Waiter)
            .HasForeignKey(x => x.WaiterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.CancelledOrders)
            .WithOne(x => x.CancelledByEmployee)
            .HasForeignKey(x => x.CancelledBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.CancelledOrderItems)
            .WithOne(x => x.CancelledByEmployee)
            .HasForeignKey(x => x.CancelledBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Payments)
            .WithOne(x => x.Cashier)
            .HasForeignKey(x => x.CashierId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.RestaurantTables)
            .WithOne(x => x.Waiter)
            .HasForeignKey(x => x.WaiterId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(x => x.EmployeeAttendances)
            .WithOne(x => x.Employee)
            .HasForeignKey(x => x.EmployeeId);

        builder.HasMany(x => x.Discounts)
            .WithOne(x => x.ApprovedByEmployee)
            .HasForeignKey(x => x.ApprovedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Refunds)
            .WithOne(x => x.ApprovedByEmployee)
            .HasForeignKey(x => x.ApprovedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.OrderStatusHistories)
            .WithOne(x => x.ChangedByEmployee)
            .HasForeignKey(x => x.ChangedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.TableTransferLogs)
            .WithOne(x => x.TransferredByEmployee)
            .HasForeignKey(x => x.TransferredBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.Email)
            .IsUnique();
    }
}