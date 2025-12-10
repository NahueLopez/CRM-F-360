using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Application.Abstractions
{
    public interface IApplicationDbContext
    {
        DbSet<User> Users { get; }
        DbSet<Role> Roles { get; }
        DbSet<UserRole> UserRoles { get; }
        DbSet<Empresa> Empresas { get; }
        DbSet<PersonaEmpresa> PersonaEmpresas { get; } 
        DbSet<Proyecto> Proyectos { get; }
        DbSet<TimeEntry> TimeEntries { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
