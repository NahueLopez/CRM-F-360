using CRMF360.Application.Contacts;
using CRMF360.Application.Validation;
using FluentValidation.TestHelper;
using Xunit;

namespace CRMF360.Tests.Validators;

public class ContactValidatorTests
{
    private readonly CreateContactValidator _createValidator = new();
    private readonly UpdateContactValidator _updateValidator = new();

    [Fact]
    public void CreateContact_CompanyIdZero_ShouldFail()
    {
        var dto = new CreateContactDto { CompanyId = 0, FullName = "Test" };
        var result = _createValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.CompanyId);
    }

    [Fact]
    public void CreateContact_NegativeCompanyId_ShouldFail()
    {
        var dto = new CreateContactDto { CompanyId = -1, FullName = "Test" };
        var result = _createValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.CompanyId);
    }

    [Fact]
    public void CreateContact_EmptyName_ShouldFail()
    {
        var dto = new CreateContactDto { CompanyId = 1, FullName = "" };
        var result = _createValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.FullName);
    }

    [Fact]
    public void CreateContact_ValidData_ShouldPass()
    {
        var dto = new CreateContactDto
        {
            CompanyId = 1,
            FullName = "John Doe",
            Email = "john@example.com",
            Phone = "+54 11 1234-5678"
        };
        var result = _createValidator.TestValidate(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void CreateContact_InvalidEmail_ShouldFail()
    {
        var dto = new CreateContactDto { CompanyId = 1, FullName = "Test", Email = "bad-email" };
        var result = _createValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void UpdateContact_EmptyName_ShouldFail()
    {
        var dto = new UpdateContactDto { FullName = "" };
        var result = _updateValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.FullName);
    }

    [Fact]
    public void UpdateContact_ValidData_ShouldPass()
    {
        var dto = new UpdateContactDto { FullName = "Updated Name" };
        var result = _updateValidator.TestValidate(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }
}
