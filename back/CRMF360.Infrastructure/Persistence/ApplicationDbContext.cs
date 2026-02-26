using CRMF360.Application.Abstractions;
using CRMF360.Domain.Entities;
using CRMF360.Domain.Events;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaskEntity = CRMF360.Domain.Entities.Task;

namespace CRMF360.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly IHttpContextAccessor? _httpContextAccessor;
    private readonly IDomainEventDispatcher? _eventDispatcher;
    private int _currentTenantId;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        IHttpContextAccessor? httpContextAccessor = null,
        IDomainEventDispatcher? eventDispatcher = null)
        : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
        _eventDispatcher = eventDispatcher;
        _currentTenantId = ResolveTenantId();
    }

    // ── DbSets ──
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
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
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<ChatConversation> ChatConversations => Set<ChatConversation>();
    public DbSet<ChatParticipant> ChatParticipants => Set<ChatParticipant>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Auto-apply all IEntityTypeConfiguration<T> classes from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // ──── Global Tenant + Soft Delete Filters ────
        // Root entities with TenantId + SoftDelete
        modelBuilder.Entity<Company>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _currentTenantId);
        modelBuilder.Entity<Deal>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _currentTenantId);
        modelBuilder.Entity<Lead>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _currentTenantId);

        // Root entities with TenantId only (no soft-delete)
        modelBuilder.Entity<User>().HasQueryFilter(e => e.TenantId == _currentTenantId);
        modelBuilder.Entity<ActivityLog>().HasQueryFilter(e => e.TenantId == _currentTenantId);
        modelBuilder.Entity<AuditLog>().HasQueryFilter(e => e.TenantId == _currentTenantId);
        modelBuilder.Entity<Notification>().HasQueryFilter(e => e.TenantId == _currentTenantId);
        modelBuilder.Entity<Reminder>().HasQueryFilter(e => e.TenantId == _currentTenantId);
        modelBuilder.Entity<ChatConversation>().HasQueryFilter(e => e.TenantId == _currentTenantId);

        // Child entities with SoftDelete only (tenant isolation inherited via FK)
        modelBuilder.Entity<Contact>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Project>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<TaskEntity>().HasQueryFilter(e => !e.IsDeleted);

        // ──── Concurrency Tokens (PostgreSQL xmin) ────
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(IConcurrencyAware).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .Property<uint>("RowVersion")
                    .IsRowVersion();
            }
        }
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        // Collect domain events before save
        var domainEvents = ChangeTracker.Entries<IHasDomainEvents>()
            .SelectMany(e => e.Entity.DomainEvents)
            .ToList();

        // Clear events from entities (prevent double-dispatch)
        foreach (var entry in ChangeTracker.Entries<IHasDomainEvents>())
            entry.Entity.ClearDomainEvents();

        foreach (var entry in ChangeTracker.Entries())
        {
            // Auto-assign TenantId to new tenant entities
            if (entry.State == EntityState.Added && entry.Entity is ITenantEntity tenant && tenant.TenantId == 0)
            {
                tenant.TenantId = _currentTenantId;
            }

            // Auto-set UpdatedAt on modified entities
            if (entry.State == EntityState.Modified)
            {
                var updatedAtProp = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "UpdatedAt");
                if (updatedAtProp is not null)
                {
                    updatedAtProp.CurrentValue = now;
                }
            }
        }

        var result = await base.SaveChangesAsync(cancellationToken);

        // Dispatch domain events AFTER successful save
        if (domainEvents.Count > 0 && _eventDispatcher is not null)
        {
            await _eventDispatcher.DispatchAsync(domainEvents, cancellationToken);
        }

        return result;
    }

    private int ResolveTenantId()
    {
        var claim = _httpContextAccessor?.HttpContext?.User?.FindFirstValue("tenantId");
        return int.TryParse(claim, out var id) ? id : 0;
    }
}
