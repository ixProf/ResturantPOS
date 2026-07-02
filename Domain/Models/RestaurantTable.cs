using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Domain.Enums;
namespace Domain.Models;

public class RestaurantTable
{
    public int Id { get; set; }
    public int TableNumber { get; set; }
    public int Capacity { get; set; }
    public TableStatus Status { get; set; }
    public int? WaiterId { get; set; }

    public  Employee? Waiter { get; set; }
    public  ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<TableTransferLog> IncomingTransfers { get; set; }
        = new List<TableTransferLog>();

    public ICollection<TableTransferLog> OutgoingTransfers { get; set; }
        = new List<TableTransferLog>();
}