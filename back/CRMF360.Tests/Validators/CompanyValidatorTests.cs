using CRMF360.Application.Companies;
using CRMF360.Application.Validation;
using FluentValidation.TestHelper;
using Xunit;

namespace CRMF360.Tests.Validators;

public class CompanyValidatorTests
{
    private readonly CreateCompanyValidator _createValidator = new();
    private readonly UpdateCompanyValidator _updateValidator = new();

    // ── CreateCompany ──

    [Fact]
    public void CreateCompany_EmptyName_ShouldFail()
    {
        var dto = new CreateCompanyDto { Name = "" };
        var result = _createValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void CreateCompany_ValidData_ShouldPass()
    {
        var dto = new CreateCompanyDto
        {
            Name = "Valid Company",
            Email = "valid@company.com",
            Cuit = "30-12345678-9",
        };
        var result = _createValidator.TestValidate(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void CreateCompany_InvalidEmail_ShouldFail()
    {
        var dto = new CreateCompanyDto { Name = "Co", Email = "not-an-email" };
        var result = _createValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void CreateCompany_NullEmail_ShouldPass()
    {
        var dto = new CreateCompanyDto { Name = "Co", Email = null };
        var result = _createValidator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void CreateCompany_NameTooLong_ShouldFail()
    {
        var dto = new CreateCompanyDto { Name = new string('A', 201) };
        var result = _createValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void CreateCompany_CuitTooLong_ShouldFail()
    {
        var dto = new CreateCompanyDto { Name = "Co", Cuit = new string('1', 21) };
        var result = _createValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.Cuit);
    }

    // ── UpdateCompany ──

    [Fact]
    public void UpdateCompany_EmptyName_ShouldFail()
    {
        var dto = new UpdateCompanyDto { Name = "" };
        var result = _updateValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void UpdateCompany_ValidData_ShouldPass()
    {
        var dto = new UpdateCompanyDto { Name = "Updated Co", Active = true };
        var result = _updateValidator.TestValidate(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }
}
