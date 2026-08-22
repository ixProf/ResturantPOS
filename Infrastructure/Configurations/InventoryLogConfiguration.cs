using Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class InventoryLogConfiguration : IEntityTypeConfiguration<InventoryLog>
{
    public void Configure(EntityTypeBuilder<InventoryLog> builder)
    {
        builder.ToTable("InventoryLog");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ChangeAmount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(x => x.QuantityChange)
            .HasPrecision(18, 2);


        builder.Property(x => x.ReasonType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.ReasonDetail)
            .HasMaxLength(500);

        builder.Property(x => x.LoggedAt)
            .HasDefaultValueSql("GETDATE()");

        builder.HasOne(x => x.Ingredient)
            .WithMany(x => x.InventoryLogs)
            .HasForeignKey(x => x.IngredientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.IngredientId);

        builder.HasIndex(x => x.LoggedAt);

        builder.HasIndex(x => x.ReasonType);
    }
}