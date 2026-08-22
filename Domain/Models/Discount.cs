using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
namespace Domain.Models;

public class Discount
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public decimal? DiscountPercent { get; set; }
    public decimal? DiscountAmount { get; set; }
    public string Reason { get; set; } = null!;
    public int? ApprovedBy { get; set; }
    public DateTime? AppliedAt { get; set; }
    public DateTime? CreatedAt { get => AppliedAt; set => AppliedAt = value; }

    public Employee? ApprovedByEmployee { get; set; }
    public Order Order { get; set; } = null!;
}