using Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class DiscountConfiguration : IEntityTypeConfiguration<Discount>
{
    public void Configure(EntityTypeBuilder<Discount> builder)
    {
        builder.ToTable("Discounts");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Id)
            .ValueGeneratedOnAdd();

        builder.Property(d => d.Name)
            .HasMaxLength(100)
            .HasDefaultValue(string.Empty);

        builder.Property(d => d.Type)
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasDefaultValue(Domain.Enums.DiscountType.Percentage);

        builder.Property(d => d.Value)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m);

        builder.Property(d => d.DiscountPercent)
            .HasPrecision(5, 2);

        builder.Property(d => d.DiscountAmount)
            .HasPrecision(18, 2);

        builder.Property(d => d.Reason)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(d => d.IsActive)
            .HasDefaultValue(true);

        builder.Property(d => d.IsApproved)
            .HasDefaultValue(true);

        builder.Property(d => d.OrderId)
            .IsRequired(false);

        builder.HasOne(d => d.Order)
            .WithMany(o => o.Discounts)
            .HasForeignKey(d => d.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.ApprovedByEmployee)
            .WithMany(e => e.Discounts)
            .HasForeignKey(d => d.ApprovedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.CreatedBy)
            .WithMany()
            .HasForeignKey(d => d.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(d => d.OrderId);
        builder.HasIndex(d => d.ApprovedBy);
        builder.HasIndex(d => d.CreatedById);
    }
}