using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Reports;
using Application.Services.Interfaces;
using ClosedXML.Excel;
using Domain.Enums;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Infrastructure.Services.Implementations;

public class ReportService : IReportService
{
    private readonly IUnitOfWork _unitOfWork;

    static ReportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public ReportService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<SalesReportDto> GetSalesReportAsync(DateTime from, DateTime to)
    {
        var completedOrders = await _unitOfWork.Orders.Query()
            .Include(o => o.Table)
            .Include(o => o.Waiter)
            .Include(o => o.Payments)
            .Where(o => o.Status == OrderStatus.Completed && o.CreatedAt >= from && o.CreatedAt <= to)
            .ToListAsync();

        var payments = await _unitOfWork.Payments.Query()
            .Where(p => p.PaidAt >= from && p.PaidAt <= to)
            .ToListAsync();

        var refunds = await _unitOfWork.Refunds.Query()
            .Where(r => r.RefundedAt >= from && r.RefundedAt <= to)
            .ToListAsync();

        var expenses = await _unitOfWork.FinancialRecords.Query()
            .Where(f => f.Type == FinancialRecordType.Expense &&
                        ((f.RecordDate.HasValue && f.RecordDate >= from && f.RecordDate <= to) ||
                         (!f.RecordDate.HasValue && f.CreatedAt.HasValue && f.CreatedAt >= from && f.CreatedAt <= to)))
            .ToListAsync();

        decimal grossSales = completedOrders.Sum(o => o.TotalAmount > 0 ? o.TotalAmount : o.FinalAmount + o.DiscountAmount);
        decimal discounts = completedOrders.Sum(o => o.DiscountAmount);
        decimal refundsTotal = refunds.Sum(r => r.Amount);
        decimal netRevenue = Math.Max(0, grossSales - discounts - refundsTotal);
        decimal totalExpenses = expenses.Sum(e => e.Amount);
        decimal netProfit = netRevenue - totalExpenses;

        int completedCount = completedOrders.Count;
        decimal avgValue = completedCount > 0 ? Math.Round(netRevenue / completedCount, 2) : 0;

        var expenseBreakdown = expenses
            .GroupBy(e => CategorizeExpense(e.Description))
            .Select(g => new ExpenseBreakdownDto
            {
                Category = g.Key,
                Amount = g.Sum(e => e.Amount),
                RecordCount = g.Count()
            })
            .OrderByDescending(b => b.Amount)
            .ToList();

        // Payment Method Breakdown
        var paymentBreakdown = payments
            .GroupBy(p => p.PaymentMethod)
            .Select(g => new PaymentMethodBreakdownDto
            {
                PaymentMethod = g.Key,
                PaymentMethodName = g.Key.ToString(),
                Amount = g.Sum(p => p.FinalAmount),
                TransactionCount = g.Count()
            })
            .ToList();

        // Sales Over Time (Daily)
        var salesOverTime = completedOrders
            .Where(o => o.CreatedAt.HasValue)
            .GroupBy(o => o.CreatedAt!.Value.Date)
            .Select(g => new DailySalesDto
            {
                Date = g.Key,
                Amount = g.Sum(o => o.FinalAmount),
                OrderCount = g.Count()
            })
            .OrderBy(d => d.Date)
            .ToList();

        // Top Selling Items
        var topItems = (await GetTopSellingItemsAsync(from, to, 10)).ToList();

        // Order Details List
        var orderDetails = completedOrders.Select(o => new SalesOrderDetailDto
        {
            OrderId = o.Id,
            TableNumber = o.Table?.TableNumber ?? 0,
            WaiterName = o.Waiter?.FullName ?? "N/A",
            GrossAmount = o.TotalAmount > 0 ? o.TotalAmount : o.FinalAmount + o.DiscountAmount,
            DiscountAmount = o.DiscountAmount,
            FinalAmount = o.FinalAmount,
            PaymentMethod = o.Payments.FirstOrDefault()?.PaymentMethod.ToString() ?? "Cash",
            CompletedAt = o.UpdatedAt ?? o.CreatedAt ?? DateTime.UtcNow
        }).OrderByDescending(o => o.CompletedAt).ToList();

        return new SalesReportDto
        {
            GrossSales = grossSales,
            Discounts = discounts,
            Refunds = refundsTotal,
            NetRevenue = netRevenue,
            TotalExpenses = totalExpenses,
            NetProfit = netProfit,
            CompletedOrdersCount = completedCount,
            AverageOrderValue = avgValue,
            PaymentMethodBreakdown = paymentBreakdown,
            TopSellingItems = topItems,
            ExpenseBreakdown = expenseBreakdown,
            SalesOverTime = salesOverTime,
            OrderDetails = orderDetails
        };
    }

