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
    public InventoryReasonType ReasonType { get; set; }
    public string ReasonDetail { get; set; } = null!;
    public DateTime? LoggedAt { get; set; }

    public virtual Ingredient Ingredient { get; set; } = null!;
}