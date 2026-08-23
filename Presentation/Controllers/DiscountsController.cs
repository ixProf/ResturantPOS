using System.Security.Claims;
using System.Threading.Tasks;
using Application.DTOs.Discounts;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DiscountsController : ControllerBase
{
    private readonly IDiscountService _discountService;

    public DiscountsController(IDiscountService discountService)
    {
        _discountService = discountService;
    }

    [HttpPost]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> CreateDiscount([FromBody] CreateDiscountDto dto)
    {
        int createdById = GetCurrentUserId();
        var result = await _discountService.CreateDiscountAsync(dto, createdById);
        return CreatedAtAction(nameof(GetDiscountById), new { id = result.Id }, result);
    }

    [HttpGet]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> GetAllDiscounts()
    {
        var discounts = await _discountService.GetAllDiscountsAsync();
        return Ok(discounts);
    }

    [HttpGet("active")]
    [Authorize(Roles = "Cashier,Manager")]
    public async Task<IActionResult> GetActiveDiscounts()
    {
        var discounts = await _discountService.GetActiveDiscountsAsync();
        return Ok(discounts);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> GetDiscountById(int id)
    {
        var discount = await _discountService.GetDiscountByIdAsync(id);
        return Ok(discount);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> UpdateDiscount(int id, [FromBody] UpdateDiscountDto dto)
    {
        var updated = await _discountService.UpdateDiscountAsync(id, dto);
        return Ok(updated);
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> UpdateDiscountStatus(int id, [FromBody] UpdateDiscountStatusDto dto)
    {
        var updated = await _discountService.UpdateDiscountStatusAsync(id, dto);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> DeleteDiscount(int id)
    {
        bool deleted = await _discountService.DeleteDiscountAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    private int GetCurrentUserId()
    {
        string? val = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(val, out int userId) ? userId : 1;
    }
}
