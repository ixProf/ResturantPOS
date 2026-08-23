using System.Collections.Generic;
using System.Threading.Tasks;
using Application.DTOs.Discounts;

namespace Application.Services.Interfaces;

public interface IDiscountService
{
    Task<DiscountResponseDto> CreateDiscountAsync(CreateDiscountDto dto, int createdById);
    Task<DiscountResponseDto> GetDiscountByIdAsync(int id);
    Task<IEnumerable<DiscountResponseDto>> GetAllDiscountsAsync();
    Task<IEnumerable<DiscountResponseDto>> GetActiveDiscountsAsync();
    Task<DiscountResponseDto> UpdateDiscountAsync(int id, UpdateDiscountDto dto);
    Task<DiscountResponseDto> UpdateDiscountStatusAsync(int id, UpdateDiscountStatusDto dto);
    Task<bool> DeleteDiscountAsync(int id);
}
