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

        // 🧱 Crea la DB y schema si no existe (directo desde el modelo, sin migraciones)
        await context.Database.EnsureCreatedAsync();

        // 1) Roles base
        if (!await context.Roles.AnyAsync())
        {
            var adminRole = new Role { Name = "Admin" };
            var managerRole = new Role { Name = "Manager" };
            var userRole = new Role { Name = "User" };

            context.Roles.AddRange(adminRole, managerRole, userRole);
            await context.SaveChangesAsync();
        }

        // 2) Usuario admin
        var adminEmail = "admin@crm-f360.test";

        if (!await context.Users.AnyAsync(u => u.Email == adminEmail))
        {
            var adminUser = new User
            {
                FullName = "Super Admin",
                Email = adminEmail,
                Phone = null,
                Active = true,
                // Hash real con BCrypt
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                CreatedAt = DateTime.UtcNow
            };

            context.Users.Add(adminUser);
            await context.SaveChangesAsync();

            // 3) Vincularlo al rol Admin
            var adminRole = await context.Roles.FirstAsync(r => r.Name == "Admin");

            var userRole = new UserRole
            {
                UserId = adminUser.Id,
                RoleId = adminRole.Id
            };

            context.UserRoles.Add(userRole);
            await context.SaveChangesAsync();
        }
    }
}
