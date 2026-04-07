using CRMF360.Application.Common;
using FluentAssertions;
using Xunit;

namespace CRMF360.Tests.Domain;

public class PagedResultTests
{
    [Theory]
    [InlineData(100, 10, 10)]
    [InlineData(101, 10, 11)]
    [InlineData(0, 10, 0)]
    [InlineData(1, 10, 1)]
    [InlineData(20, 20, 1)]
    public void TotalPages_CalculatesCorrectly(int totalCount, int pageSize, int expectedPages)
    {
        var result = new PagedResult<string>
        {
            TotalCount = totalCount,
            PageSize = pageSize,
        };

        result.TotalPages.Should().Be(expectedPages);
    }

    [Fact]
    public void HasPrevious_FirstPage_ReturnsFalse()
    {
        var result = new PagedResult<string> { Page = 1, PageSize = 10, TotalCount = 50 };

        result.HasPrevious.Should().BeFalse();
    }

    [Fact]
    public void HasPrevious_SecondPage_ReturnsTrue()
    {
        var result = new PagedResult<string> { Page = 2, PageSize = 10, TotalCount = 50 };

        result.HasPrevious.Should().BeTrue();
    }

    [Fact]
    public void HasNext_LastPage_ReturnsFalse()
    {
        var result = new PagedResult<string> { Page = 5, PageSize = 10, TotalCount = 50 };

        result.HasNext.Should().BeFalse();
    }

    [Fact]
    public void HasNext_MiddlePage_ReturnsTrue()
    {
        var result = new PagedResult<string> { Page = 3, PageSize = 10, TotalCount = 50 };

        result.HasNext.Should().BeTrue();
    }
}
