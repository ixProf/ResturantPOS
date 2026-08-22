using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Domain.Models;

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int MenuItemId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public OrderItemStatus Status { get; set; } = OrderItemStatus.Draft;
    public string? Notes { get; set; }

    public string? CancellationReason { get; set; }
    public int? CancelledBy { get; set; }
    public DateTime? CancelledAt { get; set; }

    public virtual Order Order { get; set; } = null!;
    public virtual MenuItem MenuItem { get; set; } = null!;
    public virtual Employee? CancelledByEmployee { get; set; }
}