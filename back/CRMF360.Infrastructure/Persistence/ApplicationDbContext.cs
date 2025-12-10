using CRMF360.Application.Abstractions;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<UserRole> UserRoles => Set<UserRole>();
        public DbSet<Empresa> Empresas => Set<Empresa>();
        public DbSet<PersonaEmpresa> PersonaEmpresas => Set<PersonaEmpresa>(); 
        public DbSet<Proyecto> Proyectos => Set<Proyecto>();
        public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();
        public DbSet<Tarea> Tareas => Set<Tarea>();


        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
            => await base.SaveChangesAsync(cancellationToken);

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.HasKey(u => u.Id);

                entity.Property(u => u.FullName)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(u => u.Email)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.HasIndex(u => u.Email)
                    .IsUnique();
            });

            // Role
            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("Roles");
                entity.HasKey(r => r.Id);

                entity.Property(r => r.Name)
                    .HasMaxLength(100)
                    .IsRequired();
            });

            // UserRole
            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.ToTable("UserRoles");
                entity.HasKey(ur => new { ur.UserId, ur.RoleId });

                entity.HasOne(ur => ur.User)
                    .WithMany(u => u.UserRoles)
                    .HasForeignKey(ur => ur.UserId);

                entity.HasOne(ur => ur.Role)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(ur => ur.RoleId);
            });

            // Empresa
            modelBuilder.Entity<Empresa>(entity =>
            {
                entity.ToTable("Empresas");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.RazonSocial)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(e => e.NombreFantasia)
                    .HasMaxLength(200);

                entity.Property(e => e.Cuit)
                    .HasMaxLength(20)
                    .IsRequired();

                entity.HasIndex(e => e.Cuit)
                    .IsUnique();

                entity.Property(e => e.Email)
                    .HasMaxLength(200);

                entity.Property(e => e.Telefono)
                    .HasMaxLength(50);
            });

            // PersonaEmpresa (cliente/contacto de empresa)
            modelBuilder.Entity<PersonaEmpresa>(entity =>
            {
                entity.ToTable("PersonasEmpresa");
                entity.HasKey(p => p.Id);

                entity.Property(p => p.NombreCompleto)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(p => p.Email)
                    .HasMaxLength(200);

                entity.Property(p => p.Telefono)
                    .HasMaxLength(50);

                entity.Property(p => p.RolEnEmpresa)
                    .HasMaxLength(100);

                entity.HasOne(p => p.Empresa)
                    .WithMany(e => e.Personas)
                    .HasForeignKey(p => p.EmpresaId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Proyecto
            // Proyecto
            modelBuilder.Entity<Proyecto>(entity =>
            {
                entity.ToTable("Proyectos");
                entity.HasKey(p => p.Id);

                entity.Property(p => p.Nombre)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(p => p.Descripcion)
                    .HasMaxLength(1000);

                entity.Property(p => p.HorasEstimadasTotales)
                    .HasPrecision(10, 2);

                entity.Property(p => p.HorasEstimadasMensuales)
                    .HasPrecision(10, 2);

                // Enum -> int en base de datos
                entity.Property(p => p.Estado)
                    .HasConversion<int>();

                entity.HasOne(p => p.Empresa)
                    .WithMany(e => e.Proyectos)      // 👈 ahora sí usa la colección de Empresa
                    .HasForeignKey(p => p.EmpresaId)
                    .OnDelete(DeleteBehavior.Cascade);
            });


            // TimeEntry (horas por proyecto)
            modelBuilder.Entity<TimeEntry>(entity =>
            {
                entity.ToTable("TimeEntries");
                entity.HasKey(t => t.Id);

                entity.Property(t => t.Horas)
                    .HasPrecision(10, 2);

                entity.Property(t => t.Descripcion)
                    .HasMaxLength(1000);

                entity.HasOne(t => t.Proyecto)
                    .WithMany()
                    .HasForeignKey(t => t.ProyectoId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(t => t.Usuario)
                    .WithMany(u => u.TimeEntries)
                    .HasForeignKey(t => t.UsuarioId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.Tarea)               
                    .WithMany(tar => tar.TimeEntries)
                    .HasForeignKey(t => t.TareaId)
                    .OnDelete(DeleteBehavior.SetNull);
            });


            // Tarea
            modelBuilder.Entity<Tarea>(entity =>
            {
                entity.ToTable("Tareas");
                entity.HasKey(t => t.Id);

                entity.Property(t => t.Titulo)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(t => t.Descripcion)
                    .HasMaxLength(1000);

                entity.Property(t => t.Prioridad)
                    .HasConversion<int>();

                entity.Property(t => t.Estado)
                    .HasConversion<int>();

                entity.HasOne(t => t.Proyecto)
                    .WithMany(p => p.Tareas)
                    .HasForeignKey(t => t.ProyectoId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(t => t.AsignadoA)
                    .WithMany(u => u.TareasAsignadas)
                    .HasForeignKey(t => t.AsignadoAId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

        }
    }
}
