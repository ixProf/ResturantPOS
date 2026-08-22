using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Domain.Enums;
namespace Domain.Models;

public class InventoryLog
{
    public int Id { get; set; }
    public int IngredientId { get; set; }
    public decimal ChangeAmount { get; set; }
    public decimal QuantityChange { get => ChangeAmount; set => ChangeAmount = value; }
    public InventoryReasonType ReasonType { get; set; }
    public string ReasonDetail { get; set; } = null!;
    public string Reason { get => ReasonDetail; set => ReasonDetail = value; }
    public DateTime? LoggedAt { get; set; }
    public DateTime? Timestamp { get => LoggedAt; set => LoggedAt = value; }

    public virtual Ingredient Ingredient { get; set; } = null!;
}