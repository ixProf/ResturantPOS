using Application.DTOs.Orders;
using FluentValidation;

namespace Application.Validation;

public class CreateOrderDtoValidator : AbstractValidator<CreateOrderDto>
{
    public CreateOrderDtoValidator()
    {
        RuleFor(x => x.TableId)
            .GreaterThan(0).WithMessage("Valid TableId is required.");
    }
}

public class AddOrderItemDtoValidator : AbstractValidator<AddOrderItemDto>
{
    public AddOrderItemDtoValidator()
    {
        RuleFor(x => x.MenuItemId)
            .GreaterThan(0).WithMessage("Valid MenuItemId is required.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.");
    }
}

public class UpdateOrderStatusDtoValidator : AbstractValidator<UpdateOrderStatusDto>
{
    public UpdateOrderStatusDtoValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Valid OrderStatus is required.");
    }
}

public class UpdateOrderItemStatusDtoValidator : AbstractValidator<UpdateOrderItemStatusDto>
{
    public UpdateOrderItemStatusDtoValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Valid OrderItemStatus is required.");
    }
}

public class CancelOrderDtoValidator : AbstractValidator<CancelOrderDto>
{
    public CancelOrderDtoValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Cancellation reason is required.")
            .MaximumLength(500);
    }
}
