using System;
using Domain.Enums;

namespace Domain.Models;

public class Discount
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DiscountType Type { get; set; } = DiscountType.Percentage;
    public decimal Value { get; set; }
    public decimal? DiscountPercent { get; set; }
    public decimal? DiscountAmount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsApproved { get; set; } = true;
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }

    public int? CreatedById { get; set; }
    public int? ApprovedBy { get; set; }
    public int? OrderId { get; set; }
    public DateTime? AppliedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public virtual Employee? CreatedBy { get; set; }
    public virtual Employee? ApprovedByEmployee { get; set; }
    public virtual Order? Order { get; set; }
}