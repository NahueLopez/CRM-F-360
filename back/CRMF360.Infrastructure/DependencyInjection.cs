using CRMF360.Application.Abstractions;
using CRMF360.Application.Auth;
using CRMF360.Application.Empresas;
using CRMF360.Application.PersonasEmpresa;
using CRMF360.Application.Proyectos;
using CRMF360.Application.Roles;
using CRMF360.Application.Users;
using CRMF360.Infrastructure.Persistence;
using CRMF360.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using CRMF360.Application.TimeEntries;
using CRMF360.Application.Tareas;

namespace CRMF360.Infrastructure
{
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

            // Users
            services.AddScoped<IUserService, UserService>();
            // Roles
            services.AddScoped<IRoleService, RoleService>();
            // Auth
            services.AddScoped<IAuthService, AuthService>();
            //Empresas
            services.AddScoped<IEmpresaService, EmpresaService>();
            //PersonaEmpresa
            services.AddScoped<IPersonaEmpresaService, PersonaEmpresaService>();
            //Proyectos
            services.AddScoped<IProyectoService, ProyectoService>();
            // Horas x Proyecto
            services.AddScoped<ITimeEntryService, TimeEntryService>();
            //Tareas
            services.AddScoped<ITareaService, TareaService>();


            return services;
        }
    }
}
