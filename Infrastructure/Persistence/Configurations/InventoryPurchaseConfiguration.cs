using Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class InventoryPurchaseConfiguration : IEntityTypeConfiguration<InventoryPurchase>
{
    public void Configure(EntityTypeBuilder<InventoryPurchase> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Quantity)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(p => p.UnitCost)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(p => p.TotalAmount)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(p => p.Reason)
            .HasMaxLength(250)
            .IsRequired();

        builder.HasOne(p => p.Ingredient)
            .WithMany()
            .HasForeignKey(p => p.IngredientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.CreatedBy)
            .WithMany()
            .HasForeignKey(p => p.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
