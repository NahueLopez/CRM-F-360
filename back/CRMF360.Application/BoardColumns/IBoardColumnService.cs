namespace CRMF360.Application.BoardColumns;

public interface IBoardColumnService
{
    Task<List<BoardColumnDto>> GetByProjectAsync(int projectId, CancellationToken ct = default);
    Task<BoardColumnDto> CreateAsync(CreateBoardColumnDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateBoardColumnDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
