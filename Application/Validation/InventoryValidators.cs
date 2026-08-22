using Application.DTOs.Inventory;
using FluentValidation;

namespace Application.Validation;

public class CreateIngredientDtoValidator : AbstractValidator<CreateIngredientDto>
{
    public CreateIngredientDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ingredient name is required.")
            .MaximumLength(100);

        RuleFor(x => x.Unit)
            .NotEmpty().WithMessage("Unit of measurement is required.")
            .MaximumLength(20);

        RuleFor(x => x.Quantity)
            .GreaterThanOrEqualTo(0).WithMessage("Quantity cannot be negative.");
    }
}

public class UpdateIngredientDtoValidator : AbstractValidator<UpdateIngredientDto>
{
    public UpdateIngredientDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ingredient name is required.")
            .MaximumLength(100);

        RuleFor(x => x.Unit)
            .NotEmpty().WithMessage("Unit of measurement is required.")
            .MaximumLength(20);
    }
}

public class StockAdjustmentDtoValidator : AbstractValidator<StockAdjustmentDto>
{
    public StockAdjustmentDtoValidator()
    {
        RuleFor(x => x.IngredientId)
            .GreaterThan(0).WithMessage("Valid IngredientId is required.");

        RuleFor(x => x.Quantity)
            .NotEqual(0).WithMessage("Adjustment quantity cannot be zero.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Valid inventory reason type is required.");
    }
}
