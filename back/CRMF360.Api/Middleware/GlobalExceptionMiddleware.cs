using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title, detail) = exception switch
        {
            ArgumentException => (400, "Solicitud inválida", exception.Message),
            KeyNotFoundException => (404, "No encontrado", "Recurso no encontrado"),
            UnauthorizedAccessException => (403, "Acceso denegado", "No tenés permisos para esta acción"),
            DbUpdateConcurrencyException => (409, "Conflicto de concurrencia", "El registro fue modificado por otro usuario. Recargá la página e intentá de nuevo."),
            InvalidOperationException => (409, "Operación inválida", exception.Message),
            _ => (500, "Error interno", "Error interno del servidor"),
        };

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = statusCode;

        var result = JsonSerializer.Serialize(new
        {
            type = $"https://httpstatuses.io/{statusCode}",
            title,
            status = statusCode,
            detail,
            instance = context.Request.Path.Value,
        });

        return context.Response.WriteAsync(result);
    }
}
