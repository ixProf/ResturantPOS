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
} from '../types/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
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

  const fetchPaymentsData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, paymentsRes] = await Promise.all([
        api.get<OrderSummaryDto[]>('/Orders'),
        api.get<PaymentDto[]>('/Payments'),
      ]);
      const readySummaries = ordersRes.data.filter(
        (o) => o.status === 'Served' || o.status === 'PaymentPending' || o.status === 'Ready'
      );
      const fullOrders = await Promise.all(
        readySummaries.map((s) => api.get<OrderDetailsDto>(`/Orders/${s.id}`).then((r) => r.data))
      );
      setPendingOrders(fullOrders);
      setPayments(paymentsRes.data);
    } catch (err) {
      console.error('Failed to load payments data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();

    signalRService.startConnection().then(() => {
      signalRService.on('ReceiveOrderUpdate', (data: any) => {
        console.log('[SignalR Event] ReceiveOrderUpdate in PaymentsPage:', data);
        fetchPaymentsData();
      });
    });

    return () => {
      signalRService.off('ReceiveOrderUpdate');
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

  const handleApplyDiscount = async () => {
    if (!selectedOrder || !discountAmount) return;
    try {
      await api.post(`/Payments/orders/${selectedOrder.id}/discount`, {
        discountAmount: Number(discountAmount),
        reason: discountReason,
      });
      setIsDiscountModalOpen(false);
      setDiscountAmount('');
      setDiscountReason('');
      fetchPaymentsData();
    } catch (err) {
      console.error('Failed to apply discount:', err);
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
                  {user?.role === 'Manager' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDiscountModalOpen(true);
                      }}
                      title="Apply Discount"
                    >
                      <Percent className="w-3.5 h-3.5" />
                    </Button>
                  )}
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
        title="Apply Discount to Order"
      >
        <div className="space-y-4">
          <Input
            label="Discount Amount ($)"
            type="number"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(e.target.value)}
            placeholder="e.g. 5.00"
          />
          <Input
            label="Reason for Discount"
            value={discountReason}
            onChange={(e) => setDiscountReason(e.target.value)}
            placeholder="e.g. VIP Promo / Manager Courtesy"
          />

          <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button variant="outline" size="sm" onClick={() => setIsDiscountModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleApplyDiscount}>
              Apply Discount
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

      {/* Invoice Receipt Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Invoice Receipt"
      >
        {invoice && (
          <div className="space-y-4 font-mono text-xs">
            <div className="text-center border-b border-[var(--border-color)] pb-3">
              <h2 className="font-bold text-lg tracking-tight text-[var(--fg-color)]">Alaris FlowX</h2>
              <p className="text-[10px] text-[var(--muted-fg)]">Official Receipt Invoice</p>
              <p className="text-[10px] text-[var(--muted-fg)]">
                Date: {formatDateTime(invoice.paidAt, i18n.language)}
              </p>
            </div>

            <div className="flex justify-between text-[var(--muted-fg)]">
              <span>Order #: {invoice.orderId}</span>
              <span>Table: {invoice.tableNumber}</span>
            </div>
            <p className="text-[var(--muted-fg)]">Staff: {invoice.waiterName}</p>

            <table className="w-full text-start border-y border-[var(--border-color)] py-2">
              <thead>
                <tr className="text-[var(--muted-fg)] text-[10px]">
                  <th className="text-start">Item</th>
                  <th className="text-center">Qty</th>
                  <th className="text-end">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/40">
                {invoice.items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-1">{i.menuItemName}</td>
                    <td className="py-1 text-center">{i.quantity}</td>
                    <td className="py-1 text-end">{formatCurrency(i.totalPrice, i18n.language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 text-end">
              <p>Subtotal: {formatCurrency(invoice.subTotal, i18n.language)}</p>
              {invoice.discountAmount > 0 && (
                <p className="text-emerald-400">
                  Discount: -{formatCurrency(invoice.discountAmount, i18n.language)}
                </p>
              )}
              <p className="font-bold text-sm text-[var(--fg-color)]">
                Total Paid: {formatCurrency(invoice.finalAmount, i18n.language)} ({invoice.paymentMethod})
              </p>
            </div>

            <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsInvoiceModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
