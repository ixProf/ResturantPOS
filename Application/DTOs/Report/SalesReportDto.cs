using System;
using System.Collections.Generic;
using Domain.Enums;

namespace Application.DTOs.Reports;

public class SalesReportDto
{
    public decimal GrossSales { get; set; }
    public decimal Discounts { get; set; }
    public decimal Refunds { get; set; }
    public decimal NetRevenue { get; set; }
    public int CompletedOrdersCount { get; set; }
    public decimal AverageOrderValue { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetProfit { get; set; }

    // Backward compatibility getters
    public decimal TotalSales { get => NetRevenue; set => NetRevenue = value; }
    public int TotalOrders { get => CompletedOrdersCount; set => CompletedOrdersCount = value; }

    public List<PaymentMethodBreakdownDto> PaymentMethodBreakdown { get; set; } = new();
    public List<TopSellingItemDto> TopSellingItems { get; set; } = new();
    public List<ExpenseBreakdownDto> ExpenseBreakdown { get; set; } = new();
    public List<DailySalesDto> SalesOverTime { get; set; } = new();
    public List<SalesOrderDetailDto> OrderDetails { get; set; } = new();
}

public class ExpenseBreakdownDto
{
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int RecordCount { get; set; }
}

public class PaymentMethodBreakdownDto
{
    public PaymentMethod PaymentMethod { get; set; }
    public string PaymentMethodName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int TransactionCount { get; set; }
}

public class DailySalesDto
{
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public int OrderCount { get; set; }
}

public class SalesOrderDetailDto
{
    public int OrderId { get; set; }
    public int TableNumber { get; set; }
    public string WaiterName { get; set; } = string.Empty;
    public decimal GrossAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal FinalAmount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public DateTime CompletedAt { get; set; }
}