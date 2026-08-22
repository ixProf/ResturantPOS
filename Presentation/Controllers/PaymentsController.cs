using System.Security.Claims;
using System.Threading.Tasks;
using Application.DTOs.Payments;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpPost]
    [Authorize(Roles = "Cashier,Manager")]
    public async Task<IActionResult> ProcessPayment([FromBody] CreatePaymentDto dto)
    {
        int cashierId = GetCurrentUserId();
        var payment = await _paymentService.ProcessPaymentAsync(dto, cashierId);
        return CreatedAtAction(nameof(GetPaymentById), new { id = payment.Id }, payment);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPaymentById(int id)
    {
        var payment = await _paymentService.GetPaymentByIdAsync(id);
        return Ok(payment);
    }

    [HttpGet]
    [Authorize(Roles = "Cashier,Manager")]
    public async Task<IActionResult> GetAllPayments([FromQuery] PaymentFilterDto? filter)
    {
        var payments = await _paymentService.GetAllPaymentsAsync(filter);
        return Ok(payments);
    }

    [HttpGet("orders/{orderId:int}/invoice")]
    public async Task<IActionResult> GetInvoice(int orderId)
    {
        var invoice = await _paymentService.GetInvoiceByOrderIdAsync(orderId);
        return Ok(invoice);
    }

    [HttpPost("{id:int}/refund")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> IssueRefund(int id, [FromBody] IssueRefundDto dto)
    {
        int approvedById = GetCurrentUserId();
        var refund = await _paymentService.IssueRefundAsync(id, dto, approvedById);
        return Ok(refund);
    }

    [HttpPost("orders/{orderId:int}/discount")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> ApplyDiscount(int orderId, [FromBody] ApplyDiscountDto dto)
    {
        int approvedById = GetCurrentUserId();
        bool success = await _paymentService.ApplyDiscountAsync(orderId, dto, approvedById);
        return success ? Ok(new { message = "Discount applied successfully." }) : BadRequest();
    }

    private int GetCurrentUserId()
    {
        string? val = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(val, out int userId) ? userId : 1;
    }
}
