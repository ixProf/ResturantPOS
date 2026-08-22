using Domain.Enums;

namespace Application.DTOs.Tables;

public class TableResponseDto
{
    public int Id { get; set; }
    public int TableNumber { get; set; }
    public int Capacity { get; set; }
    public TableStatus Status { get; set; }
    public int? WaiterId { get; set; }
    public string WaiterName { get; set; } = string.Empty;
}