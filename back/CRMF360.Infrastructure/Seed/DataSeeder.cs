using CRMF360.Domain.Entities;
using CRMF360.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using BCryptNet = BCrypt.Net.BCrypt;  

namespace CRMF360.Infrastructure.Seed;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await context.Database.MigrateAsync();

        if (!await context.Roles.AnyAsync())
        {
            var adminRole = new Role { Name = "Admin" };
            var userRole = new Role { Name = "User" };

            context.Roles.AddRange(adminRole, userRole);
            await context.SaveChangesAsync();
        }

        var adminEmail = "admin@crm-f360.test";

        if (!await context.Users.AnyAsync(u => u.Email == adminEmail))
        {
            var adminUser = new User
            {
                FullName = "Super Admin",
                Email = adminEmail,
                Phone = null,
                Active = true,

                PasswordHash = BCryptNet.HashPassword("Admin123!"),
                CreatedAt = DateTime.UtcNow
            };

            context.Users.Add(adminUser);
            await context.SaveChangesAsync();

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
