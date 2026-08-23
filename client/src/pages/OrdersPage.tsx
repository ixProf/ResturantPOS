import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Send,
  XCircle,
  CheckCircle,
} from 'lucide-react';
import api from '../services/api';
import type {
  TableResponseDto,
  CategoryDto,
  MenuItemDto,
  OrderDetailsDto,
  OrderStatus,
  AddOrderItemDto,
} from '../types/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { signalRService } from '../services/signalr';

export const OrdersPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();

  const preselectedTableId = searchParams.get('tableId');

  const [tables, setTables] = useState<TableResponseDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [activeOrder, setActiveOrder] = useState<OrderDetailsDto | null>(null);

  const [selectedTableId, setSelectedTableId] = useState<number | ''>(
    preselectedTableId ? Number(preselectedTableId) : ''
  );
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart state for draft orders
  const [cart, setCart] = useState<AddOrderItemDto[]>([]);

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const loadData = async () => {
    try {
      const [tablesRes, catRes, menuRes] = await Promise.all([
        api.get<TableResponseDto[]>('/Tables'),
        api.get<CategoryDto[]>('/Categories'),
        api.get<MenuItemDto[]>('/MenuItems'),
      ]);
      setTables(tablesRes.data);
      setCategories(catRes.data);
      setMenuItems(menuRes.data);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const loadActiveOrder = async (tableId: number) => {
    if (!tableId) {
      setActiveOrder(null);
      return;
    }
    try {
      const ordersRes = await api.get<OrderDetailsDto[]>('/Orders');
      // Find active order for this table
      const existing = ordersRes.data.find(
        (o) => o.tableId === tableId && o.status !== 'Completed' && o.status !== 'Cancelled' && o.status !== 'Voided'
      );
      if (existing) {
        const fullOrder = await api.get<OrderDetailsDto>(`/Orders/${existing.id}`);
        setActiveOrder(fullOrder.data);
      } else {
        setActiveOrder(null);
      }
    } catch (err) {
      console.error('Error fetching table order:', err);
    }
  };

  useEffect(() => {
    loadData();

    signalRService.startConnection().then(() => {
      signalRService.on('ReceiveOrderUpdate', (data: any) => {
        console.log('[SignalR Event] ReceiveOrderUpdate in OrdersPage:', data);
        if (selectedTableId) {
          loadActiveOrder(Number(selectedTableId));
        }
      });
    });

    return () => {
      signalRService.off('ReceiveOrderUpdate');
    };
  }, []);

  useEffect(() => {
    if (selectedTableId) {
      loadActiveOrder(Number(selectedTableId));
    } else {
      setActiveOrder(null);
    }
  }, [selectedTableId]);

  const handleAddToCart = (item: MenuItemDto) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItemId: item.id, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (menuItemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.menuItemId === menuItemId) {
            const next = i.quantity + delta;
            return next > 0 ? { ...i, quantity: next } : null;
          }
          return i;
        })
        .filter(Boolean) as AddOrderItemDto[]
    );
  };

  const handleCreateOrUpdateOrder = async () => {
    if (!selectedTableId || cart.length === 0) return;

    try {
      if (activeOrder) {
        // Add items to existing order
        for (const item of cart) {
          await api.post(`/Orders/${activeOrder.id}/items`, item);
        }
      } else {
        // Create new order
        await api.post('/Orders', {
          tableId: Number(selectedTableId),
          items: cart,
        });
      }
      setCart([]);
      loadActiveOrder(Number(selectedTableId));
    } catch (err) {
      console.error('Failed to submit order items:', err);
    }
  };

  const handleSubmitToKitchen = async () => {
    if (!activeOrder) return;
    try {
      await api.post(`/Orders/${activeOrder.id}/submit`);
      loadActiveOrder(Number(selectedTableId));
    } catch (err) {
      console.error('Failed to submit order to kitchen:', err);
    }
  };

  const handleMarkServed = async () => {
    if (!activeOrder) return;
    try {
      await api.put(`/Orders/${activeOrder.id}/status`, { status: 'Served' });
      loadActiveOrder(Number(selectedTableId));
    } catch (err) {
      console.error('Failed to mark order as served:', err);
    }
  };

  const handleCancelOrder = async () => {
    if (!activeOrder || !cancelReason) return;
    try {
      await api.post(`/Orders/${activeOrder.id}/cancel`, { reason: cancelReason });
      setIsCancelModalOpen(false);
      setCancelReason('');
      loadActiveOrder(Number(selectedTableId));
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
  };

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, cartItem) => {
    const item = menuItems.find((m) => m.id === cartItem.menuItemId);
    return sum + (item ? item.price * cartItem.quantity : 0);
  }, 0);

  const orderStatuses: OrderStatus[] = [
    'Draft',
    'Submitted',
    'Preparing',
    'Ready',
    'Served',
    'PaymentPending',
    'Completed',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Menu Catalog Section (8 Columns) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        {/* Table Selector & Search Header */}
        <div className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border-color)] space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-64">
              <Select
                label={t('orders.table')}
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value ? Number(e.target.value) : '')}
                options={[
                  { value: '', label: '-- Select Table --' },
                  ...tables.map((t) => ({
                    value: t.id,
                    label: `Table ${t.tableNumber} (${t.status})`,
                  })),
                ]}
              />
            </div>

            <div className="w-full sm:flex-1 relative">
              <Input
                placeholder={t('orders.searchItems')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
              <Search className="w-4 h-4 absolute start-3 top-3.5 text-[var(--muted-fg)]" />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[var(--fg-color)] text-[var(--bg-color)]'
                  : 'bg-[var(--secondary-bg)] text-[var(--muted-fg)] hover:text-[var(--fg-color)]'
              }`}
            >
              {t('orders.selectCategory')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-[var(--fg-color)] text-[var(--bg-color)]'
                    : 'bg-[var(--secondary-bg)] text-[var(--muted-fg)] hover:text-[var(--fg-color)]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMenuItems.map((item) => (
            <Card
              key={item.id}
              variant="interactive"
              onClick={() => item.isAvailable && handleAddToCart(item)}
              className={`flex flex-col justify-between h-40 p-4 border relative ${
                !item.isAvailable ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--muted-fg)] tracking-wider">
                    {item.categoryName || 'General'}
                  </span>
                  {!item.isAvailable && <Badge status="OutOfService">Unavailable</Badge>}
                </div>
                <h4 className="font-semibold text-sm text-[var(--fg-color)] line-clamp-2 mt-1">
                  {item.name}
                </h4>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]/60">
                <span className="text-sm font-extrabold text-[var(--fg-color)]">
                  {formatCurrency(item.price, i18n.language)}
                </span>
                <Button variant="secondary" size="sm" className="p-1 rounded-md">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Order Summary & Drawer Section (4/5 Columns) */}
      <div className="lg:col-span-5 xl:col-span-4 space-y-4">
        <Card className="p-5 border border-[var(--border-color)] sticky top-20">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-4">
            <div>
              <h3 className="font-bold text-base text-[var(--fg-color)] flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <span>
                  {selectedTableId
                    ? `${t('orders.table')} ${tables.find((t) => t.id === selectedTableId)?.tableNumber}`
                    : 'Select a Table'}
                </span>
              </h3>
              {activeOrder && (
                <p className="text-xs text-[var(--muted-fg)] font-mono mt-0.5">
                  Order #{activeOrder.id} • {formatDateTime(activeOrder.createdAt, i18n.language)}
                </p>
              )}
            </div>
            {activeOrder && <Badge status={activeOrder.status}>{activeOrder.status}</Badge>}
          </div>

          {/* Active Order Progress Timeline */}
          {activeOrder && (
            <div className="mb-4 p-3 bg-[var(--secondary-bg)] rounded-lg text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--muted-fg)]">
                <span>Order Timeline</span>
                <span>{activeOrder.status}</span>
              </div>
              <div className="w-full bg-[var(--card-bg)] h-2 rounded-full overflow-hidden flex">
                {orderStatuses.map((st, idx) => {
                  const currentIdx = orderStatuses.indexOf(activeOrder.status);
                  const isPassed = idx <= currentIdx;
                  return (
                    <div
                      key={st}
                      className={`flex-1 border-r border-[var(--border-color)] ${
                        isPassed ? 'bg-[var(--primary-color)]' : 'bg-transparent'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Existing Order Items */}
          {activeOrder && activeOrder.items.length > 0 && (
            <div className="mb-4 space-y-2 max-h-48 overflow-y-auto pe-1">
              <p className="text-xs font-bold text-[var(--muted-fg)] uppercase tracking-wider">
                Submitted Items
              </p>
              {activeOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[var(--secondary-bg)]/60 text-xs"
                >
                  <div>
                    <p className="font-medium text-[var(--fg-color)]">{item.menuItemName}</p>
                    <p className="text-[10px] text-[var(--muted-fg)]">
                      x{item.quantity} • {formatCurrency(item.unitPrice, i18n.language)}
                    </p>
                  </div>
                  <div className="text-end">
                    <span className="font-bold text-[var(--fg-color)]">
                      {formatCurrency(item.totalPrice, i18n.language)}
                    </span>
                    <div className="mt-0.5">
                      <Badge status={item.status as any}>{item.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cart Items (Draft) */}
          <div className="space-y-3 max-h-60 overflow-y-auto pe-1">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--muted-fg)]">
                {t('orders.emptyCart')}
              </div>
            ) : (
              cart.map((cartItem) => {
                const menuItem = menuItems.find((m) => m.id === cartItem.menuItemId);
                if (!menuItem) return null;
                return (
                  <div
                    key={cartItem.menuItemId}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--secondary-bg)] text-xs"
                  >
                    <div className="flex-1 me-2">
                      <p className="font-semibold text-[var(--fg-color)]">{menuItem.name}</p>
                      <p className="text-[10px] text-[var(--muted-fg)]">
                        {formatCurrency(menuItem.price, i18n.language)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 gap-1">
                      <button
                        onClick={() => handleUpdateQuantity(cartItem.menuItemId, -1)}
                        className="p-1 rounded bg-[var(--card-bg)] text-[var(--muted-fg)] hover:text-[var(--fg-color)]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold w-5 text-center text-[var(--fg-color)]">
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(cartItem.menuItemId, 1)}
                        className="p-1 rounded bg-[var(--card-bg)] text-[var(--muted-fg)] hover:text-[var(--fg-color)]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Total & Action Buttons */}
          <div className="pt-4 mt-4 border-t border-[var(--border-color)] space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--muted-fg)]">{t('orders.total')}</span>
              <span className="text-lg font-black text-[var(--fg-color)]">
                {formatCurrency(
                  (activeOrder ? activeOrder.finalAmount : 0) + cartTotal,
                  i18n.language
                )}
              </span>
            </div>

            {cart.length > 0 && (
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateOrUpdateOrder}
                className="w-full"
                disabled={!selectedTableId}
              >
                <Plus className="w-4 h-4" />
                <span>{activeOrder ? 'Add Items to Order' : 'Create Draft Order'}</span>
              </Button>
            )}

            {activeOrder && activeOrder.status === 'Draft' && (
              <Button
                variant="brand"
                size="md"
                onClick={handleSubmitToKitchen}
                className="w-full"
              >
                <Send className="w-4 h-4" />
                <span>{t('orders.submitToKitchen')}</span>
              </Button>
            )}

            {activeOrder && activeOrder.status === 'Ready' && (
              <Button
                variant="primary"
                size="md"
                onClick={handleMarkServed}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Order as Served</span>
              </Button>
            )}

            {activeOrder && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                className="w-full"
              >
                <XCircle className="w-4 h-4" />
                <span>{t('orders.cancelOrder')}</span>
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={t('orders.cancelOrder')}
      >
        <div className="space-y-4">
          <Input
            label="Cancellation Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g. Customer changed mind"
          />
          <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button variant="outline" size="sm" onClick={() => setIsCancelModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleCancelOrder}>
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
