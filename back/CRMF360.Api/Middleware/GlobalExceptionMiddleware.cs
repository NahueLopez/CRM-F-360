using System.Net;
using System.Text.Json;

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
        var (statusCode, message) = exception switch
        {
            ArgumentException => (HttpStatusCode.BadRequest, exception.Message),
            KeyNotFoundException => (HttpStatusCode.NotFound, "Recurso no encontrado"),
            UnauthorizedAccessException => (HttpStatusCode.Forbidden, "Acceso denegado"),
            InvalidOperationException => (HttpStatusCode.Conflict, exception.Message),
            _ => (HttpStatusCode.InternalServerError, "Error interno del servidor"),
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var result = JsonSerializer.Serialize(new
        {
            status = (int)statusCode,
            message,
        });

        return context.Response.WriteAsync(result);
    }
}
