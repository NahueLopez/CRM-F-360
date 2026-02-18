using CRMF360.Application.Abstractions;
using CRMF360.Application.Auth;
using CRMF360.Application.BoardColumns;
using CRMF360.Application.Companies;
using CRMF360.Application.Projects;
using CRMF360.Application.Reports;
using CRMF360.Application.Roles;
using CRMF360.Application.Tasks;
using CRMF360.Application.TimeEntries;
using CRMF360.Application.Users;
using CRMF360.Infrastructure.Persistence;
using CRMF360.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CRMF360.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("pg")
            ?? throw new InvalidOperationException("Connection string 'pg' not found.");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IApplicationDbContext>(sp =>
            sp.GetRequiredService<ApplicationDbContext>());

        // Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IRoleService, RoleService>();
        services.AddScoped<ICompanyService, CompanyService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<IBoardColumnService, BoardColumnService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<ITimeEntryService, TimeEntryService>();
        services.AddScoped<IReportService, ReportService>();

        return services;
    }
}
