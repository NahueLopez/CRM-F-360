using CRMF360.Application.Abstractions;
using CRMF360.Application.Search;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class SearchService : ISearchService
{
    private readonly IApplicationDbContext _db;
    public SearchService(IApplicationDbContext db) => _db = db;

    public async Task<List<SearchResultDto>> SearchAsync(string query, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            return new();

        var pattern = $"%{query}%";

        // Sequential queries — DbContext is NOT thread-safe, cannot use Task.WhenAll
        // Global Query Filters automatically isolate results by tenant
        var companies = await _db.Companies.AsNoTracking()
            .Where(c => EF.Functions.ILike(c.Name, pattern) || (c.Cuit != null && c.Cuit.Contains(query)))
            .Take(5)
            .Select(c => new SearchResultDto
            {
                Type = "Company", Id = c.Id, Title = c.Name,
                Subtitle = c.Cuit, Link = "/companies",
            })
            .ToListAsync(ct);

        var contacts = await _db.Contacts.AsNoTracking()
            .Where(c => EF.Functions.ILike(c.FullName, pattern)
                || (c.Email != null && EF.Functions.ILike(c.Email, pattern))
                || (c.Phone != null && c.Phone.Contains(query)))
            .Take(5)
            .Select(c => new SearchResultDto
            {
                Type = "Contact", Id = c.Id, Title = c.FullName,
                Subtitle = c.Company.Name, Link = "/contacts",
            })
            .ToListAsync(ct);

        var projects = await _db.Projects.AsNoTracking()
            .Where(p => EF.Functions.ILike(p.Name, pattern))
            .Take(5)
            .Select(p => new SearchResultDto
            {
                Type = "Project", Id = p.Id, Title = p.Name,
                Subtitle = p.Company.Name, Link = "/projects/" + p.Id + "/board",
            })
            .ToListAsync(ct);

        var tasks = await _db.Tasks.AsNoTracking()
            .Where(t => EF.Functions.ILike(t.Title, pattern))
            .Take(5)
            .Select(t => new SearchResultDto
            {
                Type = "Task", Id = t.Id, Title = t.Title,
                Subtitle = t.Project.Name, Link = "/projects/" + t.ProjectId + "/board",
            })
            .ToListAsync(ct);

        var deals = await _db.Deals.AsNoTracking()
            .Where(d => EF.Functions.ILike(d.Title, pattern))
            .Take(5)
            .Select(d => new SearchResultDto
            {
                Type = "Deal", Id = d.Id, Title = d.Title,
                Subtitle = d.Stage.ToString(), Link = "/pipeline",
            })
            .ToListAsync(ct);

        var results = new List<SearchResultDto>(25);
        results.AddRange(companies);
        results.AddRange(contacts);
        results.AddRange(projects);
        results.AddRange(tasks);
        results.AddRange(deals);

        return results;
    }
}
