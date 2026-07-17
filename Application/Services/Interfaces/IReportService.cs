using Application.DTOs.Reports;

namespace Application.Services.Interfaces;

public interface IReportService
{
    Task<SalesReportDto> GetSalesReportAsync(DateTime from, DateTime to);
    Task<IEnumerable<TopSellingItemDto>> GetTopSellingItemsAsync(DateTime from, DateTime to, int topN = 10);
}
