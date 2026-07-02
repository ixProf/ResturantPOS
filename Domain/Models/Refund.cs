using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Domain.Enums;
namespace Domain.Models;

public class Refund
{
    public int Id { get; set; }
    public int PaymentId { get; set; }
    public decimal Amount { get; set; }
    public RefundType RefundType { get; set; }
    public string RefundDetail { get; set; } = null!;
    public int ApprovedBy { get; set; }
    public DateTime? RefundedAt { get; set; }

    public virtual Employee ApprovedByEmployee { get; set; } = null!;
    public virtual Payment Payment { get; set; } = null!;
}