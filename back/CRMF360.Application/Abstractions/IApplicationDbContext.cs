using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Application.Abstractions;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<Company> Companies { get; }
    DbSet<Project> Projects { get; }
    DbSet<BoardColumn> BoardColumns { get; }
    DbSet<Domain.Entities.Task> Tasks { get; }
    DbSet<TimeEntry> TimeEntries { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
