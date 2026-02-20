using CRMF360.Application.Abstractions;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using TaskEntity = CRMF360.Domain.Entities.Task;

namespace CRMF360.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<BoardColumn> BoardColumns => Set<BoardColumn>();
    public DbSet<TaskEntity> Tasks => Set<TaskEntity>();
    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<TaskComment> TaskComments => Set<TaskComment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Reminder> Reminders => Set<Reminder>();
    public DbSet<Deal> Deals => Set<Deal>();
    public DbSet<ChatConversation> ChatConversations => Set<ChatConversation>();
    public DbSet<ChatParticipant> ChatParticipants => Set<ChatParticipant>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Auto-apply all IEntityTypeConfiguration<T> classes from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // ──── Global Soft Delete Filters ────
        modelBuilder.Entity<Company>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Contact>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Project>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Deal>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<CRMF360.Domain.Entities.Task>().HasQueryFilter(e => !e.IsDeleted);
    }
}
