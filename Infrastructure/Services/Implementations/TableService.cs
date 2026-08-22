using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Tables;
using Application.Services.Interfaces;
using Domain.Enums;
using Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Implementations;

public class TableService : ITableService
{
    private readonly IUnitOfWork _unitOfWork;

    public TableService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<TableResponseDto> CreateTableAsync(CreateTableDto dto)
    {
        bool tableExists = await _unitOfWork.Tables.AnyAsync(t => t.TableNumber == dto.TableNumber);
        if (tableExists)
        {
            throw new InvalidOperationException($"Table number '{dto.TableNumber}' already exists.");
        }

        var table = new RestaurantTable
        {
            TableNumber = dto.TableNumber,
            Capacity = dto.Capacity,
            Status = TableStatus.Available
        };

        await _unitOfWork.Tables.AddAsync(table);
        await _unitOfWork.SaveChangesAsync();

        return MapToTableResponseDto(table);
    }

    public async Task<TableResponseDto> GetTableByIdAsync(int id)
    {
        var table = await _unitOfWork.Tables.Query()
            .Include(t => t.Waiter)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (table == null)
            throw new KeyNotFoundException($"Table with ID '{id}' was not found.");

        return MapToTableResponseDto(table);
    }

    public async Task<IEnumerable<TableSummaryDto>> GetAllTablesAsync()
    {
        var tables = await _unitOfWork.Tables.Query().Include(t => t.Waiter).ToListAsync();
        return tables.Select(MapToTableSummaryDto);
    }

    public async Task<IEnumerable<TableSummaryDto>> GetTablesByStatusAsync(TableStatus status)
    {
        var tables = await _unitOfWork.Tables.Query()
            .Where(t => t.Status == status)
            .Include(t => t.Waiter)
            .ToListAsync();

        return tables.Select(MapToTableSummaryDto);
    }

    public async Task<TableResponseDto> UpdateTableAsync(int id, UpdateTableDto dto)
    {
        var table = await _unitOfWork.Tables.GetByIdAsync(id);
        if (table == null)
            throw new KeyNotFoundException($"Table with ID '{id}' was not found.");

        table.Capacity = dto.Capacity;
        if (dto.WaiterId.HasValue)
        {
            var waiter = await _unitOfWork.Employees.GetByIdAsync(dto.WaiterId.Value);
            if (waiter == null)
                throw new KeyNotFoundException($"Waiter with ID '{dto.WaiterId}' was not found.");
            table.WaiterId = dto.WaiterId;
        }
        else
        {
            table.WaiterId = null;
        }

        _unitOfWork.Tables.Update(table);
        await _unitOfWork.SaveChangesAsync();
        return MapToTableResponseDto(table);
    }

    public async Task<TableResponseDto> UpdateTableStatusAsync(int id, UpdateTableStatusDto dto)
    {
        var table = await _unitOfWork.Tables.GetByIdAsync(id);
        if (table == null)
            throw new KeyNotFoundException($"Table with ID '{id}' was not found.");

        table.Status = dto.Status;
        _unitOfWork.Tables.Update(table);
        await _unitOfWork.SaveChangesAsync();

        return MapToTableResponseDto(table);
    }

    public async Task<bool> TransferTableAsync(TransferTableDto dto, int employeeId)
    {
        using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var sourceTable = await _unitOfWork.Tables.GetByIdAsync(dto.SourceTableId);
            if (sourceTable == null)
                throw new KeyNotFoundException($"Source table '{dto.SourceTableId}' not found.");

            var destTable = await _unitOfWork.Tables.GetByIdAsync(dto.DestinationTableId);
            if (destTable == null)
                throw new KeyNotFoundException($"Destination table '{dto.DestinationTableId}' not found.");

            if (destTable.Status != TableStatus.Available)
                throw new InvalidOperationException($"Destination table '{destTable.TableNumber}' is not available.");

            var order = await _unitOfWork.Orders.SingleOrDefaultAsync(o => o.Id == dto.OrderId && o.TableId == dto.SourceTableId);
            if (order == null)
                throw new KeyNotFoundException($"Active order '{dto.OrderId}' not found on source table.");

            order.TableId = dto.DestinationTableId;
            sourceTable.Status = TableStatus.Available;
            destTable.Status = TableStatus.Occupied;

            _unitOfWork.Orders.Update(order);
            _unitOfWork.Tables.Update(sourceTable);
            _unitOfWork.Tables.Update(destTable);

            var transferLog = new TableTransferLog

            {
                OrderId = dto.OrderId,
                FromTableId = dto.SourceTableId,
                ToTableId = dto.DestinationTableId,
                TransferredBy = employeeId,
                TransferredAt = DateTime.UtcNow,
                Reason = dto.Reason ?? string.Empty
            };

            await _unitOfWork.TableTransferLogs.AddAsync(transferLog);
            await _unitOfWork.CommitTransactionAsync();

            return true;
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<bool> DeleteTableAsync(int id)
    {
        var table = await _unitOfWork.Tables.GetByIdAsync(id);
        if (table == null)
            return false;

        bool hasActiveOrders = await _unitOfWork.Orders.AnyAsync(o => o.TableId == id && o.Status != OrderStatus.Completed && o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Voided);
        if (hasActiveOrders)
        {
            throw new InvalidOperationException("Cannot delete table with active orders.");
        }

        _unitOfWork.Tables.Remove(table);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private static TableResponseDto MapToTableResponseDto(RestaurantTable table)
    {
        return new TableResponseDto
        {
            Id = table.Id,
            TableNumber = table.TableNumber,
            Capacity = table.Capacity,
            Status = table.Status,
            WaiterId = table.WaiterId,
            WaiterName = table.Waiter?.FullName ?? string.Empty
        };
    }

    private static TableSummaryDto MapToTableSummaryDto(RestaurantTable table)
    {
        return new TableSummaryDto
        {
            Id = table.Id,
            TableNumber = table.TableNumber,
            Capacity = table.Capacity,
            Status = table.Status,
            WaiterName = table.Waiter?.FullName ?? string.Empty
        };
    }
}

