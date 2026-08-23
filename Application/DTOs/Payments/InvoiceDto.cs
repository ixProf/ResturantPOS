using Domain.Enums;
using Application.DTOs.Orders;
namespace Application.DTOs.Payments;

public class InvoiceDto
{
    public int OrderId { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public int TableNumber { get; set; }
    public string WaiterName { get; set; } = string.Empty;
    public string CashierName { get; set; } = string.Empty;

    public List<OrderItemDto> Items { get; set; } = new();

    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal FinalAmount { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal ChangeAmount { get; set; }

    public PaymentMethod PaymentMethod { get; set; }
    public DateTime PaidAt { get; set; }

    // Egyptian Restaurant Metadata Settings
    public string RestaurantName { get; set; } = "Alaris FlowX Restaurant";
    public string RestaurantNameArabic { get; set; } = "مطعم ألاريس فلو إكس";
    public string RestaurantAddress { get; set; } = "Cairo, Egypt";
    public string RestaurantAddressArabic { get; set; } = "القاهرة، مصر";
    public string RestaurantPhone { get; set; } = "+20 100 123 4567";
    public string TaxRegistrationNumber { get; set; } = "723-458-912";
    public string CommercialRegistrationNumber { get; set; } = "142859";
}