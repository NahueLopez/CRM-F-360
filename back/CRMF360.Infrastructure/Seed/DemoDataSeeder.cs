using CRMF360.Domain.Entities;
using CRMF360.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using TaskEntity = CRMF360.Domain.Entities.Task;

namespace CRMF360.Infrastructure.Seed;

public static class DemoDataSeeder
{
    public static async System.Threading.Tasks.Task SeedAsync(ApplicationDbContext context, int tenantId)
    {
        // Skip if demo data already exists
        if (await context.Companies.IgnoreQueryFilters().AnyAsync(c => c.TenantId == tenantId))
            return;

        var now = DateTime.UtcNow;

        // ──────────────────────────────────────
        // 1) USERS (4 additional team members)
        // ──────────────────────────────────────
        var adminUser = await context.Users.IgnoreQueryFilters()
            .FirstAsync(u => u.Email == "admin@crm-f360.test");

        var users = new List<User>
        {
            new() { TenantId = tenantId, FullName = "María García", Email = "maria.garcia@crm-f360.test", Active = true, PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo123!"), CreatedAt = now.AddDays(-30) },
            new() { TenantId = tenantId, FullName = "Carlos López", Email = "carlos.lopez@crm-f360.test", Active = true, PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo123!"), CreatedAt = now.AddDays(-28) },
            new() { TenantId = tenantId, FullName = "Ana Rodríguez", Email = "ana.rodriguez@crm-f360.test", Active = true, PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo123!"), CreatedAt = now.AddDays(-25) },
            new() { TenantId = tenantId, FullName = "Lucas Fernández", Email = "lucas.fernandez@crm-f360.test", Active = true, PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo123!"), CreatedAt = now.AddDays(-20) },
        };
        context.Users.AddRange(users);
        await context.SaveChangesAsync();

        // Assign roles
        var roles = await context.Roles.IgnoreQueryFilters().ToListAsync();
        var managerRole = roles.First(r => r.Name == "Manager");
        var salesRepRole = roles.First(r => r.Name == "SalesRep");
        var userRole = roles.First(r => r.Name == "User");

        context.UserRoles.AddRange(
            new UserRole { UserId = users[0].Id, RoleId = managerRole.Id },   // María = Manager
            new UserRole { UserId = users[1].Id, RoleId = salesRepRole.Id },   // Carlos = SalesRep
            new UserRole { UserId = users[2].Id, RoleId = salesRepRole.Id },   // Ana = SalesRep
            new UserRole { UserId = users[3].Id, RoleId = userRole.Id }        // Lucas = User
        );
        await context.SaveChangesAsync();

        // ──────────────────────────────────────
        // 2) COMPANIES (8)
        // ──────────────────────────────────────
        var companies = new List<Company>
        {
            new() { TenantId = tenantId, Name = "TechnoSur S.A.", Cuit = "30-71234567-8", Email = "contacto@technosur.com.ar", Phone = "+54 11 4555-1200", Industry = "Tecnología", Website = "https://technosur.com.ar", Notes = "Empresa de desarrollo de software, cliente desde 2024.", Active = true, CreatedAt = now.AddDays(-60) },
            new() { TenantId = tenantId, Name = "Constructora Patagonia", Cuit = "30-70987654-3", Email = "info@construpatagonia.com.ar", Phone = "+54 294 442-3300", Industry = "Construcción", Website = "https://construpatagonia.com.ar", Notes = "Constructora líder en la Patagonia, varios proyectos activos.", Active = true, CreatedAt = now.AddDays(-55) },
            new() { TenantId = tenantId, Name = "Agrícola del Litoral", Cuit = "30-71122334-5", Email = "ventas@agrodellitoral.com.ar", Phone = "+54 342 456-7890", Industry = "Agro", Notes = "Productora de granos y oleaginosas.", Active = true, CreatedAt = now.AddDays(-50) },
            new() { TenantId = tenantId, Name = "MedSalud Centro", Cuit = "30-70445566-1", Email = "admin@medsalud.com.ar", Phone = "+54 351 421-5500", Industry = "Salud", Website = "https://medsalud.com.ar", Active = true, CreatedAt = now.AddDays(-45) },
            new() { TenantId = tenantId, Name = "Logística Express BA", Cuit = "30-71667788-9", Email = "operaciones@logisticaexpress.com.ar", Phone = "+54 11 4777-8800", Industry = "Logística", Website = "https://logisticaexpress.com.ar", Notes = "Transporte y distribución en AMBA.", Active = true, CreatedAt = now.AddDays(-40) },
            new() { TenantId = tenantId, Name = "Estudio Jurídico Mendoza & Asoc.", Cuit = "30-70112233-7", Email = "contacto@estudiomendoza.com.ar", Phone = "+54 261 425-3200", Industry = "Legal", Active = true, CreatedAt = now.AddDays(-35) },
            new() { TenantId = tenantId, Name = "FinanzasOK Consulting", Cuit = "30-71998877-2", Email = "hola@finanzasok.com.ar", Phone = "+54 11 5263-9100", Industry = "Finanzas", Website = "https://finanzasok.com.ar", Notes = "Consultoría financiera para PyMEs.", Active = true, CreatedAt = now.AddDays(-30) },
            new() { TenantId = tenantId, Name = "EduTech Argentina", Cuit = "30-71554433-6", Email = "info@edutecharg.com.ar", Phone = "+54 11 4888-2200", Industry = "Educación", Website = "https://edutecharg.com.ar", Active = true, CreatedAt = now.AddDays(-25) },
        };
        context.Companies.AddRange(companies);
        await context.SaveChangesAsync();

        // ──────────────────────────────────────
        // 3) CONTACTS (2-3 per company)
        // ──────────────────────────────────────
        var contacts = new List<Contact>
        {
            // TechnoSur
            new() { CompanyId = companies[0].Id, FullName = "Martín Suárez", Email = "m.suarez@technosur.com.ar", Phone = "+54 11 4555-1201", Position = "CTO", Active = true, CreatedAt = now.AddDays(-58) },
            new() { CompanyId = companies[0].Id, FullName = "Laura Peralta", Email = "l.peralta@technosur.com.ar", Phone = "+54 11 4555-1202", Position = "Project Manager", Active = true, CreatedAt = now.AddDays(-55) },
            new() { CompanyId = companies[0].Id, FullName = "Diego Romero", Email = "d.romero@technosur.com.ar", Position = "CEO", Active = true, CreatedAt = now.AddDays(-58) },
            // Constructora Patagonia
            new() { CompanyId = companies[1].Id, FullName = "Roberto Álvarez", Email = "r.alvarez@construpatagonia.com.ar", Phone = "+54 294 442-3301", Position = "Director de Obras", Active = true, CreatedAt = now.AddDays(-52) },
            new() { CompanyId = companies[1].Id, FullName = "Silvia Moreno", Email = "s.moreno@construpatagonia.com.ar", Position = "Gerente Comercial", Active = true, CreatedAt = now.AddDays(-50) },
            // Agrícola del Litoral
            new() { CompanyId = companies[2].Id, FullName = "Fernando Torres", Email = "f.torres@agrodellitoral.com.ar", Phone = "+54 342 456-7891", Position = "Gerente General", Active = true, CreatedAt = now.AddDays(-48) },
            new() { CompanyId = companies[2].Id, FullName = "Luciana Vega", Email = "l.vega@agrodellitoral.com.ar", Position = "Jefa de Compras", Active = true, CreatedAt = now.AddDays(-46) },
            // MedSalud
            new() { CompanyId = companies[3].Id, FullName = "Dr. Andrés Molina", Email = "a.molina@medsalud.com.ar", Phone = "+54 351 421-5501", Position = "Director Médico", Active = true, CreatedAt = now.AddDays(-43) },
            new() { CompanyId = companies[3].Id, FullName = "Valentina Ruiz", Email = "v.ruiz@medsalud.com.ar", Position = "Administración", Active = true, CreatedAt = now.AddDays(-42) },
            // Logística Express
            new() { CompanyId = companies[4].Id, FullName = "Pablo Gutiérrez", Email = "p.gutierrez@logisticaexpress.com.ar", Phone = "+54 11 4777-8801", Position = "Gerente de Operaciones", Active = true, CreatedAt = now.AddDays(-38) },
            new() { CompanyId = companies[4].Id, FullName = "Camila Sosa", Email = "c.sosa@logisticaexpress.com.ar", Position = "Coordinadora de Flota", Active = true, CreatedAt = now.AddDays(-36) },
            // Estudio Mendoza
            new() { CompanyId = companies[5].Id, FullName = "Dr. Ricardo Mendoza", Email = "r.mendoza@estudiomendoza.com.ar", Phone = "+54 261 425-3201", Position = "Socio Fundador", Active = true, CreatedAt = now.AddDays(-33) },
            // FinanzasOK
            new() { CompanyId = companies[6].Id, FullName = "Gabriela Herrera", Email = "g.herrera@finanzasok.com.ar", Phone = "+54 11 5263-9101", Position = "Directora", Active = true, CreatedAt = now.AddDays(-28) },
            new() { CompanyId = companies[6].Id, FullName = "Tomás Acosta", Email = "t.acosta@finanzasok.com.ar", Position = "Analista Senior", Active = true, CreatedAt = now.AddDays(-27) },
            // EduTech
            new() { CompanyId = companies[7].Id, FullName = "Florencia Díaz", Email = "f.diaz@edutecharg.com.ar", Phone = "+54 11 4888-2201", Position = "CEO", Active = true, CreatedAt = now.AddDays(-23) },
            new() { CompanyId = companies[7].Id, FullName = "Nicolás Castro", Email = "n.castro@edutecharg.com.ar", Position = "CTO", Active = true, CreatedAt = now.AddDays(-22) },
        };
        context.Contacts.AddRange(contacts);
        await context.SaveChangesAsync();

        // ──────────────────────────────────────
        // 4) DEALS (10 across different stages)
        // ──────────────────────────────────────
        var deals = new List<Deal>
        {
            new() { TenantId = tenantId, Title = "Migración a la nube - TechnoSur", CompanyId = companies[0].Id, ContactId = contacts[0].Id, AssignedToId = users[1].Id, Stage = DealStage.Negotiation, Value = 2500000m, Currency = "ARS", Notes = "Migración de infraestructura on-premise a AWS.", ExpectedCloseDate = now.AddDays(15), SortOrder = 0, CreatedAt = now.AddDays(-20) },
            new() { TenantId = tenantId, Title = "Sistema de gestión de obras", CompanyId = companies[1].Id, ContactId = contacts[3].Id, AssignedToId = users[2].Id, Stage = DealStage.Proposal, Value = 4800000m, Currency = "ARS", Notes = "Software personalizado para seguimiento de obras.", ExpectedCloseDate = now.AddDays(30), SortOrder = 0, CreatedAt = now.AddDays(-18) },
            new() { TenantId = tenantId, Title = "App de trazabilidad agrícola", CompanyId = companies[2].Id, ContactId = contacts[5].Id, AssignedToId = users[1].Id, Stage = DealStage.Lead, Value = 1800000m, Currency = "ARS", ExpectedCloseDate = now.AddDays(60), SortOrder = 0, CreatedAt = now.AddDays(-15) },
            new() { TenantId = tenantId, Title = "Portal de turnos online", CompanyId = companies[3].Id, ContactId = contacts[7].Id, AssignedToId = adminUser.Id, Stage = DealStage.Contacted, Value = 950000m, Currency = "ARS", Notes = "Sistema de turnos para pacientes con integración a WhatsApp.", ExpectedCloseDate = now.AddDays(45), SortOrder = 0, CreatedAt = now.AddDays(-12) },
            new() { TenantId = tenantId, Title = "Optimización de rutas", CompanyId = companies[4].Id, ContactId = contacts[9].Id, AssignedToId = users[2].Id, Stage = DealStage.Proposal, Value = 3200000m, Currency = "ARS", Notes = "Algoritmo de optimización de rutas de distribución.", ExpectedCloseDate = now.AddDays(25), SortOrder = 1, CreatedAt = now.AddDays(-10) },
            new() { TenantId = tenantId, Title = "Digitalización de expedientes", CompanyId = companies[5].Id, ContactId = contacts[11].Id, AssignedToId = users[1].Id, Stage = DealStage.Negotiation, Value = 1500000m, Currency = "ARS", ExpectedCloseDate = now.AddDays(20), SortOrder = 1, CreatedAt = now.AddDays(-8) },
            new() { TenantId = tenantId, Title = "Dashboard financiero PyMEs", CompanyId = companies[6].Id, ContactId = contacts[12].Id, AssignedToId = adminUser.Id, Stage = DealStage.ClosedWon, Value = 1200000m, Currency = "ARS", Notes = "Tablero con KPIs financieros. ¡Cerrado!", ExpectedCloseDate = now.AddDays(-5), SortOrder = 0, CreatedAt = now.AddDays(-30) },
            new() { TenantId = tenantId, Title = "Plataforma e-learning", CompanyId = companies[7].Id, ContactId = contacts[14].Id, AssignedToId = users[2].Id, Stage = DealStage.Contacted, Value = 5500000m, Currency = "ARS", Notes = "Plataforma de cursos online con gamificación.", ExpectedCloseDate = now.AddDays(90), SortOrder = 0, CreatedAt = now.AddDays(-5) },
            new() { TenantId = tenantId, Title = "Mantenimiento anual TechnoSur", CompanyId = companies[0].Id, ContactId = contacts[2].Id, AssignedToId = users[1].Id, Stage = DealStage.ClosedWon, Value = 600000m, Currency = "ARS", Notes = "Contrato de soporte y mantenimiento anual.", ExpectedCloseDate = now.AddDays(-15), SortOrder = 1, CreatedAt = now.AddDays(-40) },
            new() { TenantId = tenantId, Title = "Integración ERP logístico", CompanyId = companies[4].Id, ContactId = contacts[10].Id, AssignedToId = users[1].Id, Stage = DealStage.ClosedLost, Value = 2000000m, Currency = "ARS", Notes = "Decidieron ir con otro proveedor.", ExpectedCloseDate = now.AddDays(-10), SortOrder = 0, CreatedAt = now.AddDays(-35) },
        };
        context.Deals.AddRange(deals);
        await context.SaveChangesAsync();

        // ──────────────────────────────────────
        // 5) LEADS (6)
        // ──────────────────────────────────────
        var leads = new List<Lead>
        {
            new() { TenantId = tenantId, FullName = "Santiago Pérez", Email = "sperez@gmail.com", Phone = "+54 11 6234-5678", Company = "AutoParts Córdoba", Position = "Dueño", Source = LeadSource.Website, Status = LeadStatus.New, EstimatedValue = 800000m, Notes = "Interesado en sistema de stock.", AssignedToId = users[1].Id, CreatedAt = now.AddDays(-3) },
            new() { TenantId = tenantId, FullName = "Julieta Ramos", Email = "jramos@outlook.com", Phone = "+54 261 555-4321", Company = "Vinos del Sol", Position = "Gerente Comercial", Source = LeadSource.Referral, Status = LeadStatus.Contacted, EstimatedValue = 1500000m, Notes = "Referida por FinanzasOK. Busca CRM.", AssignedToId = users[2].Id, CreatedAt = now.AddDays(-5) },
            new() { TenantId = tenantId, FullName = "Maximiliano Ortiz", Email = "mortiz@empresa.com", Company = "Textil del Norte", Source = LeadSource.Event, Status = LeadStatus.Qualified, EstimatedValue = 2200000m, Notes = "Conocido en Expo Software 2026. Muy interesado.", AssignedToId = users[1].Id, CreatedAt = now.AddDays(-10) },
            new() { TenantId = tenantId, FullName = "Celeste Aguirre", Email = "caguirre@hotmail.com", Phone = "+54 343 444-5566", Company = "Farmacia San Martín", Source = LeadSource.SocialMedia, Status = LeadStatus.New, EstimatedValue = 350000m, AssignedToId = users[2].Id, CreatedAt = now.AddDays(-1) },
            new() { TenantId = tenantId, FullName = "Hernán Bustos", Email = "hbustos@gmail.com", Company = "Deportes Total", Source = LeadSource.ColdCall, Status = LeadStatus.Unqualified, Notes = "No tiene presupuesto por ahora.", AssignedToId = users[1].Id, CreatedAt = now.AddDays(-15) },
            new() { TenantId = tenantId, FullName = "Romina Silva", Email = "rsilva@inmobiliariasur.com.ar", Phone = "+54 11 5099-8877", Company = "Inmobiliaria Sur", Position = "Directora", Source = LeadSource.Partner, Status = LeadStatus.Contacted, EstimatedValue = 3000000m, Notes = "Necesita sistema de gestión de propiedades.", AssignedToId = adminUser.Id, CreatedAt = now.AddDays(-7) },
        };
        context.Leads.AddRange(leads);
        await context.SaveChangesAsync();

        // ──────────────────────────────────────
        // 6) PROJECTS (3 with boards and tasks)
        // ──────────────────────────────────────
        var project1 = new Project
        {
            CompanyId = companies[6].Id, Name = "Dashboard Financiero", Description = "Desarrollo del tablero de KPIs financieros para FinanzasOK.",
            Status = ProjectStatus.InProgress, StartDate = now.AddDays(-25), EndDateEstimated = now.AddDays(35), EstimatedHours = 200m, CreatedAt = now.AddDays(-25)
        };
        var project2 = new Project
        {
            CompanyId = companies[0].Id, Name = "Migración Cloud AWS", Description = "Migrar la infraestructura de TechnoSur a servicios cloud de AWS.",
            Status = ProjectStatus.Planned, StartDate = now.AddDays(5), EndDateEstimated = now.AddDays(90), EstimatedHours = 500m, CreatedAt = now.AddDays(-10)
        };
        var project3 = new Project
        {
            CompanyId = companies[7].Id, Name = "Plataforma E-Learning v1", Description = "MVP de la plataforma de cursos online con gamificación para EduTech.",
            Status = ProjectStatus.InProgress, StartDate = now.AddDays(-15), EndDateEstimated = now.AddDays(60), EstimatedHours = 350m, CreatedAt = now.AddDays(-15)
        };
        context.Projects.AddRange(project1, project2, project3);
        await context.SaveChangesAsync();

        // Board columns (standard Kanban)
        var colSets = new List<(Project proj, List<BoardColumn> cols)>();
        foreach (var proj in new[] { project1, project2, project3 })
        {
            var cols = new List<BoardColumn>
            {
                new() { ProjectId = proj.Id, Name = "Por hacer", SortOrder = 0 },
                new() { ProjectId = proj.Id, Name = "En progreso", SortOrder = 1 },
                new() { ProjectId = proj.Id, Name = "En revisión", SortOrder = 2 },
                new() { ProjectId = proj.Id, Name = "Terminado", SortOrder = 3 },
            };
            context.BoardColumns.AddRange(cols);
            colSets.Add((proj, cols));
        }
        await context.SaveChangesAsync();

        // Project members
        context.ProjectMembers.AddRange(
            new ProjectMember { ProjectId = project1.Id, UserId = adminUser.Id, Role = "Owner", CanManageTasks = true, CanManageMembers = true, CanManageBoard = true, CanEditProject = true },
            new ProjectMember { ProjectId = project1.Id, UserId = users[0].Id, Role = "Lead", CanManageTasks = true, CanManageMembers = true, CanManageBoard = true, CanEditProject = true },
            new ProjectMember { ProjectId = project1.Id, UserId = users[3].Id, Role = "Member", CanManageTasks = true },
            new ProjectMember { ProjectId = project2.Id, UserId = users[0].Id, Role = "Owner", CanManageTasks = true, CanManageMembers = true, CanManageBoard = true, CanEditProject = true },
            new ProjectMember { ProjectId = project2.Id, UserId = users[1].Id, Role = "Member", CanManageTasks = true },
            new ProjectMember { ProjectId = project3.Id, UserId = adminUser.Id, Role = "Owner", CanManageTasks = true, CanManageMembers = true, CanManageBoard = true, CanEditProject = true },
            new ProjectMember { ProjectId = project3.Id, UserId = users[2].Id, Role = "Lead", CanManageTasks = true, CanManageMembers = true, CanManageBoard = true, CanEditProject = true },
            new ProjectMember { ProjectId = project3.Id, UserId = users[3].Id, Role = "Member", CanManageTasks = true }
        );
        await context.SaveChangesAsync();

        // Tasks for project 1 (Dashboard Financiero)
        var p1Cols = colSets[0].cols;
        context.Tasks.AddRange(
            new TaskEntity { ProjectId = project1.Id, ColumnId = p1Cols[3].Id, AssigneeId = users[3].Id, Title = "Diseñar wireframes del dashboard", Priority = TaskPriority.High, SortOrder = 0, DueDate = now.AddDays(-15), CreatedAt = now.AddDays(-24) },
            new TaskEntity { ProjectId = project1.Id, ColumnId = p1Cols[3].Id, AssigneeId = users[0].Id, Title = "Definir KPIs con el cliente", Priority = TaskPriority.High, SortOrder = 1, DueDate = now.AddDays(-18), CreatedAt = now.AddDays(-24) },
            new TaskEntity { ProjectId = project1.Id, ColumnId = p1Cols[2].Id, AssigneeId = users[3].Id, Title = "Implementar gráficos de ingresos/egresos", Priority = TaskPriority.High, SortOrder = 0, DueDate = now.AddDays(5), CreatedAt = now.AddDays(-15) },
            new TaskEntity { ProjectId = project1.Id, ColumnId = p1Cols[1].Id, AssigneeId = users[0].Id, Title = "Conectar API con datos bancarios", Priority = TaskPriority.Medium, SortOrder = 0, DueDate = now.AddDays(10), CreatedAt = now.AddDays(-10) },
            new TaskEntity { ProjectId = project1.Id, ColumnId = p1Cols[1].Id, AssigneeId = users[3].Id, Title = "Exportación a PDF/Excel", Priority = TaskPriority.Medium, SortOrder = 1, DueDate = now.AddDays(15), CreatedAt = now.AddDays(-8) },
            new TaskEntity { ProjectId = project1.Id, ColumnId = p1Cols[0].Id, AssigneeId = null, Title = "Tests de integración", Priority = TaskPriority.Medium, SortOrder = 0, DueDate = now.AddDays(25), CreatedAt = now.AddDays(-5) },
            new TaskEntity { ProjectId = project1.Id, ColumnId = p1Cols[0].Id, AssigneeId = null, Title = "Documentación de usuario", Priority = TaskPriority.Low, SortOrder = 1, DueDate = now.AddDays(30), CreatedAt = now.AddDays(-3) }
        );

        // Tasks for project 2 (Migración Cloud)
        var p2Cols = colSets[1].cols;
        context.Tasks.AddRange(
            new TaskEntity { ProjectId = project2.Id, ColumnId = p2Cols[0].Id, AssigneeId = users[1].Id, Title = "Auditoría de infraestructura actual", Priority = TaskPriority.Urgent, SortOrder = 0, DueDate = now.AddDays(10), CreatedAt = now.AddDays(-8) },
            new TaskEntity { ProjectId = project2.Id, ColumnId = p2Cols[0].Id, AssigneeId = users[0].Id, Title = "Diseñar arquitectura cloud", Priority = TaskPriority.High, SortOrder = 1, DueDate = now.AddDays(15), CreatedAt = now.AddDays(-8) },
            new TaskEntity { ProjectId = project2.Id, ColumnId = p2Cols[0].Id, AssigneeId = null, Title = "Configurar VPC y subnets", Priority = TaskPriority.High, SortOrder = 2, DueDate = now.AddDays(25), CreatedAt = now.AddDays(-5) },
            new TaskEntity { ProjectId = project2.Id, ColumnId = p2Cols[0].Id, AssigneeId = null, Title = "Migrar base de datos a RDS", Priority = TaskPriority.High, SortOrder = 3, DueDate = now.AddDays(40), CreatedAt = now.AddDays(-5) },
            new TaskEntity { ProjectId = project2.Id, ColumnId = p2Cols[0].Id, AssigneeId = null, Title = "Configurar CI/CD pipeline", Priority = TaskPriority.Medium, SortOrder = 4, DueDate = now.AddDays(50), CreatedAt = now.AddDays(-3) }
        );

        // Tasks for project 3 (E-Learning)
        var p3Cols = colSets[2].cols;
        context.Tasks.AddRange(
            new TaskEntity { ProjectId = project3.Id, ColumnId = p3Cols[3].Id, AssigneeId = users[2].Id, Title = "Definir estructura de cursos", Priority = TaskPriority.High, SortOrder = 0, DueDate = now.AddDays(-5), CreatedAt = now.AddDays(-14) },
            new TaskEntity { ProjectId = project3.Id, ColumnId = p3Cols[2].Id, AssigneeId = users[3].Id, Title = "Módulo de autenticación y registro", Priority = TaskPriority.High, SortOrder = 0, DueDate = now.AddDays(3), CreatedAt = now.AddDays(-12) },
            new TaskEntity { ProjectId = project3.Id, ColumnId = p3Cols[1].Id, AssigneeId = users[2].Id, Title = "Reproductor de video con progreso", Priority = TaskPriority.High, SortOrder = 0, DueDate = now.AddDays(10), CreatedAt = now.AddDays(-10) },
            new TaskEntity { ProjectId = project3.Id, ColumnId = p3Cols[1].Id, AssigneeId = users[3].Id, Title = "Sistema de quizzes", Priority = TaskPriority.Medium, SortOrder = 1, DueDate = now.AddDays(20), CreatedAt = now.AddDays(-7) },
            new TaskEntity { ProjectId = project3.Id, ColumnId = p3Cols[0].Id, AssigneeId = null, Title = "Gamificación: puntos y badges", Priority = TaskPriority.Medium, SortOrder = 0, DueDate = now.AddDays(35), CreatedAt = now.AddDays(-5) },
            new TaskEntity { ProjectId = project3.Id, ColumnId = p3Cols[0].Id, AssigneeId = null, Title = "Panel de administración de cursos", Priority = TaskPriority.Medium, SortOrder = 1, DueDate = now.AddDays(40), CreatedAt = now.AddDays(-3) },
            new TaskEntity { ProjectId = project3.Id, ColumnId = p3Cols[0].Id, AssigneeId = null, Title = "Certificados automáticos", Priority = TaskPriority.Low, SortOrder = 2, DueDate = now.AddDays(50), CreatedAt = now.AddDays(-2) }
        );
        await context.SaveChangesAsync();

        // ──────────────────────────────────────
        // 7) ROOMS (3)
        // ──────────────────────────────────────
        var rooms = new List<Room>
        {
            new() { TenantId = tenantId, Name = "Sala Maradona", Location = "Piso 2 - Ala Norte", Capacity = 10, Amenities = "[\"Proyector\",\"Pizarra\",\"TV 65\\\"\",\"Videoconferencia\"]", Description = "Sala principal de reuniones.", Color = "#818cf8", IsActive = true, CreatedAt = now.AddDays(-30) },
            new() { TenantId = tenantId, Name = "Sala Messi", Location = "Piso 2 - Ala Sur", Capacity = 6, Amenities = "[\"TV 50\\\"\",\"Pizarra\"]", Description = "Sala mediana para reuniones de equipo.", Color = "#34d399", IsActive = true, CreatedAt = now.AddDays(-30) },
            new() { TenantId = tenantId, Name = "Phone Booth 1", Location = "Piso 1 - Hall", Capacity = 1, Amenities = "[\"Monitor\"]", Description = "Cabina individual para llamadas.", Color = "#fb923c", IsActive = true, CreatedAt = now.AddDays(-30) },
        };
        context.Rooms.AddRange(rooms);
        await context.SaveChangesAsync();

        // Room reservations (upcoming)
        context.RoomReservations.AddRange(
            new RoomReservation { TenantId = tenantId, RoomId = rooms[0].Id, UserId = adminUser.Id, Title = "Sprint Planning", StartTime = now.Date.AddDays(1).AddHours(9), EndTime = now.Date.AddDays(1).AddHours(11), Notes = "Sprint 14 planning con todo el equipo.", CreatedAt = now },
            new RoomReservation { TenantId = tenantId, RoomId = rooms[1].Id, UserId = users[0].Id, Title = "1:1 con Carlos", StartTime = now.Date.AddDays(1).AddHours(14), EndTime = now.Date.AddDays(1).AddHours(15), CreatedAt = now },
            new RoomReservation { TenantId = tenantId, RoomId = rooms[0].Id, UserId = users[2].Id, Title = "Demo EduTech", StartTime = now.Date.AddDays(2).AddHours(10), EndTime = now.Date.AddDays(2).AddHours(11).AddMinutes(30), Notes = "Demo del MVP al equipo de EduTech.", CreatedAt = now },
            new RoomReservation { TenantId = tenantId, RoomId = rooms[2].Id, UserId = users[1].Id, Title = "Call con proveedor AWS", StartTime = now.Date.AddDays(1).AddHours(16), EndTime = now.Date.AddDays(1).AddHours(17), CreatedAt = now }
        );
        await context.SaveChangesAsync();

        // ──────────────────────────────────────
        // 8) REMINDERS (4)
        // ──────────────────────────────────────
        context.Reminders.AddRange(
            new Reminder { TenantId = tenantId, UserId = adminUser.Id, CompanyId = companies[1].Id, Title = "Seguimiento propuesta Constructora Patagonia", Description = "Llamar a Roberto para ver si revisó la propuesta.", DueDate = now.AddDays(2), CreatedAt = now.AddDays(-1) },
            new Reminder { TenantId = tenantId, UserId = users[1].Id, DealId = deals[0].Id, Title = "Enviar contrato migración TechnoSur", Description = "El contrato ya fue revisado por legales.", DueDate = now.AddDays(3), CreatedAt = now },
            new Reminder { TenantId = tenantId, UserId = users[2].Id, ContactId = contacts[14].Id, Title = "Coordinar kick-off EduTech", Description = "Agendar reunión de inicio con Florencia Díaz.", DueDate = now.AddDays(5), CreatedAt = now },
            new Reminder { TenantId = tenantId, UserId = adminUser.Id, Title = "Revisar métricas del trimestre", Description = "Preparar reporte para la reunión directiva.", DueDate = now.AddDays(7), CreatedAt = now.AddDays(-2) }
        );
        await context.SaveChangesAsync();
    }
}
