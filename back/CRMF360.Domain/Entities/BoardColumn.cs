namespace CRMF360.Domain.Entities;

public class BoardColumn
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Name { get; set; } = null!;
    public int SortOrder { get; set; }

    // Navigation
    public Project Project { get; set; } = null!;
    public ICollection<Task> Tasks { get; set; } = new List<Task>();
}
