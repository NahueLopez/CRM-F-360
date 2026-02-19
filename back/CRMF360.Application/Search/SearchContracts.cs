namespace CRMF360.Application.Search;

public class SearchResultDto
{
    public string Type { get; set; } = null!;   // Company, Contact, Project, Task, Deal
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string? Subtitle { get; set; }
    public string? Link { get; set; }
}

public interface ISearchService
{
    Task<List<SearchResultDto>> SearchAsync(string query, CancellationToken ct = default);
}
