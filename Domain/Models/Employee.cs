using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Domain.Enums;
namespace Domain.Models;

public class Employee
{
    public int Id { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public EmployeeRole Role { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }

    public  ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public  ICollection<Order> Orders { get; set; } = new List<Order>();
    public  ICollection<Discount> Discounts { get; set; } = new List<Discount>();
    public  ICollection<Refund> Refunds { get; set; } = new List<Refund>();
    public  ICollection<TableTransferLog> TableTransferLogs { get; set; } = new List<TableTransferLog>();
    public  ICollection<EmployeeAttendance> EmployeeAttendances { get; set; } = new List<EmployeeAttendance>();
    public  ICollection<OrderStatusHistory> OrderStatusHistories { get; set; } = new List<OrderStatusHistory>();
    public  ICollection<RestaurantTable> RestaurantTables { get; set; } = new List<RestaurantTable>();
}