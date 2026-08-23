import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed, RefreshCw, BookOpen, Check, X } from 'lucide-react';
import api from '../services/api';
import type { OrderDetailsDto, OrderItemStatus, OrderSummaryDto, MenuItemDto } from '../types/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { signalRService } from '../services/signalr';

export const KitchenPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState<OrderDetailsDto[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [activeTab, setActiveTab] = useState<'tickets' | 'menu'>('tickets');
  const [isLoading, setIsLoading] = useState(true);

  const fetchKitchenOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<OrderSummaryDto[]>('/Orders');
      const kitchenSummaries = res.data.filter(
        (o) => o.status === 'Submitted' || o.status === 'Preparing' || o.status === 'Ready'
      );
      
      const fullDetails = await Promise.all(
        kitchenSummaries.map((s) => api.get<OrderDetailsDto>(`/Orders/${s.id}`).then((r) => r.data))
      );
      setOrders(fullDetails);
    } catch (err) {
      console.error('Failed to load kitchen orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const menuRes = await api.get<MenuItemDto[]>('/MenuItems');
      setMenuItems(menuRes.data);
    } catch (err) {
      console.error('Failed to load menu items in Kitchen:', err);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    fetchMenuItems();

    signalRService.startConnection().then(() => {
      signalRService.on('ReceiveOrderUpdate', (data: any) => {
        console.log('[SignalR Event] ReceiveOrderUpdate in KitchenPage:', data);
        fetchKitchenOrders();
      });

      signalRService.on('MenuUpdated', (data: any) => {
        console.log('[SignalR Event] MenuUpdated in KitchenPage:', data);
        fetchMenuItems();
        fetchKitchenOrders();
      });
    });

    return () => {
      signalRService.off('ReceiveOrderUpdate');
      signalRService.off('MenuUpdated');
    };
  }, []);

  const handleToggleMenuItemStatus = async (item: MenuItemDto) => {
    try {
      await api.put(`/MenuItems/${item.id}/status`, { isAvailable: !item.isAvailable });
      fetchMenuItems();
    } catch (err) {
      console.error('Failed to toggle menu item status:', err);
    }
  };

  const handleUpdateItemStatus = async (orderId: number, itemId: number, status: OrderItemStatus) => {
    try {
      await api.put(`/Orders/${orderId}/items/${itemId}/status`, { status });
      fetchKitchenOrders();
    } catch (err) {
      console.error('Failed to update item status:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: any) => {
    try {
      await api.put(`/Orders/${orderId}/status`, { status });
      fetchKitchenOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border-color)]">
        <div className="flex items-center space-x-3 gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--secondary-bg)] border border-[var(--glass-border-color)]">
            <UtensilsCrossed className="w-5 h-5 text-[var(--primary-color)]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--fg-color)]">Kitchen Display Terminal</h2>
            <p className="text-xs text-[var(--muted-fg)]">
              Active tickets: {orders.length} orders • Menu catalog: {menuItems.length} items
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 gap-2">
          <div className="flex p-1 rounded-lg bg-[var(--secondary-bg)] border border-[var(--border-color)]">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'tickets'
                  ? 'bg-[var(--primary-color)] text-white shadow-xs'
                  : 'text-[var(--muted-fg)] hover:text-[var(--fg-color)]'
              }`}
            >
              {i18n.language === 'ar' ? 'تذاكر الطلبات' : 'Kitchen Tickets'} ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'menu'
                  ? 'bg-[var(--primary-color)] text-white shadow-xs'
                  : 'text-[var(--muted-fg)] hover:text-[var(--fg-color)]'
              }`}
            >
              {i18n.language === 'ar' ? 'قائمة الوجبات' : 'Live Menu Catalog'} ({menuItems.length})
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={() => { fetchKitchenOrders(); fetchMenuItems(); }}>
            <RefreshCw className="w-4 h-4" />
            <span>{i18n.language === 'ar' ? 'تحديث' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {activeTab === 'menu' ? (
        <Card className="overflow-hidden p-0 border border-[var(--border-color)]">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--secondary-bg)]/40 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--primary-color)]" />
              <h3 className="font-bold text-sm text-[var(--fg-color)]">
                {i18n.language === 'ar' ? 'قائمة أصناف المطعم (المُدارة من المدير)' : 'Restaurant Menu Catalog (Managed by Manager)'}
              </h3>
            </div>
            <span className="text-xs text-[var(--muted-fg)]">
              {i18n.language === 'ar' ? 'يمكن للشيف تغيير حالة توفر الصنف مباشرة' : 'Chef can toggle availability if ingredient runs out'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-[var(--sidebar-bg)] border-b border-[var(--border-color)] text-[var(--muted-fg)] uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 text-start">{i18n.language === 'ar' ? 'الصنف' : 'Item Name'}</th>
                  <th className="px-4 py-3 text-start">{i18n.language === 'ar' ? 'التصنيف' : 'Category'}</th>
                  <th className="px-4 py-3 text-start">{i18n.language === 'ar' ? 'السعر' : 'Price'}</th>
                  <th className="px-4 py-3 text-start">{i18n.language === 'ar' ? 'حالة التوفر' : 'Availability'}</th>
                  <th className="px-4 py-3 text-end">{i18n.language === 'ar' ? 'تغيير الحالة' : 'Toggle Stock'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {menuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--secondary-bg)]/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[var(--fg-color)]">
                      {item.name}
                      {item.description && (
                        <p className="text-[11px] text-[var(--muted-fg)] font-normal truncate max-w-xs">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-fg)] font-medium">
                      {item.categoryName || 'General'}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-[var(--fg-color)]">
                      {formatCurrency(item.price, i18n.language)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={item.isAvailable ? 'Available' : 'OutOfService'}>
                        {item.isAvailable ? (i18n.language === 'ar' ? 'متاح' : 'Available') : (i18n.language === 'ar' ? 'غير متاح (نفذ)' : 'Unavailable (86ed)')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Button
                        variant={item.isAvailable ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleMenuItemStatus(item)}
                        className="gap-1 text-[11px]"
                      >
                        {item.isAvailable ? (
                          <>
                            <X className="w-3.5 h-3.5 text-rose-400" />
                            <span>{i18n.language === 'ar' ? 'تعطيل الصنف' : 'Mark 86ed'}</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{i18n.language === 'ar' ? 'تفعيل الصنف' : 'Make Available'}</span>
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : isLoading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-fg)]">
          {t('common.loading')}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-[var(--border-color)] rounded-xl">
          <UtensilsCrossed className="w-10 h-10 mx-auto text-[var(--muted-fg)] mb-2 opacity-50" />
          <p className="text-sm font-medium text-[var(--muted-fg)]">No pending kitchen tickets</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {orders.map((order) => (
            <Card key={order.id} className="flex flex-col justify-between border-2 border-[var(--border-color)]">
              <CardHeader className="border-b border-[var(--border-color)] pb-3 mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-black text-[var(--fg-color)]">
                      Table {order.tableNumber}
                    </CardTitle>
                    <p className="text-xs font-mono text-[var(--muted-fg)]">
                      Ticket #{order.id} • {formatDateTime(order.createdAt, i18n.language)}
                    </p>
                  </div>
                  <Badge status={order.status}>{order.status}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-[var(--secondary-bg)] border border-[var(--border-color)]/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[var(--fg-color)]">
                            {item.quantity}x
                          </span>
                          <span className="font-semibold text-sm text-[var(--fg-color)]">
                            {item.menuItemName}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-amber-400 mt-1 italic">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <Badge status={item.status}>{item.status}</Badge>
                        <div className="flex space-x-1 gap-1 mt-1">
                          {item.status === 'Submitted' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateItemStatus(order.id, item.id, 'Preparing')}
                              className="px-2 py-0.5 text-[10px]"
                            >
                              Prepare
                            </Button>
                          )}
                          {item.status === 'Preparing' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleUpdateItemStatus(order.id, item.id, 'Ready')}
                              className="px-2 py-0.5 text-[10px]"
                            >
                              Mark Ready
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[var(--border-color)] flex gap-2">
                  {order.status === 'Submitted' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order.id, 'Preparing')}
                      className="w-full"
                    >
                      Start Preparing Ticket
                    </Button>
                  )}
                  {order.status === 'Preparing' && (
                    <Button
                      variant="brand"
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order.id, 'Ready')}
                      className="w-full"
                    >
                      Ticket Complete & Ready
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
