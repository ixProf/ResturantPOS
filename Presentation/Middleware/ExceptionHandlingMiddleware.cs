using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Presentation.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        int statusCode;
        string title;
        string message = exception.Message;

        switch (exception)
        {
            case KeyNotFoundException:
                statusCode = (int)HttpStatusCode.NotFound;
                title = "Resource Not Found";
                break;

            case InvalidOperationException:
                statusCode = (int)HttpStatusCode.BadRequest;
                title = "Invalid Operation";
                break;

            case UnauthorizedAccessException:
                statusCode = (int)HttpStatusCode.Forbidden;
                title = "Access Denied";
                break;

            case DbUpdateConcurrencyException:
                statusCode = (int)HttpStatusCode.Conflict;
                title = "Concurrency Conflict";
                message = "The entity you were trying to update was modified by another user. Please reload and try again.";
                break;

            case ArgumentException:
                statusCode = (int)HttpStatusCode.BadRequest;
                title = "Bad Request";
                break;

            default:
                statusCode = (int)HttpStatusCode.InternalServerError;
                title = "Internal Server Error";
                if (!_env.IsDevelopment())
                {
                    message = "An unexpected error occurred. Please contact support.";
                }
                break;
        }

        context.Response.StatusCode = statusCode;

        var response = new
        {
            status = statusCode,
            title,
            message,
            traceId = context.TraceIdentifier,
            details = _env.IsDevelopment() && statusCode == 500 ? exception.StackTrace : null
        };

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        return context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}
