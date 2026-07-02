using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Domain.Enums;
namespace Domain.Models;

public class OrderStatusHistory
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public OrderStatus? OldStatus { get; set; }
    public OrderStatus NewStatus { get; set; }
    public int? ChangedBy { get; set; }
    public DateTime? ChangedAt { get; set; }

    public virtual Order Order { get; set; } = null!;
    public virtual Employee? ChangedByEmployee { get; set; }
}