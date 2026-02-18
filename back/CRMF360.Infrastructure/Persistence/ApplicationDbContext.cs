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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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
    }
}
