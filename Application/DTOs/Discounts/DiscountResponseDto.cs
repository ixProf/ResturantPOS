using System;
using Domain.Enums;

namespace Application.DTOs.Discounts;

public class DiscountResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public DiscountType Type { get; set; }
    public string TypeName => Type.ToString();
    public decimal Value { get; set; }
    public decimal? DiscountPercent { get; set; }
    public decimal? DiscountAmount { get; set; }
    public string Reason { get; set; } = null!;
    public bool IsActive { get; set; }
    public bool IsApproved { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public int? CreatedById { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
