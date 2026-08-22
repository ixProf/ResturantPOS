using Domain.Enums;

namespace Application.DTOs.Tables;

public class TableSummaryDto
{
    public int Id { get; set; }
    public int TableNumber { get; set; }
    public int Capacity { get; set; }
    public TableStatus Status { get; set; }
    public string WaiterName { get; set; } = string.Empty;
    public int TotalTables { get; set; }
    public int AvailableTables { get; set; }
    public int OccupiedTables { get; set; }
    public int ReservedTables { get; set; }
}