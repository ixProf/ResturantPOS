using Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class OrderStatusHistoryConfiguration : IEntityTypeConfiguration<OrderStatusHistory>
{
    public void Configure(EntityTypeBuilder<OrderStatusHistory> builder)
    {
        builder.ToTable("OrderStatusHistory");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.OldStatus)
            .HasMaxLength(30);

        builder.Property(x => x.NewStatus)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(x => x.ChangedAt)
            .HasDefaultValueSql("GETDATE()");

        builder.HasOne(x => x.Order)
            .WithMany(x => x.OrderStatusHistories)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.ChangedByEmployee)
            .WithMany(x => x.OrderStatusHistories)
            .HasForeignKey(x => x.ChangedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.OrderId);

        builder.HasIndex(x => x.ChangedBy);

        builder.HasIndex(x => x.ChangedAt);
    }
}