using Application.DTOs.Tables;
using Domain.Enums;

namespace Application.Services.Interfaces;

public interface ITableService
{
    Task<TableResponseDto> CreateTableAsync(CreateTableDto dto);
    Task<TableResponseDto> GetTableByIdAsync(int id);
    Task<IEnumerable<TableSummaryDto>> GetAllTablesAsync();
    Task<IEnumerable<TableSummaryDto>> GetTablesByStatusAsync(TableStatus status);
    Task<TableResponseDto> UpdateTableAsync(int id, UpdateTableDto dto);
    Task<TableResponseDto> UpdateTableStatusAsync(int id, UpdateTableStatusDto dto);
    Task<bool> TransferTableAsync(TransferTableDto dto, int employeeId);
    Task<bool> DeleteTableAsync(int id);
}
