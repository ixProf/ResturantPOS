import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed, RefreshCw } from 'lucide-react';
import api from '../services/api';
import type { OrderDetailsDto, OrderItemStatus, OrderSummaryDto } from '../types/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatDateTime } from '../utils/formatters';
import { signalRService } from '../services/signalr';

export const KitchenPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState<OrderDetailsDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchKitchenOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<OrderSummaryDto[]>('/Orders');
      // Filter orders relevant for kitchen
      const kitchenSummaries = res.data.filter(
        (o) => o.status === 'Submitted' || o.status === 'Preparing' || o.status === 'Ready'
      );
      
      // Fetch full OrderDetailsDto for each candidate ticket so order.items is fully populated
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

  useEffect(() => {
    fetchKitchenOrders();

    signalRService.startConnection().then(() => {
      signalRService.on('ReceiveOrderUpdate', (data: any) => {
        console.log('[SignalR Event] ReceiveOrderUpdate in KitchenPage:', data);
        fetchKitchenOrders();
      });
    });

    return () => {
      signalRService.off('ReceiveOrderUpdate');
    };
  }, []);

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
      <div className="flex justify-between items-center bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border-color)]">
        <div className="flex items-center space-x-3 gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--secondary-bg)] border border-[var(--glass-border-color)]">
            <UtensilsCrossed className="w-5 h-5 text-[var(--primary-color)]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--fg-color)]">Kitchen Display Terminal</h2>
            <p className="text-xs text-[var(--muted-fg)]">
              Active tickets: {orders.length} orders
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchKitchenOrders}>
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Tickets Grid */}
      {isLoading ? (
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
