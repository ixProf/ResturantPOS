namespace Application.DTOs.Tables;

public class UpdateTableDto
{
    public int TableNumber { get; set; }
    public int Capacity { get; set; }
    public int? WaiterId { get; set; }
}