    private static string CategorizeExpense(string description)
    {
        if (string.IsNullOrWhiteSpace(description)) return "Other Expenses";
        if (description.Contains("Inventory Purchase", StringComparison.OrdinalIgnoreCase) || description.Contains("Purchase", StringComparison.OrdinalIgnoreCase))
            return "Inventory Purchases";
        if (description.Contains("Refund", StringComparison.OrdinalIgnoreCase))
            return "Customer Refunds";
        if (description.Contains("Utility", StringComparison.OrdinalIgnoreCase) || description.Contains("Utilities", StringComparison.OrdinalIgnoreCase))
            return "Utilities";
        if (description.Contains("Maintenance", StringComparison.OrdinalIgnoreCase))
            return "Maintenance";
        return "Other Expenses";
    }

    public async Task<IEnumerable<TopSellingItemDto>> GetTopSellingItemsAsync(DateTime from, DateTime to, int topN = 10)
    {
        var topItems = await _unitOfWork.OrderItems.Query()
            .Where(oi => oi.Order.Status == OrderStatus.Completed &&
                         oi.Order.CreatedAt >= from &&
                         oi.Order.CreatedAt <= to &&
                         oi.Status != OrderItemStatus.Cancelled &&
                         oi.Status != OrderItemStatus.Voided)
            .GroupBy(oi => new { oi.MenuItemId, oi.MenuItem.Name })
            .Select(g => new TopSellingItemDto
            {
                MenuItemId = g.Key.MenuItemId,
                MenuItemName = g.Key.Name,
                TotalQuantitySold = g.Sum(x => x.Quantity),
                TotalRevenue = g.Sum(x => x.Quantity * x.UnitPrice)
            })
            .OrderByDescending(x => x.TotalQuantitySold)
            .Take(topN)
            .ToListAsync();

        return topItems;
    }

