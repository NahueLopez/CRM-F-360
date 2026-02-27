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

        await context.Database.MigrateAsync();

        // 1) Default Tenant
        if (!await context.Set<Tenant>().AnyAsync())
        {
            context.Set<Tenant>().Add(new Tenant
            {
                Name = "Default",
                Slug = "default",
                Plan = "Pro",
                Active = true,
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }

        var tenant = await context.Set<Tenant>().FirstAsync(t => t.Slug == "default");

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
        if (!await context.Permissions.AnyAsync())
        {
            var perms = new List<Permission>
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
                // Users
                new() { Name = "users.view", Description = "Ver usuarios", Module = "Users" },
                new() { Name = "users.create", Description = "Crear usuarios", Module = "Users" },
                new() { Name = "users.edit", Description = "Editar usuarios", Module = "Users" },
                new() { Name = "users.delete", Description = "Eliminar usuarios", Module = "Users" },
                // Reports
                new() { Name = "reports.view", Description = "Ver reportes", Module = "Reports" },
                new() { Name = "reports.export", Description = "Exportar reportes", Module = "Reports" },
            };

            context.Permissions.AddRange(perms);
            await context.SaveChangesAsync();
        }

        // 4) Assign permissions to roles
        if (!await context.RolePermissions.AnyAsync())
        {
            var allPerms = await context.Permissions.ToListAsync();
            var roles = await context.Roles.IgnoreQueryFilters().ToListAsync();

            var admin = roles.First(r => r.Name == "Admin");
            var manager = roles.First(r => r.Name == "Manager");
            var salesRep = roles.First(r => r.Name == "SalesRep");
            var viewer = roles.First(r => r.Name == "Viewer");

            // Admin: ALL permissions (handled by handler bypass, but seed for completeness)
            foreach (var p in allPerms)
                context.RolePermissions.Add(new RolePermission { RoleId = admin.Id, PermissionId = p.Id });

            // Manager: everything except users.create, users.delete
            var managerExclude = new HashSet<string> { "users.create", "users.delete" };
            foreach (var p in allPerms.Where(x => !managerExclude.Contains(x.Name)))
                context.RolePermissions.Add(new RolePermission { RoleId = manager.Id, PermissionId = p.Id });

            // SalesRep: view all + create/edit deals, contacts, companies + move deals
            var salesPerms = new HashSet<string>
            {
                "companies.view", "companies.create", "companies.edit",
                "contacts.view", "contacts.create", "contacts.edit",
                "deals.view", "deals.create", "deals.edit", "deals.move",
                "projects.view",
                "reports.view",
            };
            foreach (var p in allPerms.Where(x => salesPerms.Contains(x.Name)))
                context.RolePermissions.Add(new RolePermission { RoleId = salesRep.Id, PermissionId = p.Id });

            // Viewer: view-only everywhere
            var viewPerms = new HashSet<string>
            {
                "companies.view", "contacts.view", "deals.view",
                "projects.view", "reports.view",
            };
            foreach (var p in allPerms.Where(x => viewPerms.Contains(x.Name)))
                context.RolePermissions.Add(new RolePermission { RoleId = viewer.Id, PermissionId = p.Id });

            await context.SaveChangesAsync();
        }

        // 5) Admin user
        var adminEmail = "admin@crm-f360.test";
        if (!await context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == adminEmail))
        {
            var adminUser = new User
            {
                TenantId = tenant.Id,
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
            context.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id });
            await context.SaveChangesAsync();
        }
    }
}
