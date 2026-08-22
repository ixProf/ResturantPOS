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
        if (to == default) to = DateTime.UtcNow;

        var report = await _reportService.GetSalesReportAsync(from, to);
        return Ok(report);
    }

    [HttpGet("top-selling")]
    public async Task<IActionResult> GetTopSellingItems([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] int topN = 10)
    {
        if (from == default) from = DateTime.UtcNow.AddDays(-30);
        if (to == default) to = DateTime.UtcNow;

        var topItems = await _reportService.GetTopSellingItemsAsync(from, to, topN);
        return Ok(topItems);
    }
}
