using System;
using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Application.DTOs.Discounts;

public class CreateDiscountDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;

    [Required]
    public DiscountType Type { get; set; }

    [Range(0.01, 1000000.00)]
    public decimal Value { get; set; }

    [Required]
    [MaxLength(255)]
    public string Reason { get; set; } = null!;

    public bool IsActive { get; set; } = true;

    public bool IsApproved { get; set; } = true;

    public DateTime? ValidFrom { get; set; }

    public DateTime? ValidTo { get; set; }
}
