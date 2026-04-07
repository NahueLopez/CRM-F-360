using CRMF360.Application.Common;
using CRMF360.Application.Companies;
using CRMF360.Domain.Entities;
using CRMF360.Infrastructure.Services;
using CRMF360.Tests.Helpers;
using FluentAssertions;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace CRMF360.Tests.Services;

public class CompanyServiceTests
{
    private CompanyService CreateService(out Infrastructure.Persistence.ApplicationDbContext context, string? dbName = null)
    {
        context = TestDbContextFactory.Create(dbName);
        return new CompanyService(context);
    }

    // ── GetAll ──

    [Fact]
    public async Task GetAllAsync_ReturnsOrderedByName()
    {
        var svc = CreateService(out var ctx);
        ctx.Companies.AddRange(
            new Company { Name = "Zebra", TenantId = 0 },
            new Company { Name = "Alfa", TenantId = 0 },
            new Company { Name = "Mid", TenantId = 0 });
        await ctx.SaveChangesAsync();

        var result = await svc.GetAllAsync();

        result.Should().HaveCount(3);
        result[0].Name.Should().Be("Alfa");
        result[1].Name.Should().Be("Mid");
        result[2].Name.Should().Be("Zebra");
    }

    // ── GetPaged ──

    [Fact]
    public async Task GetPagedAsync_ReturnsCorrectPage()
    {
        var svc = CreateService(out var ctx);
        for (int i = 1; i <= 25; i++)
            ctx.Companies.Add(new Company { Name = $"Company {i:D2}", TenantId = 0 });
        await ctx.SaveChangesAsync();

        var result = await svc.GetPagedAsync(new PaginationParams { Page = 2, PageSize = 10 });

        result.Items.Should().HaveCount(10);
        result.Page.Should().Be(2);
        result.TotalCount.Should().Be(25);
        result.TotalPages.Should().Be(3);
        result.HasPrevious.Should().BeTrue();
        result.HasNext.Should().BeTrue();
    }

    [Fact]
    public async Task GetPagedAsync_LastPage_HasNextIsFalse()
    {
        var svc = CreateService(out var ctx);
        ctx.Companies.AddRange(
            new Company { Name = "Acme Corp", TenantId = 0 },
            new Company { Name = "Beta LLC", TenantId = 0 },
            new Company { Name = "Acme Industries", TenantId = 0 });
        await ctx.SaveChangesAsync();

        // Page size larger than total ⇒ single page, no next
        var result = await svc.GetPagedAsync(new PaginationParams { Page = 1, PageSize = 10 });

        result.Items.Should().HaveCount(3);
        result.HasNext.Should().BeFalse();
        result.HasPrevious.Should().BeFalse();
    }

    // ── GetById ──

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        var svc = CreateService(out var ctx);
        var company = new Company { Name = "TestCo", Email = "test@co.com", TenantId = 0 };
        ctx.Companies.Add(company);
        await ctx.SaveChangesAsync();

        var result = await svc.GetByIdAsync(company.Id);

        result.Should().NotBeNull();
        result!.Name.Should().Be("TestCo");
        result.Email.Should().Be("test@co.com");
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        var svc = CreateService(out _);

        var result = await svc.GetByIdAsync(999);

        result.Should().BeNull();
    }

    // ── Create ──

    [Fact]
    public async Task CreateAsync_AddsAndReturnsMappedDto()
    {
        var svc = CreateService(out var ctx);

        var dto = new CreateCompanyDto
        {
            Name = "New Company",
            Cuit = "30-12345678-9",
            Email = "info@newco.com",
            Industry = "Tech"
        };

        var result = await svc.CreateAsync(dto);

        result.Id.Should().BeGreaterThan(0);
        result.Name.Should().Be("New Company");
        result.Cuit.Should().Be("30-12345678-9");
        result.Email.Should().Be("info@newco.com");
        result.Industry.Should().Be("Tech");
        result.Active.Should().BeTrue();

        ctx.Companies.Should().HaveCount(1);
    }

    // ── Update ──

    [Fact]
    public async Task UpdateAsync_ExistingId_UpdatesFields()
    {
        var svc = CreateService(out var ctx);
        var company = new Company { Name = "Old Name", TenantId = 0, Active = true };
        ctx.Companies.Add(company);
        await ctx.SaveChangesAsync();

        var updated = await svc.UpdateAsync(company.Id, new UpdateCompanyDto
        {
            Name = "New Name",
            Email = "updated@co.com",
            Active = false,
        });

        updated.Should().BeTrue();
        var entity = await ctx.Companies.FindAsync(company.Id);
        entity!.Name.Should().Be("New Name");
        entity.Email.Should().Be("updated@co.com");
        entity.Active.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateAsync_NonExistingId_ReturnsFalse()
    {
        var svc = CreateService(out _);

        var result = await svc.UpdateAsync(999, new UpdateCompanyDto { Name = "X" });

        result.Should().BeFalse();
    }

    // ── Delete (soft) ──

    [Fact]
    public async Task DeleteAsync_SetsSoftDeleteFields()
    {
        var svc = CreateService(out var ctx);
        var company = new Company { Name = "ToDelete", TenantId = 0 };
        ctx.Companies.Add(company);
        await ctx.SaveChangesAsync();

        var result = await svc.DeleteAsync(company.Id);

        result.Should().BeTrue();
        var entity = await ctx.Companies.FindAsync(company.Id);
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
}
