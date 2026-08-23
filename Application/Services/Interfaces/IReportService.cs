using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Application.DTOs.Reports;

namespace Application.Services.Interfaces;

public interface IReportService
{
    Task<SalesReportDto> GetSalesReportAsync(DateTime from, DateTime to);
    Task<IEnumerable<TopSellingItemDto>> GetTopSellingItemsAsync(DateTime from, DateTime to, int topN = 10);
    Task<byte[]> ExportSalesReportPdfAsync(DateTime from, DateTime to, string language);
    Task<byte[]> ExportSalesReportExcelAsync(DateTime from, DateTime to, string language);
}