    public async Task<byte[]> ExportSalesReportExcelAsync(DateTime from, DateTime to, string language)
    {
        var report = await GetSalesReportAsync(from, to);
        bool isArabic = string.Equals(language, "ar", StringComparison.OrdinalIgnoreCase);

        using var workbook = new XLWorkbook();
        if (isArabic)
        {
            workbook.RightToLeft = true;
        }

        // Sheet 1: Summary / الملخص
        var summarySheet = workbook.Worksheets.Add(isArabic ? "ملخص المبيعات" : "Sales Summary");
        summarySheet.Cell(1, 1).Value = isArabic ? "تقرير مبيعات Alaris FlowX" : "Alaris FlowX Sales Report";
        summarySheet.Cell(1, 1).Style.Font.Bold = true;
        summarySheet.Cell(1, 1).Style.Font.FontSize = 16;

        summarySheet.Cell(2, 1).Value = $"{(isArabic ? "الفترة:" : "Period:")} {from:yyyy-MM-dd} - {to:yyyy-MM-dd}";

        summarySheet.Cell(4, 1).Value = isArabic ? "إجمالي المبيعات (Gross Sales)" : "Gross Sales";
        summarySheet.Cell(4, 2).Value = report.GrossSales;

        summarySheet.Cell(5, 1).Value = isArabic ? "إجمالي الخصومات (Discounts)" : "Discounts";
        summarySheet.Cell(5, 2).Value = report.Discounts;

        summarySheet.Cell(6, 1).Value = isArabic ? "إجمالي المستردات (Refunds)" : "Refunds";
        summarySheet.Cell(6, 2).Value = report.Refunds;

        summarySheet.Cell(7, 1).Value = isArabic ? "صافي الإيرادات (Net Revenue)" : "Net Revenue";
        summarySheet.Cell(7, 2).Value = report.NetRevenue;
        summarySheet.Cell(7, 1).Style.Font.Bold = true;
        summarySheet.Cell(7, 2).Style.Font.Bold = true;

        summarySheet.Cell(8, 1).Value = isArabic ? "إجمالي المصروفات (Total Expenses)" : "Total Expenses";
        summarySheet.Cell(8, 2).Value = report.TotalExpenses;
        summarySheet.Cell(8, 1).Style.Font.Bold = true;
        summarySheet.Cell(8, 2).Style.Font.FontColor = XLColor.FromHtml("#E11D48");

        summarySheet.Cell(9, 1).Value = isArabic ? "صافي الربح (Net Profit)" : "Net Profit";
        summarySheet.Cell(9, 2).Value = report.NetProfit;
        summarySheet.Cell(9, 1).Style.Font.Bold = true;
        summarySheet.Cell(9, 2).Style.Font.Bold = true;
        summarySheet.Cell(9, 2).Style.Font.FontColor = report.NetProfit >= 0 ? XLColor.FromHtml("#10B981") : XLColor.FromHtml("#E11D48");

        summarySheet.Cell(10, 1).Value = isArabic ? "عدد الطلبات المكتملة" : "Completed Orders";
        summarySheet.Cell(10, 2).Value = report.CompletedOrdersCount;

        summarySheet.Cell(11, 1).Value = isArabic ? "متوسط قيمة الطلب (AOV)" : "Average Order Value";
        summarySheet.Cell(11, 2).Value = report.AverageOrderValue;

        summarySheet.Columns().AdjustToContents();

        // Sheet 2: Expense Breakdown / تفاصيل المصروفات
        var expenseSheet = workbook.Worksheets.Add(isArabic ? "تفاصيل المصروفات" : "Expense Breakdown");
        expenseSheet.Cell(1, 1).Value = isArabic ? "الفئة" : "Category";
        expenseSheet.Cell(1, 2).Value = isArabic ? "المبلغ (EGP)" : "Amount (EGP)";
        expenseSheet.Cell(1, 3).Value = isArabic ? "عدد المعاملات" : "Record Count";

        var expHeader = expenseSheet.Range(1, 1, 1, 3);
        expHeader.Style.Font.Bold = true;
        expHeader.Style.Fill.BackgroundColor = XLColor.FromHtml("#E11D48");
        expHeader.Style.Font.FontColor = XLColor.White;

        int expRow = 2;
        foreach (var exp in report.ExpenseBreakdown)
        {
            expenseSheet.Cell(expRow, 1).Value = exp.Category;
            expenseSheet.Cell(expRow, 2).Value = exp.Amount;
            expenseSheet.Cell(expRow, 3).Value = exp.RecordCount;
            expRow++;
        }
        expenseSheet.Columns().AdjustToContents();

        // Sheet 2: Order Details / تفاصيل المبيعات
        var detailsSheet = workbook.Worksheets.Add(isArabic ? "تفاصيل الطلبات" : "Order Details");
        detailsSheet.Cell(1, 1).Value = isArabic ? "رقم الطلب" : "Order ID";
        detailsSheet.Cell(1, 2).Value = isArabic ? "رقم الطاولة" : "Table #";
        detailsSheet.Cell(1, 3).Value = isArabic ? "اسم النادل" : "Waiter";
        detailsSheet.Cell(1, 4).Value = isArabic ? "الإجمالي" : "Gross";
        detailsSheet.Cell(1, 5).Value = isArabic ? "الخصم" : "Discount";
        detailsSheet.Cell(1, 6).Value = isArabic ? "الصافي" : "Final Amount";
        detailsSheet.Cell(1, 7).Value = isArabic ? "طريقة الدفع" : "Payment Method";
        detailsSheet.Cell(1, 8).Value = isArabic ? "تاريخ الاكتفاء" : "Completed At";

        var headerRange = detailsSheet.Range(1, 1, 1, 8);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#5E6AD2");
        headerRange.Style.Font.FontColor = XLColor.White;

        int row = 2;
        foreach (var d in report.OrderDetails)
        {
            detailsSheet.Cell(row, 1).Value = d.OrderId;
            detailsSheet.Cell(row, 2).Value = d.TableNumber;
            detailsSheet.Cell(row, 3).Value = d.WaiterName;
            detailsSheet.Cell(row, 4).Value = d.GrossAmount;
            detailsSheet.Cell(row, 5).Value = d.DiscountAmount;
            detailsSheet.Cell(row, 6).Value = d.FinalAmount;
            detailsSheet.Cell(row, 7).Value = d.PaymentMethod;
            detailsSheet.Cell(row, 8).Value = d.CompletedAt.ToString("yyyy-MM-dd HH:mm");
            row++;
        }
        detailsSheet.Columns().AdjustToContents();

        // Sheet 3: Top Selling Items / الأصناف الأكثر مبيعاً
        var topSheet = workbook.Worksheets.Add(isArabic ? "الأكثر مبيعاً" : "Top Selling");
        topSheet.Cell(1, 1).Value = isArabic ? "اسم الصنف" : "Item Name";
        topSheet.Cell(1, 2).Value = isArabic ? "الكمية المباعة" : "Quantity Sold";
        topSheet.Cell(1, 3).Value = isArabic ? "إجمالي الإيرادات" : "Total Revenue";

        var topHeader = topSheet.Range(1, 1, 1, 3);
        topHeader.Style.Font.Bold = true;
        topHeader.Style.Fill.BackgroundColor = XLColor.FromHtml("#1C1D21");
        topHeader.Style.Font.FontColor = XLColor.White;

        row = 2;
        foreach (var item in report.TopSellingItems)
        {
            topSheet.Cell(row, 1).Value = item.MenuItemName;
            topSheet.Cell(row, 2).Value = item.TotalQuantitySold;
            topSheet.Cell(row, 3).Value = item.TotalRevenue;
            row++;
        }
        topSheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportSalesReportPdfAsync(DateTime from, DateTime to, string language)
    {
        var report = await GetSalesReportAsync(from, to);
        bool isArabic = string.Equals(language, "ar", StringComparison.OrdinalIgnoreCase);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                page.Header().Column(col =>
                {
                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Alaris FlowX POS").Bold().FontSize(20).FontColor("#5E6AD2");
                        r.ConstantItem(150).AlignRight().Text(isArabic ? "تقرير المبيعات" : "Sales Analytics Report").Bold().FontSize(14);
                    });
                    col.Item().Text($"{(isArabic ? "الفترة:" : "Period:")} {from:yyyy-MM-dd} to {to:yyyy-MM-dd} | {(isArabic ? "تاريخ الإنشاء:" : "Generated:")} {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC").FontSize(9).FontColor(Colors.Grey.Darken1);
                    col.Item().PaddingVertical(5).LineHorizontal(1).LineColor("#E5E7EB");
                });

