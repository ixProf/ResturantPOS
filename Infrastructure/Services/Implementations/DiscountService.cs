using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Discounts;
using Application.Services.Interfaces;
using Domain.Enums;
using Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Implementations;

public class DiscountService : IDiscountService
{
    private readonly IUnitOfWork _unitOfWork;

    public DiscountService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DiscountResponseDto> CreateDiscountAsync(CreateDiscountDto dto, int createdById)
    {
        if (dto.Value <= 0)
            throw new ArgumentException("Discount value must be greater than 0.");

        if (dto.Type == DiscountType.Percentage && dto.Value > 100)
            throw new ArgumentException("Percentage discount cannot exceed 100%.");

        var creator = await _unitOfWork.Employees.GetByIdAsync(createdById);
        if (creator == null)
            throw new KeyNotFoundException($"Employee '{createdById}' not found.");

        var discount = new Discount
        {
            Name = dto.Name.Trim(),
            Type = dto.Type,
            Value = Math.Round(dto.Value, 2),
            DiscountPercent = dto.Type == DiscountType.Percentage ? Math.Round(dto.Value, 2) : null,
            DiscountAmount = dto.Type == DiscountType.FixedAmount ? Math.Round(dto.Value, 2) : null,
            Reason = dto.Reason.Trim(),
            IsActive = dto.IsActive,
            IsApproved = dto.IsApproved,
            ValidFrom = dto.ValidFrom,
            ValidTo = dto.ValidTo,
            CreatedById = createdById,
            ApprovedBy = createdById,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Discounts.AddAsync(discount);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(discount, creator.FullName);
    }

    public async Task<DiscountResponseDto> GetDiscountByIdAsync(int id)
    {
        var discount = await _unitOfWork.Discounts.Query()
            .Include(d => d.CreatedBy)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (discount == null)
            throw new KeyNotFoundException($"Discount '{id}' not found.");

        return MapToDto(discount, discount.CreatedBy?.FullName ?? "Manager");
    }

    public async Task<IEnumerable<DiscountResponseDto>> GetAllDiscountsAsync()
    {
        var list = await _unitOfWork.Discounts.Query()
            .Include(d => d.CreatedBy)
            .Where(d => d.OrderId == null)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        return list.Select(d => MapToDto(d, d.CreatedBy?.FullName ?? "Manager"));
    }

    public async Task<IEnumerable<DiscountResponseDto>> GetActiveDiscountsAsync()
    {
        var now = DateTime.UtcNow;
        var list = await _unitOfWork.Discounts.Query()
            .Include(d => d.CreatedBy)
            .Where(d => d.OrderId == null && d.IsActive && d.IsApproved)
            .Where(d => d.ValidFrom == null || d.ValidFrom <= now)
            .Where(d => d.ValidTo == null || d.ValidTo >= now)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        return list.Select(d => MapToDto(d, d.CreatedBy?.FullName ?? "Manager"));
    }

    public async Task<DiscountResponseDto> UpdateDiscountAsync(int id, UpdateDiscountDto dto)
    {
        var discount = await _unitOfWork.Discounts.Query()
            .Include(d => d.CreatedBy)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (discount == null)
            throw new KeyNotFoundException($"Discount '{id}' not found.");

        if (dto.Value <= 0)
            throw new ArgumentException("Discount value must be greater than 0.");

        if (dto.Type == DiscountType.Percentage && dto.Value > 100)
            throw new ArgumentException("Percentage discount cannot exceed 100%.");

        discount.Name = dto.Name.Trim();
        discount.Type = dto.Type;
        discount.Value = Math.Round(dto.Value, 2);
        discount.DiscountPercent = dto.Type == DiscountType.Percentage ? Math.Round(dto.Value, 2) : null;
        discount.DiscountAmount = dto.Type == DiscountType.FixedAmount ? Math.Round(dto.Value, 2) : null;
        discount.Reason = dto.Reason.Trim();
        discount.IsActive = dto.IsActive;
        discount.IsApproved = dto.IsApproved;
        discount.ValidFrom = dto.ValidFrom;
        discount.ValidTo = dto.ValidTo;
        discount.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Discounts.Update(discount);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(discount, discount.CreatedBy?.FullName ?? "Manager");
    }

    public async Task<DiscountResponseDto> UpdateDiscountStatusAsync(int id, UpdateDiscountStatusDto dto)
    {
        var discount = await _unitOfWork.Discounts.Query()
            .Include(d => d.CreatedBy)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (discount == null)
            throw new KeyNotFoundException($"Discount '{id}' not found.");

        discount.IsActive = dto.IsActive;
        if (dto.IsApproved.HasValue)
        {
            discount.IsApproved = dto.IsApproved.Value;
        }
        discount.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Discounts.Update(discount);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(discount, discount.CreatedBy?.FullName ?? "Manager");
    }

    public async Task<bool> DeleteDiscountAsync(int id)
    {
        var discount = await _unitOfWork.Discounts.GetByIdAsync(id);
        if (discount == null)
            return false;

        _unitOfWork.Discounts.Remove(discount);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private static DiscountResponseDto MapToDto(Discount d, string createdByName)
    {
        return new DiscountResponseDto
        {
            Id = d.Id,
            Name = string.IsNullOrWhiteSpace(d.Name) ? (d.Type == DiscountType.Percentage ? $"{d.DiscountPercent}% Discount" : $"{d.DiscountAmount} EGP Discount") : d.Name,
            Type = d.Type,
            Value = d.Value > 0 ? d.Value : (d.DiscountPercent ?? d.DiscountAmount ?? 0),
            DiscountPercent = d.DiscountPercent,
            DiscountAmount = d.DiscountAmount,
            Reason = d.Reason,
            IsActive = d.IsActive,
            IsApproved = d.IsApproved,
            ValidFrom = d.ValidFrom,
            ValidTo = d.ValidTo,
            CreatedById = d.CreatedById,
            CreatedByName = createdByName,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt
        };
    }
}
