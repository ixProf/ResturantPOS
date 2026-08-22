namespace Application.DTOs.Menu;

public class MenuFilterDto
{
    public int? CategoryId { get; set; }
    public string? Search { get; set; }
    public string? SearchTerm { get => Search; set => Search = value; }
    public bool? AvailableOnly { get; set; }
    public bool? IsAvailable { get => AvailableOnly; set => AvailableOnly = value; }
}