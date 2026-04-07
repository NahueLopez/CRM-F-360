using CRMF360.Application.Abstractions;
using CRMF360.Application.Csv;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text;

namespace CRMF360.Infrastructure.Services;

public class CsvService : ICsvService
{
    private readonly IApplicationDbContext _db;
    public CsvService(IApplicationDbContext db) => _db = db;

    public async Task<byte[]> ExportCompaniesAsync(CancellationToken ct = default)
    {
        var companies = await _db.Companies.AsNoTracking().OrderBy(c => c.Name).ToListAsync(ct);
        var sb = new StringBuilder();
        sb.AppendLine("Id,Nombre,CUIT,Email,Teléfono,Industria,Website,Activo,FechaCreación");
        foreach (var c in companies)
            sb.AppendLine($"{c.Id},{Esc(c.Name)},{Esc(c.Cuit)},{Esc(c.Email)},{Esc(c.Phone)},{Esc(c.Industry)},{Esc(c.Website)},{c.Active},{c.CreatedAt:yyyy-MM-dd}");
        return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
    }

    public async Task<byte[]> ExportContactsAsync(CancellationToken ct = default)
    {
        var contacts = await _db.Contacts.AsNoTracking().Include(c => c.Company).OrderBy(c => c.FullName).ToListAsync(ct);
        var sb = new StringBuilder();
        sb.AppendLine("Id,Nombre,Email,Teléfono,Cargo,Empresa,Activo,FechaCreación");
        foreach (var c in contacts)
            sb.AppendLine($"{c.Id},{Esc(c.FullName)},{Esc(c.Email)},{Esc(c.Phone)},{Esc(c.Position)},{Esc(c.Company?.Name)},{c.Active},{c.CreatedAt:yyyy-MM-dd}");
        return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
    }

    public async Task<byte[]> ExportDealsAsync(CancellationToken ct = default)
    {
        var deals = await _db.Deals.AsNoTracking().Include(d => d.Company).Include(d => d.AssignedTo).OrderBy(d => d.Title).ToListAsync(ct);
        var sb = new StringBuilder();
        sb.AppendLine("Id,Título,Empresa,Asignado,Etapa,Valor,Moneda,FechaCierreEstimada,FechaCreación");
        foreach (var d in deals)
            sb.AppendLine($"{d.Id},{Esc(d.Title)},{Esc(d.Company?.Name)},{Esc(d.AssignedTo?.FullName)},{d.Stage},{d.Value},{Esc(d.Currency)},{d.ExpectedCloseDate:yyyy-MM-dd},{d.CreatedAt:yyyy-MM-dd}");
        return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
    }

    public async Task<CsvImportResultDto> ImportCompaniesAsync(Stream csvStream, CancellationToken ct = default)
    {
        var result = new CsvImportResultDto();
        using var reader = new StreamReader(csvStream, Encoding.UTF8);
        var header = await reader.ReadLineAsync(ct); // skip header
        int line = 1;
        while (await reader.ReadLineAsync(ct) is { } row)
        {
            line++;
            var cols = ParseCsvLine(row);
            if (cols.Length < 2 || string.IsNullOrWhiteSpace(cols[1]))
            {
                result.Errors.Add($"Línea {line}: nombre vacío");
                result.Skipped++;
                continue;
            }
            _db.Companies.Add(new Company
            {
                Name = cols[1],
                Cuit = cols.Length > 2 ? NullIfEmpty(cols[2]) : null,
                Email = cols.Length > 3 ? NullIfEmpty(cols[3]) : null,
                Phone = cols.Length > 4 ? NullIfEmpty(cols[4]) : null,
                Industry = cols.Length > 5 ? NullIfEmpty(cols[5]) : null,
                Website = cols.Length > 6 ? NullIfEmpty(cols[6]) : null,
                Active = true,
                CreatedAt = DateTime.UtcNow
            });
            result.Imported++;
        }
        if (result.Imported > 0) await _db.SaveChangesAsync(ct);
        return result;
    }

    public async Task<CsvImportResultDto> ImportContactsAsync(Stream csvStream, CancellationToken ct = default)
    {
        var result = new CsvImportResultDto();
        var companies = await _db.Companies.AsNoTracking().ToListAsync(ct);
        using var reader = new StreamReader(csvStream, Encoding.UTF8);
        var header = await reader.ReadLineAsync(ct);
        int line = 1;
        while (await reader.ReadLineAsync(ct) is { } row)
        {
            line++;
            var cols = ParseCsvLine(row);
            if (cols.Length < 2 || string.IsNullOrWhiteSpace(cols[1]))
            {
                result.Errors.Add($"Línea {line}: nombre vacío");
                result.Skipped++;
                continue;
            }
            var companyName = cols.Length > 5 ? cols[5]?.Trim() : null;
            var company = companyName != null ? companies.FirstOrDefault(c => c.Name.Equals(companyName, StringComparison.OrdinalIgnoreCase)) : null;
            if (company == null && !string.IsNullOrEmpty(companyName))
            {
                result.Errors.Add($"Línea {line}: empresa '{companyName}' no encontrada");
                result.Skipped++;
                continue;
            }
            _db.Contacts.Add(new Contact
            {
                FullName = cols[1],
                Email = cols.Length > 2 ? NullIfEmpty(cols[2]) : null,
                Phone = cols.Length > 3 ? NullIfEmpty(cols[3]) : null,
                Position = cols.Length > 4 ? NullIfEmpty(cols[4]) : null,
                CompanyId = company?.Id ?? 0,
                Active = true,
                CreatedAt = DateTime.UtcNow
            });
            result.Imported++;
        }
        if (result.Imported > 0) await _db.SaveChangesAsync(ct);
        return result;
    }

    private static string Esc(string? value)
        => value == null ? "" : $"\"{value.Replace("\"", "\"\"")}\"";

    private static string? NullIfEmpty(string? s)
        => string.IsNullOrWhiteSpace(s) ? null : s.Trim().Trim('"');

    private static string[] ParseCsvLine(string line)
    {
        var result = new List<string>();
        bool inQuotes = false;
        var current = new StringBuilder();
        foreach (var c in line)
        {
            if (c == '"') { inQuotes = !inQuotes; continue; }
            if (c == ',' && !inQuotes) { result.Add(current.ToString()); current.Clear(); continue; }
            current.Append(c);
        }
        result.Add(current.ToString());
        return result.ToArray();
    }
}
