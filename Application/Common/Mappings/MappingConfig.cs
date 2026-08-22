using Application.DTOs.Authentication;
using Application.DTOs.Employees;
using Application.DTOs.Inventory;
using Application.DTOs.Menu;
using Application.DTOs.Menu.Categories;
using Application.DTOs.Notifications;
using Application.DTOs.Orders;
using Application.DTOs.Payments;
using Application.DTOs.Tables;
using Domain.Models;
using Mapster;

namespace Application.Common.Mappings;

public static class MappingConfig
{
    public static void RegisterMappings()
    {
        TypeAdapterConfig<Category, CategoryDto>.NewConfig();
        TypeAdapterConfig<CreateCategoryDto, Category>.NewConfig();

        TypeAdapterConfig<MenuItem, MenuItemDto>
            .NewConfig()
            .Map(dest => dest.CategoryName, src => src.Category != null ? src.Category.Name : string.Empty);

        TypeAdapterConfig<MenuItem, MenuItemDetailsDto>
            .NewConfig()
            .Map(dest => dest.CategoryName, src => src.Category != null ? src.Category.Name : string.Empty);

        TypeAdapterConfig<Employee, EmployeeDto>.NewConfig();

        TypeAdapterConfig<RestaurantTable, TableResponseDto>
            .NewConfig()
            .Map(dest => dest.WaiterName, src => src.Waiter != null ? src.Waiter.FullName : string.Empty);

        TypeAdapterConfig<RestaurantTable, TableSummaryDto>
            .NewConfig()
            .Map(dest => dest.WaiterName, src => src.Waiter != null ? src.Waiter.FullName : string.Empty);

        TypeAdapterConfig<Ingredient, IngredientDto>.NewConfig();
        TypeAdapterConfig<CreateIngredientDto, Ingredient>.NewConfig();

        TypeAdapterConfig<Order, OrderResponseDto>
            .NewConfig()
            .Map(dest => dest.TotalAmount, src => src.FinalAmount);

        TypeAdapterConfig<Order, OrderSummaryDto>
            .NewConfig()
            .Map(dest => dest.TableNumber, src => src.Table != null ? src.Table.TableNumber : 0)
            .Map(dest => dest.WaiterName, src => src.Waiter != null ? src.Waiter.FullName : string.Empty)
            .Map(dest => dest.ItemCount, src => src.OrderItems.Count);

        TypeAdapterConfig<Payment, PaymentDto>
            .NewConfig()
            .Map(dest => dest.AmountPaid, src => src.FinalAmount);

        TypeAdapterConfig<Notification, NotificationDto>.NewConfig();
    }
}
