using CRMF360.Application.Deals;
using CRMF360.Application.Validation;
using FluentValidation.TestHelper;
using Xunit;

namespace CRMF360.Tests.Validators;

public class DealValidatorTests
{
    private readonly CreateDealValidator _createValidator = new();
    private readonly MoveDealValidator _moveValidator = new();
    private readonly UpdateDealValidator _updateValidator = new();

    // ── CreateDeal ──

    [Fact]
    public void CreateDeal_EmptyTitle_ShouldFail()
    {
        var dto = new CreateDealDto { Title = "", Stage = "Lead" };
        var result = _createValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public void CreateDeal_InvalidStage_ShouldFail()
    {
        var dto = new CreateDealDto { Title = "Deal", Stage = "FakeStage" };
        var result = _createValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.Stage);
    }

    [Fact]
    public void CreateDeal_ValidStages_ShouldPass()
    {
        var validStages = new[] { "Lead", "Contacted", "Proposal", "Negotiation", "ClosedWon", "ClosedLost" };
        foreach (var stage in validStages)
        {
            var dto = new CreateDealDto { Title = "Deal", Stage = stage };
            var result = _createValidator.TestValidate(dto);
            result.ShouldNotHaveValidationErrorFor(x => x.Stage);
        }
    }

    [Fact]
    public void CreateDeal_NegativeValue_ShouldFail()
    {
        var dto = new CreateDealDto { Title = "Deal", Stage = "Lead", Value = -100 };
        var result = _createValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.Value);
    }

    [Fact]
    public void CreateDeal_NullValue_ShouldPass()
    {
        var dto = new CreateDealDto { Title = "Deal", Stage = "Lead", Value = null };
        var result = _createValidator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.Value);
    }

    [Fact]
    public void CreateDeal_ValidData_ShouldPass()
    {
        var dto = new CreateDealDto
        {
            Title = "Big Deal",
            Stage = "Proposal",
            Value = 50000,
            Currency = "USD"
        };
        var result = _createValidator.TestValidate(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    // ── MoveDeal ──

    [Fact]
    public void MoveDeal_ValidStage_ShouldPass()
    {
        var dto = new MoveDealDto { Stage = "Negotiation" };
        var result = _moveValidator.TestValidate(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void MoveDeal_InvalidStage_ShouldFail()
    {
        var dto = new MoveDealDto { Stage = "InvalidStage" };
        var result = _moveValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.Stage);
    }

    [Fact]
    public void MoveDeal_EmptyStage_ShouldFail()
    {
        var dto = new MoveDealDto { Stage = "" };
        var result = _moveValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.Stage);
    }

    // ── UpdateDeal ──

    [Fact]
    public void UpdateDeal_EmptyTitle_ShouldFail()
    {
        var dto = new UpdateDealDto { Title = "" };
        var result = _updateValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public void UpdateDeal_NegativeValue_ShouldFail()
    {
        var dto = new UpdateDealDto { Title = "Deal", Value = -1 };
        var result = _updateValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.Value);
    }
}
