using Application.DTOs.Payments;
using FluentValidation;

namespace Application.Validation;

public class CreatePaymentDtoValidator : AbstractValidator<CreatePaymentDto>
{
    public CreatePaymentDtoValidator()
    {
        RuleFor(x => x.OrderId)
            .GreaterThan(0).WithMessage("Valid OrderId is required.");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Payment amount must be greater than zero.");

        RuleFor(x => x.PaymentMethod)
            .IsInEnum().WithMessage("Valid payment method is required.");
    }
}

public class IssueRefundDtoValidator : AbstractValidator<IssueRefundDto>
{
    public IssueRefundDtoValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Refund amount must be greater than zero.");

        RuleFor(x => x.RefundType)
            .IsInEnum().WithMessage("Valid refund type is required.");

        RuleFor(x => x.RefundDetail)
            .NotEmpty().WithMessage("Refund detail/reason is required.")
            .MaximumLength(500);
    }
}

public class ApplyDiscountDtoValidator : AbstractValidator<ApplyDiscountDto>
{
    public ApplyDiscountDtoValidator()
    {
        RuleFor(x => x.DiscountAmount)
            .GreaterThanOrEqualTo(0).WithMessage("Discount amount cannot be negative.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Discount reason is required.")
            .MaximumLength(250);
    }
}
