using Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class RestaurantTableConfiguration : IEntityTypeConfiguration<RestaurantTable>
{
    public void Configure(EntityTypeBuilder<RestaurantTable> builder)
    {
        builder.ToTable("RestaurantTables");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.TableNumber)
            .IsRequired();

        builder.Property(x => x.Capacity)
            .IsRequired();

        builder.Property(x => x.Status)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(x => x.RowVersion)
            .IsRowVersion();


        builder.HasOne(x => x.Waiter)
            .WithMany(x => x.RestaurantTables)
            .HasForeignKey(x => x.WaiterId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(x => x.Orders)
            .WithOne(x => x.Table)
            .HasForeignKey(x => x.TableId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.TableNumber)
            .IsUnique();
    }
}