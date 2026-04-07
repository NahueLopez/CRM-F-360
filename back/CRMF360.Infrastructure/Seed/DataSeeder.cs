using CRMF360.Domain.Entities;
using CRMF360.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CRMF360.Infrastructure.Seed;

public static class DataSeeder
{
    public static async System.Threading.Tasks.Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Self-healing: if tables already exist but __EFMigrationsHistory is missing/empty,
        // stamp it so MigrateAsync doesn't try to recreate existing tables.
        var conn = context.Database.GetDbConnection();
        await conn.OpenAsync();
        try
        {
            using var checkCmd = conn.CreateCommand();
            checkCmd.CommandText = @"
                SELECT EXISTS (
                    SELECT 1 FROM pg_catalog.pg_class c
                    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                    WHERE n.nspname = 'public' AND c.relname = 'Companies'
                )";
            var tablesExist = (bool)(await checkCmd.ExecuteScalarAsync())!;

            if (tablesExist)
            {
                // Ensure __EFMigrationsHistory table exists
                using var createHistCmd = conn.CreateCommand();
                createHistCmd.CommandText = @"
                    CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                        ""MigrationId"" character varying(150) NOT NULL,
                        ""ProductVersion"" character varying(32) NOT NULL,
                        CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
                    )";
                await createHistCmd.ExecuteNonQueryAsync();

                // Stamp the initial migration as already applied
                using var stampCmd = conn.CreateCommand();
                stampCmd.CommandText = @"
                    INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                    VALUES ('20260227195712_InitialCreate', '8.0.2')
                    ON CONFLICT DO NOTHING";
                await stampCmd.ExecuteNonQueryAsync();
            }
        }
        finally
        {
            await conn.CloseAsync();
        }

        await context.Database.MigrateAsync();

        // 1) Tenant Inicial (ya no existe concepto de "default")
        if (!await context.Set<Tenant>().AnyAsync())
        {
            context.Set<Tenant>().Add(new Tenant
            {
                Name = "Empresa Principal",
                Slug = "empresa-principal",
                Plan = "Pro",
                Active = true,
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }

        var tenant = await context.Set<Tenant>().FirstAsync();

        // 2) Roles
        if (!await context.Roles.IgnoreQueryFilters().AnyAsync())
        {
            context.Roles.AddRange(
                new Role { Name = "Admin" },
                new Role { Name = "Manager" },
                new Role { Name = "SalesRep" },
                new Role { Name = "Viewer" },
                new Role { Name = "User" }
            );
            await context.SaveChangesAsync();
        }

        // 3) Permissions
        var expectedPerms = new List<Permission>
        {
            // Companies
            new() { Name = "companies.view", Description = "Ver empresas", Module = "Companies" },
            new() { Name = "companies.create", Description = "Crear empresas", Module = "Companies" },
            new() { Name = "companies.edit", Description = "Editar empresas", Module = "Companies" },
            new() { Name = "companies.delete", Description = "Eliminar empresas", Module = "Companies" },
            // Contacts
            new() { Name = "contacts.view", Description = "Ver contactos", Module = "Contacts" },
            new() { Name = "contacts.create", Description = "Crear contactos", Module = "Contacts" },
            new() { Name = "contacts.edit", Description = "Editar contactos", Module = "Contacts" },
            new() { Name = "contacts.delete", Description = "Eliminar contactos", Module = "Contacts" },
            // Deals
            new() { Name = "deals.view", Description = "Ver oportunidades", Module = "Deals" },
            new() { Name = "deals.create", Description = "Crear oportunidades", Module = "Deals" },
            new() { Name = "deals.edit", Description = "Editar oportunidades", Module = "Deals" },
            new() { Name = "deals.delete", Description = "Eliminar oportunidades", Module = "Deals" },
            new() { Name = "deals.move", Description = "Mover en pipeline", Module = "Deals" },
            // Projects
            new() { Name = "projects.view", Description = "Ver proyectos", Module = "Projects" },
            new() { Name = "projects.create", Description = "Crear proyectos", Module = "Projects" },
            new() { Name = "projects.edit", Description = "Editar proyectos", Module = "Projects" },
            new() { Name = "projects.delete", Description = "Eliminar proyectos", Module = "Projects" },
            // Tasks
            new() { Name = "tasks.view", Description = "Ver tareas", Module = "Tasks" },
            new() { Name = "tasks.create", Description = "Crear tareas", Module = "Tasks" },
            new() { Name = "tasks.edit", Description = "Editar tareas", Module = "Tasks" },
            new() { Name = "tasks.delete", Description = "Eliminar tareas", Module = "Tasks" },
            // Calendar
            new() { Name = "calendar.view", Description = "Ver calendario", Module = "Calendar" },
            // Time Entries
            new() { Name = "timeentries.view", Description = "Ver carga de horas", Module = "TimeEntries" },
            new() { Name = "timeentries.create", Description = "Cargar horas", Module = "TimeEntries" },
            new() { Name = "timeentries.edit", Description = "Editar horas", Module = "TimeEntries" },
            new() { Name = "timeentries.delete", Description = "Eliminar horas", Module = "TimeEntries" },
            // Reminders
            new() { Name = "reminders.view", Description = "Ver recordatorios", Module = "Reminders" },
            new() { Name = "reminders.create", Description = "Crear recordatorios", Module = "Reminders" },
            new() { Name = "reminders.edit", Description = "Editar recordatorios", Module = "Reminders" },
            new() { Name = "reminders.delete", Description = "Eliminar recordatorios", Module = "Reminders" },
            // Audit
            new() { Name = "audit.view", Description = "Ver auditoría", Module = "Audit" },
            // Rooms
            new() { Name = "rooms.view", Description = "Ver salas", Module = "Rooms" },
            new() { Name = "rooms.create", Description = "Crear salas", Module = "Rooms" },
            new() { Name = "rooms.edit", Description = "Editar salas", Module = "Rooms" },
            new() { Name = "rooms.delete", Description = "Eliminar salas", Module = "Rooms" },
            // Roles/Permissions
            new() { Name = "roles.view", Description = "Ver roles", Module = "Roles" },
            new() { Name = "roles.manage", Description = "Administrar roles", Module = "Roles" },
            // Users
            new() { Name = "users.view", Description = "Ver usuarios", Module = "Users" },
            new() { Name = "users.create", Description = "Crear usuarios", Module = "Users" },
            new() { Name = "users.edit", Description = "Editar usuarios", Module = "Users" },
            new() { Name = "users.delete", Description = "Eliminar usuarios", Module = "Users" },
            // Reports
            new() { Name = "reports.view", Description = "Ver reportes", Module = "Reports" },
            new() { Name = "reports.export", Description = "Exportar reportes", Module = "Reports" },
        };

        var existingPerms = await context.Permissions.Select(p => p.Name).ToListAsync();
        var newPerms = expectedPerms.Where(p => !existingPerms.Contains(p.Name)).ToList();
        
        if (newPerms.Any())
        {
            context.Permissions.AddRange(newPerms);
            await context.SaveChangesAsync();
        }

        // 4) Assign permissions to roles
        var allPerms = await context.Permissions.ToListAsync();
        var roles = await context.Roles.IgnoreQueryFilters().ToListAsync();

        var admin = roles.First(r => r.Name == "Admin");
        var manager = roles.First(r => r.Name == "Manager");
        var salesRep = roles.First(r => r.Name == "SalesRep");
        var viewer = roles.First(r => r.Name == "Viewer");

        var existingRolePerms = await context.RolePermissions.ToListAsync();

        void AssignPerms(Role role, IEnumerable<string> permNames)
        {
            var rolePermIds = existingRolePerms.Where(rp => rp.RoleId == role.Id).Select(rp => rp.PermissionId).ToHashSet();
            foreach (var pName in permNames)
            {
                var p = allPerms.FirstOrDefault(x => x.Name == pName);
                if (p != null && !rolePermIds.Contains(p.Id))
                {
                    context.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = p.Id });
                    existingRolePerms.Add(new RolePermission { RoleId = role.Id, PermissionId = p.Id }); // locally cache it
                }
            }
        }

        // Admin: ALL permissions
        AssignPerms(admin, allPerms.Select(x => x.Name));

        // Manager: everything except users.create, users.delete, roles.manage
        var managerExclude = new HashSet<string> { "users.create", "users.delete", "roles.manage" };
        var managerPerms = allPerms.Where(x => !managerExclude.Contains(x.Name)).Select(x => x.Name);
        AssignPerms(manager, managerPerms);

        // SalesRep: view all + create/edit deals, contacts, companies, tasks, reminders, etc.
        var salesPerms = new HashSet<string>
        {
            "companies.view", "companies.create", "companies.edit",
            "contacts.view", "contacts.create", "contacts.edit",
            "deals.view", "deals.create", "deals.edit", "deals.move",
            "projects.view", "tasks.view", "tasks.create", "tasks.edit",
            "calendar.view", "reminders.view", "reminders.create", "reminders.edit",
            "timeentries.view", "timeentries.create", "timeentries.edit",
            "reports.view", "rooms.view"
        };
        AssignPerms(salesRep, salesPerms);

        // Viewer: view-only everywhere (except admin/roles stuff)
        var viewPerms = new HashSet<string>
        {
            "companies.view", "contacts.view", "deals.view",
            "projects.view", "tasks.view", "calendar.view", 
            "reminders.view", "timeentries.view", "reports.view", 
            "rooms.view"
        };
        AssignPerms(viewer, viewPerms);

        if (context.ChangeTracker.HasChanges())
        {
            await context.SaveChangesAsync();
        }

        // 5) Admin user
        var adminEmail = "admin@crm-f360.test";
        if (!await context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == adminEmail))
        {
            var adminUser = new User
            {
                FullName = "Super Admin",
                Email = adminEmail,
                Phone = null,
                Active = true,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(adminUser);
            await context.SaveChangesAsync();

            var adminRole = await context.Roles.IgnoreQueryFilters().FirstAsync(r => r.Name == "Admin");
            context.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id, TenantId = tenant.Id });
            await context.SaveChangesAsync();
        }
    }
}
