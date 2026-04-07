using CRMF360.Application.Contacts;
using CRMF360.Domain.Entities;
using CRMF360.Infrastructure.Services;
using CRMF360.Tests.Helpers;
using FluentAssertions;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace CRMF360.Tests.Services;

public class ContactServiceTests
{
    private ContactService CreateService(out Infrastructure.Persistence.ApplicationDbContext context)
    {
        context = TestDbContextFactory.Create();
        return new ContactService(context);
    }

    private static Company SeedCompany(Infrastructure.Persistence.ApplicationDbContext ctx, string name = "TestCo")
    {
        var company = new Company { Name = name, TenantId = 0 };
        ctx.Companies.Add(company);
        ctx.SaveChanges();
        return company;
    }

    [Fact]
    public async Task GetByCompanyAsync_FiltersCorrectly()
    {
        var svc = CreateService(out var ctx);
        var co1 = SeedCompany(ctx, "Co1");
        var co2 = SeedCompany(ctx, "Co2");

        ctx.Contacts.AddRange(
            new Contact { FullName = "Alice", CompanyId = co1.Id },
            new Contact { FullName = "Bob", CompanyId = co1.Id },
            new Contact { FullName = "Charlie", CompanyId = co2.Id });
        await ctx.SaveChangesAsync();

        var result = await svc.GetByCompanyAsync(co1.Id);

        result.Should().HaveCount(2);
        result.Should().OnlyContain(c => c.CompanyName == "Co1");
    }

    [Fact]
    public async Task CreateAsync_SetsCreatedAt()
    {
        var svc = CreateService(out var ctx);
        var company = SeedCompany(ctx);

        var before = DateTime.UtcNow;
        var result = await svc.CreateAsync(new CreateContactDto
        {
            CompanyId = company.Id,
            FullName = "New Contact",
            Email = "new@test.com"
        });
        var after = DateTime.UtcNow;

        result.Should().NotBeNull();
        result.FullName.Should().Be("New Contact");
        result.CreatedAt.Should().BeOnOrAfter(before).And.BeOnOrBefore(after);
    }

    [Fact]
    public async Task DeleteAsync_SetsSoftDelete()
    {
        var svc = CreateService(out var ctx);
        var company = SeedCompany(ctx);
        var contact = new Contact { FullName = "ToDelete", CompanyId = company.Id };
        ctx.Contacts.Add(contact);
        await ctx.SaveChangesAsync();

        var result = await svc.DeleteAsync(contact.Id);

        result.Should().BeTrue();
        var entity = await ctx.Contacts.FindAsync(contact.Id);
        entity!.IsDeleted.Should().BeTrue();
        entity.DeletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteAsync_NonExistingId_ReturnsFalse()
    {
        var svc = CreateService(out _);

        var result = await svc.DeleteAsync(999);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetByIdAsync_ExistingContact_ReturnsDto()
    {
        var svc = CreateService(out var ctx);
        var company = SeedCompany(ctx);
        var contact = new Contact
        {
            FullName = "John Doe",
            Email = "john@test.com",
            Phone = "123-456",
            CompanyId = company.Id
        };
        ctx.Contacts.Add(contact);
        await ctx.SaveChangesAsync();

        var result = await svc.GetByIdAsync(contact.Id);

        result.Should().NotBeNull();
        result!.FullName.Should().Be("John Doe");
        result.CompanyName.Should().Be("TestCo");
    }

    [Fact]
    public async Task GetByIdAsync_NonExisting_ReturnsNull()
    {
        var svc = CreateService(out _);

        var result = await svc.GetByIdAsync(999);

        result.Should().BeNull();
    }
}
