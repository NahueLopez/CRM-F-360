using CRMF360.Application.Companies;
using CRMF360.Application.Contacts;
using CRMF360.Application.Deals;
using FluentValidation;

namespace CRMF360.Application.Validation;

// ── Company ──

public class CreateCompanyValidator : AbstractValidator<CreateCompanyDto>
{
    public CreateCompanyValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre es obligatorio")
            .MaximumLength(200);

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))
            .WithMessage("Email inválido");

        RuleFor(x => x.Cuit).MaximumLength(20);
        RuleFor(x => x.Phone).MaximumLength(50);
        RuleFor(x => x.Industry).MaximumLength(100);
        RuleFor(x => x.Website).MaximumLength(200);
    }
}

public class UpdateCompanyValidator : AbstractValidator<UpdateCompanyDto>
{
    public UpdateCompanyValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre es obligatorio")
            .MaximumLength(200);

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))
            .WithMessage("Email inválido");

        RuleFor(x => x.Cuit).MaximumLength(20);
        RuleFor(x => x.Phone).MaximumLength(50);
        RuleFor(x => x.Industry).MaximumLength(100);
        RuleFor(x => x.Website).MaximumLength(200);
    }
}

// ── Contact ──

public class CreateContactValidator : AbstractValidator<CreateContactDto>
{
    public CreateContactValidator()
    {
        RuleFor(x => x.CompanyId).GreaterThan(0).WithMessage("Seleccioná una empresa");
        RuleFor(x => x.FullName).NotEmpty().WithMessage("El nombre es obligatorio").MaximumLength(200);
        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))
            .WithMessage("Email inválido");
        RuleFor(x => x.Phone).MaximumLength(50);
        RuleFor(x => x.Position).MaximumLength(100);
        RuleFor(x => x.Notes).MaximumLength(2000);
    }
}

public class UpdateContactValidator : AbstractValidator<UpdateContactDto>
{
    public UpdateContactValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().WithMessage("El nombre es obligatorio").MaximumLength(200);
        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))
            .WithMessage("Email inválido");
        RuleFor(x => x.Phone).MaximumLength(50);
        RuleFor(x => x.Position).MaximumLength(100);
        RuleFor(x => x.Notes).MaximumLength(2000);
    }
}

// ── Deal ──

public class CreateDealValidator : AbstractValidator<CreateDealDto>
{
    private static readonly string[] ValidStages =
        { "Lead", "Contacted", "Proposal", "Negotiation", "ClosedWon", "ClosedLost" };

    public CreateDealValidator()
    {
        RuleFor(x => x.Title).NotEmpty().WithMessage("El título es obligatorio").MaximumLength(200);
        RuleFor(x => x.Stage).Must(s => ValidStages.Contains(s)).WithMessage("Stage inválido");
        RuleFor(x => x.Value).GreaterThanOrEqualTo(0).When(x => x.Value.HasValue).WithMessage("El valor no puede ser negativo");
        RuleFor(x => x.Currency).MaximumLength(10);
        RuleFor(x => x.Notes).MaximumLength(4000);
    }
}

public class UpdateDealValidator : AbstractValidator<UpdateDealDto>
{
    public UpdateDealValidator()
    {
        RuleFor(x => x.Title).NotEmpty().WithMessage("El título es obligatorio").MaximumLength(200);
        RuleFor(x => x.Value).GreaterThanOrEqualTo(0).When(x => x.Value.HasValue).WithMessage("El valor no puede ser negativo");
        RuleFor(x => x.Currency).MaximumLength(10);
        RuleFor(x => x.Notes).MaximumLength(4000);
    }
}

public class MoveDealValidator : AbstractValidator<MoveDealDto>
{
    private static readonly string[] ValidStages =
        { "Lead", "Contacted", "Proposal", "Negotiation", "ClosedWon", "ClosedLost" };

    public MoveDealValidator()
    {
        RuleFor(x => x.Stage).NotEmpty().Must(s => ValidStages.Contains(s)).WithMessage("Stage inválido");
    }
}
