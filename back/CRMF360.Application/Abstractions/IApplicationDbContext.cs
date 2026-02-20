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
    DbSet<ProjectMember> ProjectMembers { get; }
    DbSet<Contact> Contacts { get; }
    DbSet<ActivityLog> ActivityLogs { get; }
    DbSet<TaskComment> TaskComments { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<Reminder> Reminders { get; }
    DbSet<Deal> Deals { get; }
    DbSet<ChatConversation> ChatConversations { get; }
    DbSet<ChatParticipant> ChatParticipants { get; }
    DbSet<ChatMessage> ChatMessages { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
