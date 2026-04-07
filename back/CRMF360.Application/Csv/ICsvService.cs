namespace CRMF360.Application.Csv;

public interface ICsvService
{
    Task<byte[]> ExportCompaniesAsync(CancellationToken ct = default);
    Task<byte[]> ExportContactsAsync(CancellationToken ct = default);
    Task<byte[]> ExportDealsAsync(CancellationToken ct = default);
    Task<CsvImportResultDto> ImportCompaniesAsync(Stream csvStream, CancellationToken ct = default);
    Task<CsvImportResultDto> ImportContactsAsync(Stream csvStream, CancellationToken ct = default);
}

public class CsvImportResultDto
{
    public int Imported { get; set; }
    public int Skipped { get; set; }
    public List<string> Errors { get; set; } = new();
}
