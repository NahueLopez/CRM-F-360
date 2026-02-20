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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ──── Global Soft Delete Filters ────
        modelBuilder.Entity<Company>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Contact>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Project>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Deal>().HasQueryFilter(e => !e.IsDeleted);

        // ──── User ────
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasKey(u => u.Id);
            e.Property(u => u.FullName).IsRequired().HasMaxLength(200);
            e.Property(u => u.Email).IsRequired().HasMaxLength(200);
            e.HasIndex(u => u.Email).IsUnique();
        });

        // ──── Role ────
        modelBuilder.Entity<Role>(e =>
        {
            e.ToTable("Roles");
            e.HasKey(r => r.Id);
            e.Property(r => r.Name).IsRequired().HasMaxLength(100);
            e.HasIndex(r => r.Name).IsUnique();
        });

        // ──── UserRole ────
        modelBuilder.Entity<UserRole>(e =>
        {
            e.ToTable("UserRoles");
            e.HasKey(ur => new { ur.UserId, ur.RoleId });

            e.HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ──── Company ────
        modelBuilder.Entity<Company>(e =>
        {
            e.ToTable("Companies");
            e.HasKey(c => c.Id);
            e.Property(c => c.Name).IsRequired().HasMaxLength(200);
            e.Property(c => c.Cuit).HasMaxLength(20);
            e.Property(c => c.Email).HasMaxLength(200);
            e.Property(c => c.Phone).HasMaxLength(50);
        });

        // ──── Project ────
        modelBuilder.Entity<Project>(e =>
        {
            e.ToTable("Projects");
            e.HasKey(p => p.Id);
            e.Property(p => p.Name).IsRequired().HasMaxLength(200);
            e.Property(p => p.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();
            e.Property(p => p.EstimatedHours).HasPrecision(10, 2);

            e.HasOne(p => p.Company)
                .WithMany(c => c.Projects)
                .HasForeignKey(p => p.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ──── BoardColumn ────
        modelBuilder.Entity<BoardColumn>(e =>
        {
            e.ToTable("BoardColumns");
            e.HasKey(bc => bc.Id);
            e.Property(bc => bc.Name).IsRequired().HasMaxLength(100);

            e.HasOne(bc => bc.Project)
                .WithMany(p => p.BoardColumns)
                .HasForeignKey(bc => bc.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ──── Task ────
        modelBuilder.Entity<TaskEntity>(e =>
        {
            e.ToTable("Tasks");
            e.HasKey(t => t.Id);
            e.Property(t => t.Title).IsRequired().HasMaxLength(300);
            e.Property(t => t.Priority)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            e.HasOne(t => t.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(t => t.Column)
                .WithMany(bc => bc.Tasks)
                .HasForeignKey(t => t.ColumnId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(t => t.Assignee)
                .WithMany()
                .HasForeignKey(t => t.AssigneeId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ──── TimeEntry ────
        modelBuilder.Entity<TimeEntry>(e =>
        {
            e.ToTable("TimeEntries");
            e.HasKey(te => te.Id);
            e.Property(te => te.Hours).HasPrecision(6, 2);
            e.Property(te => te.Date).IsRequired();

            e.HasOne(te => te.Task)
                .WithMany(t => t.TimeEntries)
                .HasForeignKey(te => te.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(te => te.User)
                .WithMany()
                .HasForeignKey(te => te.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ──── ProjectMember ────
        modelBuilder.Entity<ProjectMember>(e =>
        {
            e.ToTable("ProjectMembers");
            e.HasKey(pm => pm.Id);
            e.Property(pm => pm.Role).HasMaxLength(50);

            e.HasOne(pm => pm.Project)
                .WithMany(p => p.Members)
                .HasForeignKey(pm => pm.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(pm => pm.User)
                .WithMany(u => u.ProjectMembers)
                .HasForeignKey(pm => pm.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(pm => new { pm.ProjectId, pm.UserId }).IsUnique();
        });

        // ──── Contact ────
        modelBuilder.Entity<Contact>(e =>
        {
            e.ToTable("Contacts");
            e.HasKey(c => c.Id);
            e.Property(c => c.FullName).HasMaxLength(200).IsRequired();
            e.Property(c => c.Email).HasMaxLength(200);
            e.Property(c => c.Phone).HasMaxLength(50);
            e.Property(c => c.Position).HasMaxLength(100);
            e.Property(c => c.Notes).HasMaxLength(2000);

            e.HasOne(c => c.Company)
                .WithMany(co => co.Contacts)
                .HasForeignKey(c => c.CompanyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ──── ActivityLog ────
        modelBuilder.Entity<ActivityLog>(e =>
        {
            e.ToTable("ActivityLogs");
            e.HasKey(a => a.Id);
            e.Property(a => a.Type).HasMaxLength(50).IsRequired();
            e.Property(a => a.Description).HasMaxLength(4000).IsRequired();

            e.HasOne(a => a.Company)
                .WithMany(c => c.Activities)
                .HasForeignKey(a => a.CompanyId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(a => a.Contact)
                .WithMany(c => c.Activities)
                .HasForeignKey(a => a.ContactId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(a => a.Project)
                .WithMany()
                .HasForeignKey(a => a.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ──── TaskComment ────
        modelBuilder.Entity<TaskComment>(e =>
        {
            e.ToTable("TaskComments");
            e.HasKey(tc => tc.Id);
            e.Property(tc => tc.Content).HasMaxLength(4000).IsRequired();

            e.HasOne(tc => tc.Task)
                .WithMany(t => t.Comments)
                .HasForeignKey(tc => tc.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(tc => tc.User)
                .WithMany()
                .HasForeignKey(tc => tc.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ──── Notification ────
        modelBuilder.Entity<Notification>(e =>
        {
            e.ToTable("Notifications");
            e.HasKey(n => n.Id);
            e.Property(n => n.Type).HasMaxLength(50).IsRequired();
            e.Property(n => n.Title).HasMaxLength(300).IsRequired();
            e.Property(n => n.Message).HasMaxLength(2000);
            e.Property(n => n.RelatedEntityType).HasMaxLength(50);

            e.HasOne(n => n.User).WithMany().HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(n => new { n.UserId, n.IsRead });
        });

        // ──── AuditLog ────
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.ToTable("AuditLogs");
            e.HasKey(a => a.Id);
            e.Property(a => a.Action).HasMaxLength(50).IsRequired();
            e.Property(a => a.EntityType).HasMaxLength(50).IsRequired();
            e.Property(a => a.EntityName).HasMaxLength(300);
            e.Property(a => a.Details).HasMaxLength(4000);

            e.HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(a => a.CreatedAt);
        });

        // ──── Reminder ────
        modelBuilder.Entity<Reminder>(e =>
        {
            e.ToTable("Reminders");
            e.HasKey(r => r.Id);
            e.Property(r => r.Title).HasMaxLength(200).IsRequired();
            e.Property(r => r.Description).HasMaxLength(2000);

            e.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.Contact).WithMany().HasForeignKey(r => r.ContactId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(r => r.Company).WithMany().HasForeignKey(r => r.CompanyId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(r => r.Project).WithMany().HasForeignKey(r => r.ProjectId).OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(r => new { r.UserId, r.IsCompleted });
        });

        // ──── Deal ────
        modelBuilder.Entity<Deal>(e =>
        {
            e.ToTable("Deals");
            e.HasKey(d => d.Id);
            e.Property(d => d.Title).HasMaxLength(200).IsRequired();
            e.Property(d => d.Notes).HasMaxLength(4000);
            e.Property(d => d.Currency).HasMaxLength(10);
            e.Property(d => d.Value).HasColumnType("decimal(18,2)");
            e.Property(d => d.Stage).HasConversion<string>().HasMaxLength(20);

            e.HasOne(d => d.Company).WithMany().HasForeignKey(d => d.CompanyId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(d => d.Contact).WithMany().HasForeignKey(d => d.ContactId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(d => d.AssignedTo).WithMany().HasForeignKey(d => d.AssignedToId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(d => d.Stage);
        });

        // ──── ChatConversation ────
        modelBuilder.Entity<ChatConversation>(e =>
        {
            e.ToTable("ChatConversations");
            e.HasKey(c => c.Id);
            e.Property(c => c.Name).HasMaxLength(100);
            e.HasOne(c => c.CreatedBy).WithMany().HasForeignKey(c => c.CreatedById).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(c => c.LastMessageAt);
        });

        // ──── ChatParticipant ────
        modelBuilder.Entity<ChatParticipant>(e =>
        {
            e.ToTable("ChatParticipants");
            e.HasKey(p => p.Id);
            e.HasOne(p => p.Conversation).WithMany(c => c.Participants).HasForeignKey(p => p.ConversationId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(p => p.User).WithMany().HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(p => new { p.ConversationId, p.UserId }).IsUnique();
            e.HasIndex(p => p.UserId);
        });

        // ──── ChatMessage ────
        modelBuilder.Entity<ChatMessage>(e =>
        {
            e.ToTable("ChatMessages");
            e.HasKey(m => m.Id);
            e.Property(m => m.Content).HasMaxLength(4000).IsRequired();
            e.HasOne(m => m.Conversation).WithMany(c => c.Messages).HasForeignKey(m => m.ConversationId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(m => m.Sender).WithMany().HasForeignKey(m => m.SenderId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(m => new { m.ConversationId, m.SentAt });
        });
    }
}
