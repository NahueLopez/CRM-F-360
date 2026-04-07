using CRMF360.Application.Deals;
using CRMF360.Domain.Entities;
using CRMF360.Infrastructure.Services;
using CRMF360.Tests.Helpers;
using FluentAssertions;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace CRMF360.Tests.Services;

public class DealServiceTests
{
    private DealService CreateService(out Infrastructure.Persistence.ApplicationDbContext context)
    {
        context = TestDbContextFactory.Create();
        return new DealService(context);
    }

    [Fact]
    public async Task CreateAsync_SetsDefaultStageAndCurrency()
    {
        var svc = CreateService(out var ctx);
        // Stage "Lead" is a valid DealStage enum value
        var dto = new CreateDealDto { Title = "New Deal", Stage = "Lead" };

        var result = await svc.CreateAsync(userId: 1, dto);

        result.Should().NotBeNull();
        result.Title.Should().Be("New Deal");
        result.Stage.Should().Be("Lead");
        result.Currency.Should().Be("ARS");
    }

    [Fact]
    public async Task CreateAsync_InvalidStage_DefaultsToLead()
    {
        var svc = CreateService(out _);
        var dto = new CreateDealDto { Title = "Bad Stage Deal", Stage = "InvalidStage" };

        var result = await svc.CreateAsync(userId: 1, dto);

        result.Stage.Should().Be("Lead");
    }

    [Fact]
    public async Task MoveAsync_ValidStage_UpdatesStageAndOrder()
    {
        var svc = CreateService(out var ctx);
        var deal = new Deal
        {
            Title = "Deal 1",
            Stage = DealStage.Lead,
            SortOrder = 0,
            TenantId = 0,
            Currency = "ARS",
        };
        ctx.Deals.Add(deal);
        await ctx.SaveChangesAsync();

        var result = await svc.MoveAsync(deal.Id, new MoveDealDto { Stage = "Proposal", SortOrder = 5 });

        result.Should().BeTrue();
        var entity = await ctx.Deals.FindAsync(deal.Id);
        entity!.Stage.Should().Be(DealStage.Proposal);
        entity.SortOrder.Should().Be(5);
    }

    [Fact]
    public async Task MoveAsync_InvalidStage_ReturnsFalse()
    {
        var svc = CreateService(out var ctx);
        var deal = new Deal
        {
            Title = "Deal 2",
            Stage = DealStage.Lead,
            TenantId = 0,
            Currency = "ARS",
        };
        ctx.Deals.Add(deal);
        await ctx.SaveChangesAsync();

        var result = await svc.MoveAsync(deal.Id, new MoveDealDto { Stage = "FakeStage" });

        result.Should().BeFalse();
    }

    [Fact]
    public async Task MoveAsync_NonExistingId_ReturnsFalse()
    {
        var svc = CreateService(out _);

        var result = await svc.MoveAsync(999, new MoveDealDto { Stage = "Lead" });

        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_SetsSoftDelete()
    {
        var svc = CreateService(out var ctx);
        var deal = new Deal
        {
            Title = "ToDelete",
            Stage = DealStage.Lead,
            TenantId = 0,
            Currency = "ARS",
        };
        ctx.Deals.Add(deal);
        await ctx.SaveChangesAsync();

        var result = await svc.DeleteAsync(deal.Id);

        result.Should().BeTrue();
        var entity = await ctx.Deals.FindAsync(deal.Id);
        entity!.IsDeleted.Should().BeTrue();
        entity.DeletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task GetSummaryAsync_GroupsByStage()
    {
        var svc = CreateService(out var ctx);
        ctx.Deals.AddRange(
            new Deal { Title = "D1", Stage = DealStage.Lead, Value = 1000, TenantId = 0, Currency = "ARS" },
            new Deal { Title = "D2", Stage = DealStage.Lead, Value = 2000, TenantId = 0, Currency = "ARS" },
            new Deal { Title = "D3", Stage = DealStage.Proposal, Value = 5000, TenantId = 0, Currency = "ARS" });
        await ctx.SaveChangesAsync();

        var result = await svc.GetSummaryAsync();

        result.Should().HaveCount(2);
        var leadSummary = result.First(s => s.Stage == "Lead");
        leadSummary.Count.Should().Be(2);
        leadSummary.TotalValue.Should().Be(3000);
    }
}