                page.Content().PaddingVertical(10).Column(col =>
                {
                    // Metrics Grid
                    col.Item().Grid(grid =>
                    {
                        grid.Columns(5);

                        grid.Item().Padding(3).Border(1).BorderColor("#E5E7EB").Padding(6).Column(c =>
                        {
                            c.Item().Text(isArabic ? "إجمالي المبيعات" : "Gross Sales").FontSize(8).FontColor(Colors.Grey.Medium);
                            c.Item().Text($"{report.GrossSales:N2} EGP").Bold().FontSize(11);
                        });

                        grid.Item().Padding(3).Border(1).BorderColor("#E5E7EB").Padding(6).Column(c =>
                        {
                            c.Item().Text(isArabic ? "الخصومات والمستردات" : "Discounts & Refunds").FontSize(8).FontColor(Colors.Grey.Medium);
                            c.Item().Text($"-{(report.Discounts + report.Refunds):N2} EGP").Bold().FontSize(11).FontColor(Colors.Red.Medium);
                        });

                        grid.Item().Padding(3).Border(1).BorderColor("#E5E7EB").Padding(6).Column(c =>
                        {
                            c.Item().Text(isArabic ? "صافي الإيرادات" : "Net Revenue").FontSize(8).FontColor(Colors.Grey.Medium);
                            c.Item().Text($"{report.NetRevenue:N2} EGP").Bold().FontSize(11).FontColor("#5E6AD2");
                        });

                        grid.Item().Padding(3).Border(1).BorderColor("#E5E7EB").Padding(6).Column(c =>
                        {
                            c.Item().Text(isArabic ? "إجمالي المصروفات" : "Total Expenses").FontSize(8).FontColor(Colors.Grey.Medium);
                            c.Item().Text($"{report.TotalExpenses:N2} EGP").Bold().FontSize(11).FontColor(Colors.Red.Medium);
                        });

                        grid.Item().Padding(3).Border(1).BorderColor("#E5E7EB").Padding(6).Column(c =>
                        {
                            c.Item().Text(isArabic ? "صافي الربح" : "Net Profit").FontSize(8).FontColor(Colors.Grey.Medium);
                            c.Item().Text($"{report.NetProfit:N2} EGP").Bold().FontSize(11).FontColor(report.NetProfit >= 0 ? Colors.Green.Medium : Colors.Red.Medium);
                        });
                    });

                    if (report.ExpenseBreakdown.Any())
                    {
                        col.Item().PaddingTop(10).Text(isArabic ? "تفاصيل المصروفات" : "Expense Breakdown").Bold().FontSize(11);
                        col.Item().PaddingTop(4).Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(3);
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(1);
                            });

                            table.Header(h =>
                            {
                                h.Cell().Background("#E11D48").Padding(4).Text(isArabic ? "الفئة" : "Category").Bold().FontColor(Colors.White).FontSize(9);
                                h.Cell().Background("#E11D48").Padding(4).Text(isArabic ? "المبلغ (EGP)" : "Amount (EGP)").Bold().FontColor(Colors.White).FontSize(9);
                                h.Cell().Background("#E11D48").Padding(4).Text(isArabic ? "عدد المعاملات" : "Count").Bold().FontColor(Colors.White).FontSize(9);
                            });

                            foreach (var exp in report.ExpenseBreakdown)
                            {
                                table.Cell().BorderBottom(1).BorderColor("#F3F4F6").Padding(4).Text(exp.Category).FontSize(9);
                                table.Cell().BorderBottom(1).BorderColor("#F3F4F6").Padding(4).Text($"{exp.Amount:N2} EGP").FontSize(9);
                                table.Cell().BorderBottom(1).BorderColor("#F3F4F6").Padding(4).Text(exp.RecordCount.ToString()).FontSize(9);
                            }
                        });
                    }

                    col.Item().PaddingTop(10).Text(isArabic ? "الأصناف الأكثر مبيعاً" : "Top Selling Items").Bold().FontSize(11);
                    col.Item().PaddingTop(4).Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(3);
                            cols.RelativeColumn(1);
                            cols.RelativeColumn(2);
                        });

                        table.Header(h =>
                        {
                            h.Cell().Background("#1F2024").Padding(4).Text(isArabic ? "اسم الصنف" : "Item Name").Bold().FontColor(Colors.White).FontSize(9);
                            h.Cell().Background("#1F2024").Padding(4).Text(isArabic ? "الكمية" : "Qty").Bold().FontColor(Colors.White).FontSize(9);
                            h.Cell().Background("#1F2024").Padding(4).Text(isArabic ? "الإيرادات" : "Revenue").Bold().FontColor(Colors.White).FontSize(9);
                        });

                        foreach (var item in report.TopSellingItems)
                        {
                            table.Cell().BorderBottom(1).BorderColor("#F3F4F6").Padding(4).Text(item.MenuItemName).FontSize(9);
                            table.Cell().BorderBottom(1).BorderColor("#F3F4F6").Padding(4).Text(item.TotalQuantitySold.ToString()).FontSize(9);
                            table.Cell().BorderBottom(1).BorderColor("#F3F4F6").Padding(4).Text($"{item.TotalRevenue:N2} EGP").FontSize(9);
                        }
                    });

                    col.Item().PaddingTop(15).Text(isArabic ? "سجل تفاصيل الطلبات المكتملة" : "Completed Orders Log").Bold().FontSize(12);
                    col.Item().PaddingTop(5).Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.ConstantColumn(50);
                            cols.ConstantColumn(40);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(1);
                            cols.RelativeColumn(1);
                            cols.RelativeColumn(2);
                        });

                        table.Header(h =>
                        {
                            h.Cell().Background("#5E6AD2").Padding(4).Text("Order").Bold().FontColor(Colors.White).FontSize(8);
                            h.Cell().Background("#5E6AD2").Padding(4).Text("Table").Bold().FontColor(Colors.White).FontSize(8);
                            h.Cell().Background("#5E6AD2").Padding(4).Text("Waiter").Bold().FontColor(Colors.White).FontSize(8);
                            h.Cell().Background("#5E6AD2").Padding(4).Text("Total").Bold().FontColor(Colors.White).FontSize(8);
                            h.Cell().Background("#5E6AD2").Padding(4).Text("Pay Method").Bold().FontColor(Colors.White).FontSize(8);
                            h.Cell().Background("#5E6AD2").Padding(4).Text("Date").Bold().FontColor(Colors.White).FontSize(8);
                        });

                        foreach (var order in report.OrderDetails.Take(25))
                        {
                            table.Cell().BorderBottom(1).BorderColor("#F3F4F6").Padding(4).Text($"#{order.OrderId}").FontSize(8);
                            table.Cell().BorderBottom(1).BorderColor("#F3F4F6").Padding(4).Text($"T-{order.TableNumber}").FontSize(8);
                            table.Cell().BorderBottom(1).BorderColor("#F3F4F6").Padding(4).Text(order.WaiterName).FontSize(8);
                            table.Cell().BorderBottom(1).BorderColor("#F3F4F6").Padding(4).Text($"${order.FinalAmount:N2}").FontSize(8);
                            table.Cell().BorderBottom(1).BorderColor("#F3F4F6").Padding(4).Text(order.PaymentMethod).FontSize(8);
                            table.Cell().BorderBottom(1).BorderColor("#F3F4F6").Padding(4).Text(order.CompletedAt.ToString("MM/dd HH:mm")).FontSize(8);
                        }
                    });
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                    x.Span(" | Alaris Space Systems");
                });
            });
        });

        return document.GeneratePdf();
    }
}

