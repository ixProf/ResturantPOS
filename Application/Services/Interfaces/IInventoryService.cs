using Application.DTOs.Inventory;

namespace Application.Services.Interfaces;

public interface IInventoryService
{
    // Ingredients
    Task<IngredientDto> CreateIngredientAsync(CreateIngredientDto dto);
    Task<IngredientDto> GetIngredientByIdAsync(int id);
    Task<IEnumerable<IngredientDto>> GetAllIngredientsAsync();
    Task<IngredientDto> UpdateIngredientAsync(int id, UpdateIngredientDto dto);
    Task<bool> DeleteIngredientAsync(int id);

    // Stock Management
    Task<StockTransactionDto> AdjustStockAsync(StockAdjustmentDto dto);
    Task<IEnumerable<LowStockDto>> GetLowStockAlertsAsync();
    Task<IEnumerable<InventoryItemDto>> GetInventoryOverviewAsync();

    // Order Recipe & Deduction Integration
    Task<bool> CheckRecipeAvailabilityAsync(int menuItemId, int quantity);
    Task<bool> DeductInventoryForOrderAsync(int orderId);
    Task<bool> RestoreInventoryForOrderAsync(int orderId);
}
