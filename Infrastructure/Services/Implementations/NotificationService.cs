using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Notifications;
using Application.Services.Interfaces;
using Domain.Enums;
using Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Implementations;

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto)
    {
        var notification = new Notification
        {
            EmployeeId = dto.EmployeeId,
            TargetRole = dto.TargetRole,
            Message = dto.Message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Notifications.AddAsync(notification);
        await _unitOfWork.SaveChangesAsync();

        return MapToNotificationDto(notification);
    }

    public async Task<NotificationDto> GetNotificationByIdAsync(int id)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(id);
        if (notification == null)
            throw new KeyNotFoundException($"Notification with ID '{id}' was not found.");

        return MapToNotificationDto(notification);
    }

    public async Task<IEnumerable<NotificationDto>> GetNotificationsForEmployeeAsync(int employeeId)
    {
        var notifications = await _unitOfWork.Notifications.Query()
            .Where(n => n.EmployeeId == employeeId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return notifications.Select(MapToNotificationDto);
    }

    public async Task<IEnumerable<NotificationDto>> GetNotificationsByRoleAsync(EmployeeRole role)
    {
        var notifications = await _unitOfWork.Notifications.Query()
            .Where(n => n.TargetRole == role)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return notifications.Select(MapToNotificationDto);
    }

    public async Task<bool> MarkAsReadAsync(int id)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(id);
        if (notification == null)
            return false;

        notification.IsRead = true;
        _unitOfWork.Notifications.Update(notification);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> MarkAllAsReadAsync(int employeeId)
    {
        var unread = await _unitOfWork.Notifications.Query()
            .Where(n => n.EmployeeId == employeeId && !n.IsRead)
            .ToListAsync();

        if (!unread.Any())
            return false;

        foreach (var item in unread)
        {
            item.IsRead = true;
            _unitOfWork.Notifications.Update(item);
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteNotificationAsync(int id)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(id);
        if (notification == null)
            return false;

        _unitOfWork.Notifications.Remove(notification);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private static NotificationDto MapToNotificationDto(Notification n)
    {
        return new NotificationDto
        {
            Id = n.Id,
            EmployeeId = n.EmployeeId,
            TargetRole = n.TargetRole,
            Title = n.Title,
            Message = n.Message,
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt
        };
    }
}

