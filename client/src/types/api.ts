export type EmployeeRole = 'Manager' | 'Waiter' | 'Chef' | 'Cashier' | 'InventoryManager';

export type TableStatus = 'Available' | 'Occupied' | 'Reserved' | 'Cleaning' | 'OutOfService';

export type OrderStatus =
  | 'Draft'
  | 'Submitted'
  | 'Preparing'
  | 'Ready'
  | 'Served'
  | 'PaymentPending'
  | 'Completed'
  | 'Cancelled'
  | 'Voided';

export type OrderItemStatus =
  | 'Draft'
  | 'Submitted'
  | 'Preparing'
  | 'Ready'
  | 'Served'
  | 'Cancelled'
  | 'Voided';

export type PaymentMethod = 'Cash' | 'Card' | 'Wallet';

export type RefundType =
  | 'Full'
  | 'Partial'
  | 'WrongOrder'
  | 'BadQuality'
  | 'OrderCancelled'
  | 'Overcharged'
  | 'CustomerComplaint'
  | 'Other';

export type InventoryReasonType = 'Order' | 'Restock' | 'Waste' | 'Spoilage' | 'Adjustment';

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  token: string;
  employeeId: number;
  fullName: string;
  email: string;
  role: EmployeeRole;
}

export interface TableResponseDto {
  id: number;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  waiterId?: number;
  waiterName?: string;
}

export interface CreateTableDto {
  tableNumber: number;
  capacity: number;
}

export interface UpdateTableDto {
  tableNumber: number;
  capacity: number;
  waiterId?: number;
}

export interface UpdateTableStatusDto {
  status: TableStatus;
}

export interface TransferTableDto {
  sourceTableId: number;
  destinationTableId: number;
  orderId: number;
  reason?: string;
}

export interface OrderItemDto {
  id: number;
  menuItemId: number;
  menuItemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  status: OrderItemStatus;
  notes?: string;
  cancellationReason?: string;
}

export interface OrderDetailsDto {
  id: number;
  tableId: number;
  tableNumber: number;
  waiterId: number;
  waiterName: string;
  status: OrderStatus;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  createdAt: string;
  updatedAt?: string;
  cancellationReason?: string;
  items: OrderItemDto[];
}

export interface OrderSummaryDto {
  id: number;
  tableId: number;
  tableNumber: number;
  waiterName: string;
  status: OrderStatus;
  totalAmount: number;
  discountAmount?: number;
  finalAmount?: number;
  itemCount: number;
  createdAt: string;
}

export interface AddOrderItemDto {
  menuItemId: number;
  quantity: number;
  notes?: string;
}

export interface RemoveOrderItemDto {
  orderItemId: number;
  menuItemId?: number;
}

export interface CreateOrderDto {
  tableId: number;
  items: AddOrderItemDto[];
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
}

export interface UpdateOrderItemStatusDto {
  status: OrderItemStatus;
  cancellationReason?: string;
}

export interface CancelOrderDto {
  reason: string;
}

export interface CategoryDto {
  id: number;
  name: string;
  description?: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name: string;
  description?: string;
}

export interface MenuItemIngredientDto {
  menuItemId: number;
  ingredientId: number;
  ingredientName: string;
  quantityUsed: number;
  unit: string;
}

