using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Reports;
using Application.Services.Interfaces;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Implementations;

public class ReportService : IReportService
{
    private readonly IUnitOfWork _unitOfWork;

    public ReportService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<SalesReportDto> GetSalesReportAsync(DateTime from, DateTime to)
    {
        var completedOrders = await _unitOfWork.Orders.Query()
            .Where(o => o.Status == OrderStatus.Completed && o.CreatedAt >= from && o.CreatedAt <= to)
            .ToListAsync();

        decimal totalSales = completedOrders.Sum(o => o.FinalAmount);
        int totalOrders = completedOrders.Count;
        decimal avgValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        var topItems = await GetTopSellingItemsAsync(from, to, 5);

        return new SalesReportDto
        {
            TotalSales = totalSales,
            TotalOrders = totalOrders,
            AverageOrderValue = Math.Round(avgValue, 2),
            TopSellingItems = topItems.ToList()
        };
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
}

