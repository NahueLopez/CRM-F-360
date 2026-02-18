using CRMF360.Api.Middleware;
using CRMF360.Infrastructure;
using CRMF360.Infrastructure.Seed;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Infrastructure (DB + Services)
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers();

// CORS — permite llamadas desde el frontend
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? "clave-super-secreta-dev";
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
    });

// Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));

    options.AddPolicy("ManagerOrAdmin", policy =>
        policy.RequireRole("Admin", "Manager"));
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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
