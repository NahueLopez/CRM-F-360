using CRMF360.Application.Common;
using FluentAssertions;
using Xunit;

namespace CRMF360.Tests.Domain;

public class PaginationParamsTests
{
    [Fact]
    public void PageSize_DefaultIs20()
    {
        var p = new PaginationParams();

        p.PageSize.Should().Be(20);
    }

    [Fact]
    public void PageSize_ClampsToMax100()
    {
        var p = new PaginationParams { PageSize = 500 };

        p.PageSize.Should().Be(100);
    }

    [Fact]
    public void PageSize_AllowsValueUnder100()
    {
        var p = new PaginationParams { PageSize = 50 };

        p.PageSize.Should().Be(50);
    }

    [Fact]
    public void PageSize_AllowsExactly100()
    {
        var p = new PaginationParams { PageSize = 100 };

        p.PageSize.Should().Be(100);
    }

    [Fact]
    public void Page_DefaultIs1()
    {
        var p = new PaginationParams();

        p.Page.Should().Be(1);
    }
}