export interface MenuItemDto {
  id: number;
  name: string;
  description?: string;
  price: number;
  categoryId?: number;
  categoryName: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface MenuItemDetailsDto extends MenuItemDto {
  ingredients: MenuItemIngredientDto[];
}

export interface CreateMenuItemDto {
  name: string;
  description?: string;
  price: number;
  categoryId?: number;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface UpdateMenuItemDto {
  name: string;
  description?: string;
  price: number;
  categoryId?: number;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface UpdateMenuItemStatusDto {
  isAvailable: boolean;
}

export interface IngredientDto {
  id: number;
  name: string;
  quantity: number;
  totalStock: number;
  unit: string;
  minimumStockLevel: number;
  lowStockAlert?: number;
  isLowStock: boolean;
}

export interface CreateIngredientDto {
  name: string;
  quantity: number;
  unit: string;
  minimumStockLevel: number;
}

export interface UpdateIngredientDto {
  name: string;
  unit: string;
  minimumStockLevel: number;
}

export interface StockAdjustmentDto {
  ingredientId: number;
  quantity: number;
  type: InventoryReasonType;
  reason?: string;
}

export interface PaymentDto {
  id: number;
  orderId: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  cashierId?: number;
  cashierName?: string;
}

export interface CreatePaymentDto {
  orderId: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
}

export interface InvoiceDto {
  orderId: number;
  receiptNumber?: string;
  tableNumber: number;
  waiterName: string;
  cashierName?: string;
  items: OrderItemDto[];
  subTotal: number;
  discountAmount: number;
  finalAmount: number;
  amountPaid?: number;
  changeAmount?: number;
  paymentMethod: PaymentMethod;
  paidAt: string;

  restaurantName?: string;
  restaurantNameArabic?: string;
  restaurantAddress?: string;
  restaurantAddressArabic?: string;
  restaurantPhone?: string;
  taxRegistrationNumber?: string;
  commercialRegistrationNumber?: string;
}

export type DiscountType = 'Percentage' | 'FixedAmount';

export interface CreateDiscountDto {
  name: string;
  type: DiscountType;
  value: number;
  reason: string;
  isActive: boolean;
  isApproved: boolean;
  validFrom?: string;
  validTo?: string;
}

export interface UpdateDiscountDto {
  name: string;
  type: DiscountType;
  value: number;
  reason: string;
  isActive: boolean;
  isApproved: boolean;
  validFrom?: string;
  validTo?: string;
}

export interface UpdateDiscountStatusDto {
  isActive: boolean;
  isApproved?: boolean;
}

export interface DiscountResponseDto {
  id: number;
  name: string;
  type: DiscountType;
  typeName: string;
  value: number;
  discountPercent?: number;
  discountAmount?: number;
  reason: string;
  isActive: boolean;
  isApproved: boolean;
  validFrom?: string;
  validTo?: string;
  createdById?: number;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApplyDiscountDto {
  discountId?: number;
  discountAmount?: number;
  discountPercent?: number;
  reason?: string;
}

export interface IssueRefundDto {
  amount: number;
  refundType: RefundType;
  refundDetail: string;
}

export interface PaymentMethodBreakdownDto {
  paymentMethod: PaymentMethod;
  paymentMethodName: string;
  amount: number;
  transactionCount: number;
}

export interface SalesOrderDetailDto {
  orderId: number;
  tableNumber: number;
  waiterName: string;
  grossAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  completedAt: string;
}

export interface CreateInventoryPurchaseDto {
  ingredientId: number;
  quantity: number;
  unitCost: number;
  reason: string;
}

export interface InventoryPurchaseResponseDto {
  id: number;
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unitCost: number;
  totalAmount: number;
  reason: string;
  purchaseDate: string;
  createdById: number;
  createdByName: string;
}

export interface ExpenseBreakdownDto {
  category: string;
  amount: number;
  recordCount: number;
}

export interface SalesReportDto {
  grossSales: number;
  discounts: number;
  refunds: number;
  netRevenue: number;
  totalExpenses: number;
  netProfit: number;
  completedOrdersCount: number;
  averageOrderValue: number;
  totalSales: number;
  totalOrders: number;
  paymentMethodBreakdown: PaymentMethodBreakdownDto[];
  topSellingItems: TopSellingItemDto[];
  expenseBreakdown: ExpenseBreakdownDto[];
  orderDetails: SalesOrderDetailDto[];
}

export interface TopSellingItemDto {
  menuItemId: number;
  menuItemName: string;
  itemName: string;
  totalQuantitySold: number;
  quantitySold: number;
  totalRevenue: number;
}

export interface CreateEmployeeDto {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role: EmployeeRole;
}

export interface UpdateEmployeeDto {
  fullName: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  isActive?: boolean;
}

export interface UpdateEmployeeStatusDto {
  isActive: boolean;
}

export interface EmployeeDto {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  isActive: boolean;
  isAvailable?: boolean;
}
