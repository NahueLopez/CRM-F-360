using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRMF360.Infrastructure.Persistence.Configurations;

public class BoardColumnConfiguration : IEntityTypeConfiguration<BoardColumn>
{
    public void Configure(EntityTypeBuilder<BoardColumn> builder)
    {
        builder.ToTable("BoardColumns");
        builder.HasKey(bc => bc.Id);
        builder.Property(bc => bc.Name).IsRequired().HasMaxLength(100);

        builder.HasOne(bc => bc.Project)
            .WithMany(p => p.BoardColumns)
            .HasForeignKey(bc => bc.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
