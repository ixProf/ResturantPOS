using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Inventory;
using Application.Services.Interfaces;
using Domain.Enums;
using Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Implementations;

public class InventoryService : IInventoryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IOrderNotificationService? _notificationService;

    public InventoryService(IUnitOfWork unitOfWork, IOrderNotificationService? notificationService = null)
    {
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task<IngredientDto> CreateIngredientAsync(CreateIngredientDto dto)
    {
        var ingredient = new Ingredient
        {
            Name = dto.Name,
            TotalStock = dto.TotalStock,
            Unit = dto.Unit,
            LowStockAlert = dto.LowStockAlert
        };

        await _unitOfWork.Ingredients.AddAsync(ingredient);
        await _unitOfWork.SaveChangesAsync();

        return MapToIngredientDto(ingredient);
    }

    public async Task<IngredientDto> GetIngredientByIdAsync(int id)
    {
        var ingredient = await _unitOfWork.Ingredients.GetByIdAsync(id);
        if (ingredient == null)
            throw new KeyNotFoundException($"Ingredient with ID '{id}' was not found.");

        return MapToIngredientDto(ingredient);
    }

    public async Task<IEnumerable<IngredientDto>> GetAllIngredientsAsync()
    {
        var ingredients = await _unitOfWork.Ingredients.GetAllAsync();
        return ingredients.Select(MapToIngredientDto);
    }

    public async Task<IngredientDto> UpdateIngredientAsync(int id, UpdateIngredientDto dto)
    {
        var ingredient = await _unitOfWork.Ingredients.GetByIdAsync(id);
        if (ingredient == null)
            throw new KeyNotFoundException($"Ingredient with ID '{id}' was not found.");

        ingredient.Name = dto.Name;
        ingredient.Unit = dto.Unit;
        ingredient.LowStockAlert = dto.LowStockAlert;

        _unitOfWork.Ingredients.Update(ingredient);
        await _unitOfWork.SaveChangesAsync();
        return MapToIngredientDto(ingredient);
    }

    public async Task<bool> DeleteIngredientAsync(int id)
    {
        var ingredient = await _unitOfWork.Ingredients.GetByIdAsync(id);
        if (ingredient == null)
            return false;

        _unitOfWork.Ingredients.Remove(ingredient);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<StockTransactionDto> AdjustStockAsync(StockAdjustmentDto dto)
    {
        using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var ingredient = await _unitOfWork.Ingredients.GetByIdAsync(dto.IngredientId);
            if (ingredient == null)
                throw new KeyNotFoundException($"Ingredient with ID '{dto.IngredientId}' was not found.");

            decimal oldStock = ingredient.TotalStock;
            ingredient.TotalStock += dto.Quantity;

            _unitOfWork.Ingredients.Update(ingredient);

            var log = new InventoryLog
            {
                IngredientId = dto.IngredientId,
                QuantityChange = dto.Quantity,
                Reason = dto.Reason ?? dto.Type.ToString(),
                Timestamp = DateTime.UtcNow
            };

            await _unitOfWork.InventoryLogs.AddAsync(log);
            await _unitOfWork.CommitTransactionAsync();

            return new StockTransactionDto
            {
                Id = log.Id,
                IngredientId = ingredient.Id,
                IngredientName = ingredient.Name,
                PreviousStock = oldStock,
                NewStock = ingredient.TotalStock,
                QuantityChanged = dto.Quantity,
                Reason = log.Reason,
                Timestamp = log.Timestamp ?? DateTime.UtcNow
            };
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<InventoryPurchaseResponseDto> CreateInventoryPurchaseAsync(CreateInventoryPurchaseDto dto, int createdById)
    {
        if (dto.IngredientId <= 0)
            throw new ArgumentException("Invalid ingredient ID.");

        if (dto.Quantity <= 0)
            throw new ArgumentException("Quantity must be greater than zero.");

        if (dto.UnitCost < 0)
            throw new ArgumentException("Unit cost cannot be negative.");

        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new ArgumentException("Reason/description is required.");

        decimal totalAmount = Math.Round(dto.Quantity * dto.UnitCost, 2);
        if (totalAmount <= 0)
            throw new InvalidOperationException("Total purchase amount must be greater than zero.");

        using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var ingredient = await _unitOfWork.Ingredients.GetByIdAsync(dto.IngredientId);
            if (ingredient == null)
                throw new KeyNotFoundException($"Ingredient with ID '{dto.IngredientId}' was not found.");

            var creator = await _unitOfWork.Employees.GetByIdAsync(createdById);
            if (creator == null)
                throw new KeyNotFoundException($"Employee with ID '{createdById}' was not found.");

            // Step 1: Increase inventory stock
            ingredient.TotalStock += dto.Quantity;
            _unitOfWork.Ingredients.Update(ingredient);

            // Step 2: Create InventoryPurchase record
            var purchase = new InventoryPurchase
            {
                IngredientId = dto.IngredientId,
                Quantity = dto.Quantity,
                UnitCost = dto.UnitCost,
                TotalAmount = totalAmount,
                Reason = dto.Reason.Trim(),
                PurchaseDate = DateTime.UtcNow,
                CreatedById = createdById
            };
            await _unitOfWork.InventoryPurchases.AddAsync(purchase);

            // Step 3: Create InventoryLog (ReasonType = Purchase)
            await _unitOfWork.InventoryLogs.AddAsync(new InventoryLog
            {
                IngredientId = dto.IngredientId,
                QuantityChange = dto.Quantity,
                ReasonType = InventoryReasonType.Purchase,
                Reason = $"Inventory Purchase: {dto.Reason.Trim()} (+{dto.Quantity} {ingredient.Unit} @ {dto.UnitCost} EGP/unit)",
                Timestamp = DateTime.UtcNow
            });

            // Step 4: Create FinancialRecord (Expense)
            await _unitOfWork.FinancialRecords.AddAsync(new FinancialRecord
            {
                Type = FinancialRecordType.Expense,
                Amount = totalAmount,
                Description = $"Inventory Purchase: {dto.Quantity} {ingredient.Unit} of {ingredient.Name} ({dto.Reason.Trim()})",
                RecordDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            });

            await _unitOfWork.CommitTransactionAsync();

            if (_notificationService != null)
            {
                _ = _notificationService.NotifySalesUpdatedAsync(0, purchase.Id, totalAmount);
            }

            return new InventoryPurchaseResponseDto
            {
                Id = purchase.Id,
                IngredientId = ingredient.Id,
                IngredientName = ingredient.Name,
                Quantity = purchase.Quantity,
                UnitCost = purchase.UnitCost,
                TotalAmount = purchase.TotalAmount,
                Reason = purchase.Reason,
                PurchaseDate = purchase.PurchaseDate,
                CreatedById = creator.Id,
                CreatedByName = creator.FullName
            };
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<IEnumerable<InventoryPurchaseResponseDto>> GetInventoryPurchasesAsync()
    {
        var purchases = await _unitOfWork.InventoryPurchases.Query()
            .Include(p => p.Ingredient)
            .Include(p => p.CreatedBy)
            .OrderByDescending(p => p.PurchaseDate)
            .ToListAsync();

        return purchases.Select(p => new InventoryPurchaseResponseDto
        {
            Id = p.Id,
            IngredientId = p.IngredientId,
            IngredientName = p.Ingredient?.Name ?? "Unknown",
            Quantity = p.Quantity,
            UnitCost = p.UnitCost,
            TotalAmount = p.TotalAmount,
            Reason = p.Reason,
            PurchaseDate = p.PurchaseDate,
            CreatedById = p.CreatedById,
            CreatedByName = p.CreatedBy?.FullName ?? "Unknown"
        });
    }

    public async Task<IEnumerable<LowStockDto>> GetLowStockAlertsAsync()
    {
        var lowStockIngredients = await _unitOfWork.Ingredients.Query()
            .Where(i => i.LowStockAlert.HasValue && i.TotalStock <= i.LowStockAlert.Value)
            .ToListAsync();

        return lowStockIngredients.Select(i => new LowStockDto
        {
            IngredientId = i.Id,
            IngredientName = i.Name,
            CurrentStock = i.TotalStock,
            LowStockThreshold = i.LowStockAlert ?? 0,
            Unit = i.Unit
        });
    }

    public async Task<IEnumerable<InventoryItemDto>> GetInventoryOverviewAsync()
    {
        var ingredients = await _unitOfWork.Ingredients.GetAllAsync();
        return ingredients.Select(i => new InventoryItemDto
        {
            IngredientId = i.Id,
            IngredientName = i.Name,
            TotalStock = i.TotalStock,
            Unit = i.Unit,
            IsLowStock = i.LowStockAlert.HasValue && i.TotalStock <= i.LowStockAlert.Value
        });
    }

    public async Task<bool> CheckRecipeAvailabilityAsync(int menuItemId, int quantity)
    {
        var recipeItems = await _unitOfWork.MenuItemIngredients.Query()
            .Include(mi => mi.Ingredient)
            .Where(mi => mi.MenuItemId == menuItemId)
            .ToListAsync();

        foreach (var recipeItem in recipeItems)
        {
            decimal requiredAmount = recipeItem.QuantityUsed * quantity;
            if (recipeItem.Ingredient.TotalStock < requiredAmount)
            {
                return false;
            }
        }

        return true;
    }

    public async Task<bool> DeductInventoryForOrderAsync(int orderId)
    {
        var orderItems = await _unitOfWork.OrderItems.Query()
            .Where(oi => oi.OrderId == orderId && oi.Status != OrderItemStatus.Cancelled && oi.Status != OrderItemStatus.Voided)
            .Include(oi => oi.MenuItem)
                .ThenInclude(mi => mi.MenuItemIngredients)
                    .ThenInclude(mig => mig.Ingredient)
            .ToListAsync();

        foreach (var orderItem in orderItems)
        {
            foreach (var recipeItem in orderItem.MenuItem.MenuItemIngredients)
            {
                decimal totalDeduction = recipeItem.QuantityUsed * orderItem.Quantity;
                recipeItem.Ingredient.TotalStock -= totalDeduction;
                _unitOfWork.Ingredients.Update(recipeItem.Ingredient);

                await _unitOfWork.InventoryLogs.AddAsync(new InventoryLog
                {
                    IngredientId = recipeItem.IngredientId,
                    QuantityChange = -totalDeduction,
                    Reason = $"Order #{orderId} item completed ({orderItem.MenuItem.Name} x{orderItem.Quantity})",
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestoreInventoryForOrderAsync(int orderId)
    {
        var orderItems = await _unitOfWork.OrderItems.Query()
            .Where(oi => oi.OrderId == orderId && oi.Status != OrderItemStatus.Cancelled && oi.Status != OrderItemStatus.Voided)
            .Include(oi => oi.MenuItem)
                .ThenInclude(mi => mi.MenuItemIngredients)
                    .ThenInclude(mig => mig.Ingredient)
            .ToListAsync();

        foreach (var orderItem in orderItems)
        {
            foreach (var recipeItem in orderItem.MenuItem.MenuItemIngredients)
            {
                decimal totalRestored = recipeItem.QuantityUsed * orderItem.Quantity;
                recipeItem.Ingredient.TotalStock += totalRestored;
                _unitOfWork.Ingredients.Update(recipeItem.Ingredient);

                await _unitOfWork.InventoryLogs.AddAsync(new InventoryLog
                {
                    IngredientId = recipeItem.IngredientId,
                    QuantityChange = totalRestored,
                    Reason = $"Order #{orderId} cancelled/refunded ({orderItem.MenuItem.Name} x{orderItem.Quantity})",
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private static IngredientDto MapToIngredientDto(Ingredient i)
    {
        return new IngredientDto
        {
            Id = i.Id,
            Name = i.Name,
            TotalStock = i.TotalStock,
            Unit = i.Unit,
            LowStockAlert = i.LowStockAlert
        };
    }
}

