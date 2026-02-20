using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRMF360.Infrastructure.Persistence.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");
        builder.HasKey(rt => rt.Id);
        builder.Property(rt => rt.Token).IsRequired().HasMaxLength(256);
        builder.HasIndex(rt => rt.Token).IsUnique();
        builder.HasIndex(rt => new { rt.UserId, rt.RevokedAt });

        builder.HasOne(rt => rt.User)
            .WithMany()
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Ignore computed properties
        builder.Ignore(rt => rt.IsRevoked);
        builder.Ignore(rt => rt.IsExpired);
        builder.Ignore(rt => rt.IsActive);
    }
}
