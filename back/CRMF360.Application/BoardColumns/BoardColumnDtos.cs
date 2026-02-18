namespace CRMF360.Application.BoardColumns;

public class BoardColumnDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Name { get; set; } = null!;
    public int SortOrder { get; set; }
    public int TaskCount { get; set; }
}

public class CreateBoardColumnDto
{
    public int ProjectId { get; set; }
    public string Name { get; set; } = null!;
}

public class UpdateBoardColumnDto
{
    public string Name { get; set; } = null!;
    public int SortOrder { get; set; }
}
