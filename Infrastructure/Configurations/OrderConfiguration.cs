using Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Id)
               .ValueGeneratedOnAdd();

        builder.Property(o => o.Status)
               .IsRequired();

        builder.Property(o => o.TotalAmount)
               .HasColumnType("decimal(18,2)");

        builder.Property(o => o.DiscountAmount)
               .HasColumnType("decimal(18,2)");

        builder.Property(o => o.FinalAmount)
               .HasColumnType("decimal(18,2)");

        builder.Property(o => o.CancellationReason)
               .HasMaxLength(500);

        builder.Property(o => o.CreatedAt);

        builder.Property(o => o.UpdatedAt);

        builder.Property(o => o.RowVersion)
               .IsRowVersion();

        builder.HasOne(o => o.Table)

               .WithMany(t => t.Orders)
               .HasForeignKey(o => o.TableId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Waiter)
               .WithMany(e => e.Orders)
               .HasForeignKey(o => o.WaiterId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.CancelledByEmployee)
               .WithMany(e => e.CancelledOrders)
               .HasForeignKey(o => o.CancelledBy)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.OrderItems)
               .WithOne(oi => oi.Order)
               .HasForeignKey(oi => oi.OrderId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.Payments)
               .WithOne(p => p.Order)
               .HasForeignKey(p => p.OrderId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.Discounts)
               .WithOne(d => d.Order)
               .HasForeignKey(d => d.OrderId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.TableTransferLog)
               .WithOne(t => t.Order)
               .HasForeignKey(t => t.OrderId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.OrderStatusHistories)
               .WithOne(h => h.Order)
               .HasForeignKey(h => h.OrderId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(o => o.TableId);

        builder.HasIndex(o => o.WaiterId);

        builder.HasIndex(o => o.Status);

        builder.HasIndex(o => o.CreatedAt);
    }
}