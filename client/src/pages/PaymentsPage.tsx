import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Receipt, Percent, RotateCcw, Printer, DollarSign } from 'lucide-react';
import api from '../services/api';
import type {
  OrderDetailsDto,
  OrderSummaryDto,
  PaymentMethod,
  InvoiceDto,
  RefundType,
  PaymentDto,
  DiscountResponseDto,
} from '../types/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { PrintableInvoice } from '../components/invoice/PrintableInvoice';
import { signalRService } from '../services/signalr';

export const PaymentsPage: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  const [pendingOrders, setPendingOrders] = useState<OrderDetailsDto[]>([]);
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected order for checkout
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailsDto | null>(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountPaid, setAmountPaid] = useState('');

  // Discount Modal State (Manager)
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');

  // Refund Modal State (Manager)
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundPaymentId, setRefundPaymentId] = useState<number | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundType, setRefundType] = useState<RefundType>('Full');
  const [refundDetail, setRefundDetail] = useState('');

  // Invoice Modal State
  const [invoice, setInvoice] = useState<InvoiceDto | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const [activeDiscounts, setActiveDiscounts] = useState<DiscountResponseDto[]>([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string>('custom');
  const [discountPercent, setDiscountPercent] = useState<string>('');

  const fetchPaymentsData = async () => {
    try {
      setIsLoading(true);
      const [ordersRes, paymentsRes, activeDiscRes] = await Promise.all([
        api.get<OrderSummaryDto[]>('/Orders'),
        api.get<PaymentDto[]>('/Payments'),
        api.get<DiscountResponseDto[]>('/Discounts/active').catch(() => ({ data: [] })),
      ]);

      const unpaid = ordersRes.data.filter(
        (o) => o.status === 'Served' || o.status === 'Ready' || o.status === 'Submitted' || o.status === 'Preparing'
      );
      setPendingOrders(unpaid as any);
      setPayments(paymentsRes.data);
      if (activeDiscRes.data) {
        setActiveDiscounts(activeDiscRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch payments data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();

    // SignalR Real-time Updates
    signalRService.startConnection().then(() => {
      signalRService.on('ReceiveOrderUpdate', () => fetchPaymentsData());
      signalRService.on('SalesUpdated', () => fetchPaymentsData());
    });

    return () => {
      signalRService.off('ReceiveOrderUpdate');
      signalRService.off('SalesUpdated');
    };
  }, []);

  const handleOpenPayment = (order: OrderDetailsDto) => {
    setSelectedOrder(order);
    setAmountPaid(order.finalAmount.toString());
    setPaymentMethod('Cash');
    setIsPaymentModalOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedOrder || !amountPaid) return;
    try {
      await api.post('/Payments', {
        orderId: selectedOrder.id,
        amountPaid: Number(amountPaid),
        paymentMethod,
      });
      setIsPaymentModalOpen(false);

      // Automatically fetch invoice receipt for printing
      handleViewInvoice(selectedOrder.id);
      fetchPaymentsData();
    } catch (err) {
      console.error('Payment processing failed:', err);
    }
  };

  const handleOpenDiscountModal = (order: any) => {
    const subtotal = Number(order.totalAmount || 0);
    const discount = Number(order.discountAmount || 0);
    const final = Number(order.finalAmount ?? Math.max(0, subtotal - discount));

    setSelectedOrder({
      id: order.id,
      tableId: order.tableId,
      tableNumber: order.tableNumber,
      waiterId: 0,
      waiterName: order.waiterName,
      status: order.status,
      totalAmount: subtotal,
      discountAmount: discount,
      finalAmount: final,
      createdAt: order.createdAt,
      items: [],
    });
    setSelectedDiscountId('custom');
    setDiscountAmount('');
    setDiscountPercent('');
    setDiscountReason('');
    setIsDiscountModalOpen(true);
  };

  const handleApplyDiscount = async () => {
    if (!selectedOrder) return;
    try {
      if (selectedDiscountId !== 'custom' && Number(selectedDiscountId) > 0) {
        await api.post(`/Payments/orders/${selectedOrder.id}/discount`, {
          discountId: Number(selectedDiscountId),
          reason: discountReason || undefined,
        });
      } else if (discountPercent && Number(discountPercent) > 0) {
        await api.post(`/Payments/orders/${selectedOrder.id}/discount`, {
          discountPercent: Number(discountPercent),
          reason: discountReason || `${discountPercent}% Discount`,
        });
      } else if (discountAmount && Number(discountAmount) > 0) {
        await api.post(`/Payments/orders/${selectedOrder.id}/discount`, {
          discountAmount: Number(discountAmount),
          reason: discountReason || `${discountAmount} EGP Discount`,
        });
      } else {
        alert(i18n.language === 'ar' ? 'يرجى تحديد خصم صالح.' : 'Please select or enter a valid discount.');
        return;
      }

      setIsDiscountModalOpen(false);
      fetchPaymentsData();
    } catch (err: any) {
      console.error('Failed to apply discount error detail:', err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        (err?.response?.status === 403
          ? (i18n.language === 'ar' ? 'غير مصرح لك بتطبيق الخصم.' : 'You are not authorized to apply this discount.')
          : err?.response?.status === 400
          ? (i18n.language === 'ar' ? 'طلب الخصم غير صالح.' : 'Invalid discount request.')
          : (i18n.language === 'ar' ? 'فشل تطبيق الخصم.' : 'Failed to apply discount.'));
      alert(serverMsg);
    }
  };

  const handleIssueRefund = async () => {
    if (!refundPaymentId || !refundAmount) return;
    try {
      await api.post(`/Payments/${refundPaymentId}/refund`, {
        amount: Number(refundAmount),
        refundType,
        refundDetail,
      });
      setIsRefundModalOpen(false);
      fetchPaymentsData();
    } catch (err) {
      console.error('Failed to issue refund:', err);
    }
  };

  const handleViewInvoice = async (orderId: number) => {
    try {
      const res = await api.get<InvoiceDto>(`/Payments/orders/${orderId}/invoice`);
      setInvoice(res.data);
      setIsInvoiceModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch invoice:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border-color)]">
        <div className="flex items-center space-x-3 gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--secondary-bg)] border border-[var(--glass-border-color)]">
            <CreditCard className="w-5 h-5 text-[var(--primary-color)]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--fg-color)]">Payments & Checkout</h2>
            <p className="text-xs text-[var(--muted-fg)]">
              {pendingOrders.length} orders awaiting cashier checkout
            </p>
          </div>
        </div>
      </div>

      {/* Pending Checkout Orders Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[var(--fg-color)] uppercase tracking-wider">
          Orders Ready for Payment
        </h3>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-[var(--muted-fg)]">Loading...</div>
        ) : pendingOrders.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-[var(--border-color)] rounded-xl text-xs text-[var(--muted-fg)]">
            No orders pending payment
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingOrders.map((order) => (
              <Card key={order.id} className="flex flex-col justify-between border">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-base text-[var(--fg-color)]">
                        Table {order.tableNumber}
                      </h4>
                      <p className="text-xs font-mono text-[var(--muted-fg)]">
                        Order #{order.id} • {order.waiterName}
                      </p>
                    </div>
                    <Badge status={order.status}>{order.status}</Badge>
                  </div>

                  <div className="py-3 border-y border-[var(--border-color)]/60 my-3 space-y-1 text-xs">
                    <div className="flex justify-between text-[var(--muted-fg)]">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatCurrency(order.totalAmount, i18n.language)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount:</span>
                        <span className="font-mono">
                          -{formatCurrency(order.discountAmount, i18n.language)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-[var(--fg-color)] pt-1">
                      <span>Final Amount:</span>
                      <span className="font-mono">{formatCurrency(order.finalAmount, i18n.language)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDiscountModal(order)}
                    title={i18n.language === 'ar' ? 'تطبيق خصم' : 'Apply Discount'}
                    className="gap-1 text-xs"
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>{i18n.language === 'ar' ? 'خصم' : 'Discount'}</span>
                  </Button>
                  <Button
                    variant="brand"
                    size="sm"
                    onClick={() => handleOpenPayment(order)}
                    className="w-full"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Process Payment</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Payments History */}
      <div className="space-y-3 pt-6 border-t border-[var(--border-color)]">
        <h3 className="text-sm font-bold text-[var(--fg-color)] uppercase tracking-wider">
          Recent Completed Payments
        </h3>
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-start text-xs">
            <thead className="bg-[var(--sidebar-bg)] border-b border-[var(--border-color)] text-[var(--muted-fg)] font-semibold">
              <tr>
                <th className="px-4 py-3 text-start">Payment ID</th>
                <th className="px-4 py-3 text-start">Order ID</th>
                <th className="px-4 py-3 text-start">Amount Paid</th>
                <th className="px-4 py-3 text-start">Method</th>
                <th className="px-4 py-3 text-start">Time</th>
                <th className="px-4 py-3 text-end">Receipt / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--secondary-bg)]/40">
                  <td className="px-4 py-3 font-mono font-bold text-[var(--fg-color)]">#{p.id}</td>
                  <td className="px-4 py-3 font-mono text-[var(--muted-fg)]">#{p.orderId}</td>
                  <td className="px-4 py-3 font-mono font-bold text-[var(--fg-color)]">
                    {formatCurrency(p.amountPaid, i18n.language)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status="normal">{p.paymentMethod}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-fg)]">
                    {formatDateTime(p.paidAt, i18n.language)}
                  </td>
                  <td className="px-4 py-3 text-end space-x-1 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewInvoice(p.orderId)}
                      className="p-1.5"
                      title="View Invoice"
                    >
                      <Receipt className="w-4 h-4" />
                    </Button>
                    {user?.role === 'Manager' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRefundPaymentId(p.id);
                          setRefundAmount(p.amountPaid.toString());
                          setIsRefundModalOpen(true);
                        }}
                        className="p-1.5 text-rose-400"
                        title="Issue Refund"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Process Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Process Payment - Order #${selectedOrder?.id}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-[var(--secondary-bg)] rounded-lg text-xs space-y-1">
            <p className="text-[var(--muted-fg)]">Table: Table {selectedOrder?.tableNumber}</p>
            <p className="font-bold text-sm text-[var(--fg-color)]">
              Amount Due: {formatCurrency(selectedOrder?.finalAmount || 0, i18n.language)}
            </p>
          </div>

          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            options={[
              { value: 'Cash', label: 'Cash' },
              { value: 'Card', label: 'Credit / Debit Card' },
              { value: 'Wallet', label: 'Digital Wallet' },
            ]}
          />

          <Input
            label="Amount Paid"
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
          />

          <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleProcessPayment}>
              Confirm & Collect Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Apply Discount Modal */}
      <Modal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        title={i18n.language === 'ar' ? `تطبيق خصم على الطلب #${selectedOrder?.id}` : `Apply Discount to Order #${selectedOrder?.id}`}
      >
        <div className="space-y-4 text-xs">
          {/* Order Summary Header */}
          <div className="p-3 rounded-lg bg-[var(--secondary-bg)] border border-[var(--border-color)] space-y-1">
            <div className="flex justify-between text-[var(--muted-fg)]">
              <span>{i18n.language === 'ar' ? 'إجمالي الطلب (Subtotal):' : 'Order Subtotal:'}</span>
              <span className="font-mono">{formatCurrency(selectedOrder?.totalAmount || selectedOrder?.finalAmount || 0, i18n.language)}</span>
            </div>
            {selectedOrder?.discountAmount && selectedOrder.discountAmount > 0 ? (
              <div className="flex justify-between text-emerald-400">
                <span>{i18n.language === 'ar' ? 'الخصم المطبق حالياً:' : 'Current Discount:'}</span>
                <span className="font-mono">-{formatCurrency(selectedOrder.discountAmount, i18n.language)}</span>
              </div>
            ) : null}
          </div>

          {/* Active Discounts Picker */}
          <Select
            label={i18n.language === 'ar' ? 'اختر خصم معتمد من المدير' : 'Select Manager Approved Discount'}
            value={selectedDiscountId}
            onChange={(e) => setSelectedDiscountId(e.target.value)}
            options={[
              { value: 'custom', label: i18n.language === 'ar' ? '-- خصم مخصص / نسبة مئوية --' : '-- Custom Discount / Percentage --' },
              ...activeDiscounts.map((d) => ({
                value: d.id.toString(),
                label: `${d.name} (${d.type === 'Percentage' ? `${d.value}%` : `${d.value} EGP`}) - ${d.reason}`,
              })),
            ]}
          />

          {selectedDiscountId === 'custom' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Input
                label={i18n.language === 'ar' ? 'نسبة الخصم (%)' : 'Discount Percentage (%)'}
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => {
                  setDiscountPercent(e.target.value);
                  setDiscountAmount('');
                }}
                placeholder="10"
              />

              <Input
                label={i18n.language === 'ar' ? 'أو مبلغ الخصم (EGP)' : 'Or Fixed Amount (EGP)'}
                type="number"
                step="0.01"
                min="0"
                value={discountAmount}
                onChange={(e) => {
                  setDiscountAmount(e.target.value);
                  setDiscountPercent('');
                }}
                placeholder="50.00"
              />
            </div>
          )}

          <Input
            label={i18n.language === 'ar' ? 'سبب الخصم (اختياري)' : 'Discount Reason (Optional)'}
            value={discountReason}
            onChange={(e) => setDiscountReason(e.target.value)}
            placeholder={i18n.language === 'ar' ? 'سبب تطبيق الخصم' : 'Reason for discount'}
          />

          <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button variant="outline" size="sm" onClick={() => setIsDiscountModalOpen(false)}>
              {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="primary" size="sm" onClick={handleApplyDiscount}>
              {i18n.language === 'ar' ? 'تطبيق الخصم' : 'Apply Discount'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Refund Modal */}
      <Modal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        title="Issue Refund"
      >
        <div className="space-y-4">
          <Input
            label="Refund Amount"
            type="number"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
          />
          <Select
            label="Refund Type"
            value={refundType}
            onChange={(e) => setRefundType(e.target.value as RefundType)}
            options={[
              { value: 'Full', label: 'Full Refund' },
              { value: 'Partial', label: 'Partial Refund' },
              { value: 'WrongOrder', label: 'Wrong Order' },
              { value: 'BadQuality', label: 'Quality Complaint' },
              { value: 'Other', label: 'Other' },
            ]}
          />
          <Input
            label="Refund Details / Reason"
            value={refundDetail}
            onChange={(e) => setRefundDetail(e.target.value)}
            placeholder="Explain refund reason"
          />

          <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button variant="outline" size="sm" onClick={() => setIsRefundModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleIssueRefund}>
              Issue Refund
            </Button>
          </div>
        </div>
      </Modal>

      {/* Printable Egyptian Restaurant Thermal Invoice Receipt Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title={i18n.language === 'ar' ? 'فاتورة المطعم (80mm)' : 'Restaurant POS Receipt (80mm)'}
      >
        {invoice && (
          <div className="space-y-4">
            {/* Thermal Receipt Preview Box */}
            <div className="bg-[var(--secondary-bg)] p-4 rounded-xl border border-[var(--border-color)] overflow-y-auto max-h-[70vh]">
              <PrintableInvoice invoice={invoice} language={i18n.language as 'ar' | 'en'} />
            </div>

            {/* Print & Action Controls */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-[var(--border-color)]">
              <span className="text-[11px] text-[var(--muted-fg)]">
                {i18n.language === 'ar' ? 'طابعة إيصالات 80 مم جاهزة' : '80mm Thermal Printer Ready'}
              </span>

              <div className="flex items-center space-x-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsInvoiceModalOpen(false)}>
                  {i18n.language === 'ar' ? 'إغلاق' : 'Close'}
                </Button>

                <Button
                  variant="brand"
                  size="sm"
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>{i18n.language === 'ar' ? 'طباعة الفاتورة (Print)' : 'Print Receipt'}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
