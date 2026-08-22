using Application.DTOs.Tables;
using FluentValidation;

namespace Application.Validation;

public class CreateTableDtoValidator : AbstractValidator<CreateTableDto>
{
    public CreateTableDtoValidator()
    {
        RuleFor(x => x.TableNumber)
            .GreaterThan(0).WithMessage("Table number must be positive.");

        RuleFor(x => x.Capacity)
            .GreaterThan(0).WithMessage("Table capacity must be positive.");
    }
}

public class UpdateTableDtoValidator : AbstractValidator<UpdateTableDto>
{
    public UpdateTableDtoValidator()
    {
        RuleFor(x => x.TableNumber)
            .GreaterThan(0).WithMessage("Table number must be positive.");

        RuleFor(x => x.Capacity)
            .GreaterThan(0).WithMessage("Table capacity must be positive.");
    }
}

public class UpdateTableStatusDtoValidator : AbstractValidator<UpdateTableStatusDto>
{
    public UpdateTableStatusDtoValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Valid TableStatus is required.");
    }
}

public class TransferTableDtoValidator : AbstractValidator<TransferTableDto>
{
    public TransferTableDtoValidator()
    {
        RuleFor(x => x.OrderId)
            .GreaterThan(0).WithMessage("Valid OrderId is required.");

        RuleFor(x => x.SourceTableId)
            .GreaterThan(0).WithMessage("Valid SourceTableId is required.");

        RuleFor(x => x.DestinationTableId)
            .GreaterThan(0).WithMessage("Valid DestinationTableId is required.");

        RuleFor(x => x)
            .Must(x => x.SourceTableId != x.DestinationTableId)
            .WithMessage("Source and destination tables must be different.");
    }
}
