using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
namespace Domain.Models;

public class Ingredient
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public decimal TotalStock { get; set; }
    public string Unit { get; set; } = null!;
    public decimal? LowStockAlert { get; set; }

    [Timestamp]
    public byte[]? RowVersion { get; set; }


    public virtual ICollection<MenuItemIngredient> MenuItemIngredients { get; set; } = new List<MenuItemIngredient>();
    public virtual ICollection<InventoryLog> InventoryLogs { get; set; } = new List<InventoryLog>();
}