namespace Application.DTOs.Tables;

public class TransferTableDto
{
    public int SourceTableId { get; set; }
    public int DestinationTableId { get; set; }
    public int OrderId { get; set; }
    public string? Reason { get; set; }
}
