using CRMF360.Api.Middleware;
using CRMF360.Api.Filters;
using CRMF360.Infrastructure;
using CRMF360.Infrastructure.Seed;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Threading.RateLimiting;

// Npgsql 8+ requiere DateTimeKind.Utc; esto permite Unspecified también
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Infrastructure (DB + Services)
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationFilter>();
});
builder.Services.AddSignalR();

// FluentValidation — auto-register all validators from Application assembly
builder.Services.AddValidatorsFromAssemblyContaining<CRMF360.Application.Validation.CreateCompanyValidator>();

// CORS — restricted to configured origins
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? (builder.Environment.IsDevelopment()
        ? new[] { "http://localhost:5173", "http://localhost:3000", "https://front-crm.fundacion360.online" }
        : Array.Empty<string>());

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// JWT — fail hard if key missing in Production
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    if (builder.Environment.IsProduction())
        throw new InvalidOperationException("Jwt:Key MUST be configured in production. Set it in appsettings.Production.json or environment variables.");
    jwtKey = "clave-super-secreta-dev-min-32-chars!!";
}
var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "CRMF360",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "CRMF360-BackOffice",
            ClockSkew = TimeSpan.Zero,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
        };

        // Allow JWT via query string for SignalR WebSocket
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(accessToken) &&
                    context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));

    options.AddPolicy("ManagerOrAdmin", policy =>
        policy.RequireRole("Admin", "Manager"));

    // Granular permission policies — each maps to a Permission.Name in DB
    var permissions = new[]
    {
        // Companies
        "companies.view", "companies.create", "companies.edit", "companies.delete",
        // Contacts
        "contacts.view", "contacts.create", "contacts.edit", "contacts.delete",
        // Deals
        "deals.view", "deals.create", "deals.edit", "deals.delete", "deals.move",
        // Projects
        "projects.view", "projects.create", "projects.edit", "projects.delete",
        // Users
        "users.view", "users.create", "users.edit", "users.delete",
        // Reports
        "reports.view", "reports.export",
        // Tasks
        "tasks.view", "tasks.create", "tasks.edit", "tasks.delete",
        // Calendar
        "calendar.view", "calendar.create", "calendar.edit",
        // Rooms
        "rooms.view", "rooms.create", "rooms.edit", "rooms.delete", "rooms.reserve",
        // Reminders
        "reminders.view", "reminders.create", "reminders.edit", "reminders.delete",
        // Time Entries
        "timeentries.view", "timeentries.create", "timeentries.edit", "timeentries.delete",
        // Audit
        "audit.view",
        // Roles
        "roles.manage",
    };

    foreach (var perm in permissions)
    {
        options.AddPolicy(perm, policy =>
            policy.Requirements.Add(new CRMF360.Api.Authorization.PermissionRequirement(perm)));
    }
});

builder.Services.AddSingleton<Microsoft.AspNetCore.Authorization.IAuthorizationHandler,
    CRMF360.Api.Authorization.PermissionAuthorizationHandler>();

// ─── Rate Limiting ───
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Global: 100 requests per minute per IP
    options.AddPolicy("global", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 5,
            }));

    // Strict: 10 requests per minute (for login, password reset)
    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 2,
            }));
});

// Swagger con soporte de Bearer token
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "CRMF360 API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Ejemplo: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

await DataSeeder.SeedAsync(app.Services);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

app.UseHttpsRedirection();

app.UseCors();

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<CRMF360.Api.Hubs.ChatHub>("/hubs/chat");

app.Run();
