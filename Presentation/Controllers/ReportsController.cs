using System;
using System.Threading.Tasks;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Manager")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("sales")]
    public async Task<IActionResult> GetSalesReport([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        if (from == default) from = DateTime.UtcNow.AddDays(-30);
        to = NormalizeToDate(to);

        var report = await _reportService.GetSalesReportAsync(from, to);
        return Ok(report);
    }

    [HttpGet("top-selling")]
    public async Task<IActionResult> GetTopSellingItems([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] int topN = 10)
    {
        if (from == default) from = DateTime.UtcNow.AddDays(-30);
        to = NormalizeToDate(to);

        var topItems = await _reportService.GetTopSellingItemsAsync(from, to, topN);
        return Ok(topItems);
    }

    [HttpGet("sales/export/pdf")]
    public async Task<IActionResult> ExportPdf([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] string language = "en")
    {
        if (from == default) from = DateTime.UtcNow.AddDays(-30);
        to = NormalizeToDate(to);

        byte[] pdfBytes = await _reportService.ExportSalesReportPdfAsync(from, to, language);
        string filename = $"Alaris_Sales_Report_{from:yyyyMMdd}_{to:yyyyMMdd}_{language}.pdf";
        return File(pdfBytes, "application/pdf", filename);
    }

    [HttpGet("sales/export/excel")]
    public async Task<IActionResult> ExportExcel([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] string language = "en")
    {
        if (from == default) from = DateTime.UtcNow.AddDays(-30);
        to = NormalizeToDate(to);

        byte[] excelBytes = await _reportService.ExportSalesReportExcelAsync(from, to, language);
        string filename = $"Alaris_Sales_Report_{from:yyyyMMdd}_{to:yyyyMMdd}_{language}.xlsx";
        return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
    }

    private static DateTime NormalizeToDate(DateTime to)
    {
        if (to == default) return DateTime.UtcNow;
        return to.TimeOfDay == TimeSpan.Zero ? to.Date.AddDays(1).AddTicks(-1) : to;
    }
}
