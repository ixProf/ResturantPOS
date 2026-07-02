using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Domain.Enums;
namespace Domain.Models;

public class TableTransferLog
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int FromTableId { get; set; }
    public int ToTableId { get; set; }
    public TransferType TransferType { get; set; }
    public string TransferDetail { get; set; } = null!;
    public int TransferredBy { get; set; }
    public DateTime? TransferredAt { get; set; }

    public virtual RestaurantTable ToTable { get; set; } = null!;
    public virtual RestaurantTable FromTable { get; set; } = null!;
    public virtual Employee TransferredByEmployee { get; set; } = null!;
    public virtual Order Order { get; set; } = null!;
}