using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Domain.Models
{
    public class Order
    {
        public int Id { get; set; }
        public int TableId { get; set; }
        public int WaiterId { get; set; }
        public OrderStatus Status { get; set; }
        public decimal? TotalAmount { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public virtual RestaurantTable Table { get; set; } = null!;
        public virtual Employee Waiter { get; set; } = null!;
        public virtual ICollection<Payment> Payment { get; set; } = new List<Payment>();
        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public virtual ICollection<Discount> Discounts { get; set; } = new List<Discount>();
        public virtual ICollection<TableTransferLog> TableTransferLog { get; set; } = new List<TableTransferLog>();

        public virtual ICollection<OrderStatusHistory> OrderStatusHistories { get; set; } =
            new List<OrderStatusHistory>();
    }
}
