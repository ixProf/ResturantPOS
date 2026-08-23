import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Languages, User, Bell, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { signalRService } from '../../services/signalr';
import api from '../../services/api';
import type { OrderDetailsDto } from '../../types/api';

interface HeaderProps {
  title?: string;
}

interface ToastNotification {
  id: number;
  orderId: number;
  tableNumber: number;
  tableId: number;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [readyToast, setReadyToast] = useState<ToastNotification | null>(null);

  useEffect(() => {
    if (user?.role === 'Waiter' || user?.role === 'Manager') {
      signalRService.startConnection().then(() => {
        // Dedicated OrderReadyForWaiter event listener
        signalRService.on('OrderReadyForWaiter', (data: { orderId: number; tableId: number; tableNumber: number }) => {
          console.log('[SignalR Notification] OrderReadyForWaiter received:', data);
          if (data && data.orderId) {
            setReadyToast({
              id: Date.now(),
              orderId: data.orderId,
              tableNumber: data.tableNumber,
              tableId: data.tableId,
            });
          }
        });

        // Fallback ReceiveOrderUpdate event listener
        signalRService.on('ReceiveOrderUpdate', async (data: { orderId: number; action: string; tableId?: number; tableNumber?: number }) => {
          if (data && (data.action === 'Ready' || data.action === 'OrderReady')) {
            if (data.tableId && data.tableNumber) {
              setReadyToast({
                id: Date.now(),
                orderId: data.orderId,
                tableNumber: data.tableNumber,
                tableId: data.tableId,
              });
            } else {
              try {
                const res = await api.get<OrderDetailsDto>(`/Orders/${data.orderId}`);
                setReadyToast({
                  id: Date.now(),
                  orderId: data.orderId,
                  tableNumber: res.data.tableNumber,
                  tableId: res.data.tableId,
                });
              } catch (err) {
                console.error('Failed to fetch details for ready order toast:', err);
              }
            }
          }
        });
      });
    }

    return () => {
      signalRService.off('OrderReadyForWaiter');
      signalRService.off('ReceiveOrderUpdate');
    };
  }, [user]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
  };

  return (
    <>
      <header className="h-16 px-6 bg-[var(--card-bg)]/80 backdrop-blur-md border-b border-[var(--border-color)] flex items-center justify-between sticky top-0 z-20 transition-colors">
        <h2 className="text-base font-semibold text-[var(--fg-color)] tracking-tight">
          {title || t('app.title')}
        </h2>

        <div className="flex items-center space-x-3 gap-2">
          {/* Language Switcher Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="px-2.5 py-1 text-xs gap-1.5 font-medium"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{i18n.language === 'ar' ? 'English (LTR)' : 'العربية (RTL)'}</span>
          </Button>

          {/* Dark/Light Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
            className="p-2"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </Button>

          {/* User Pill */}
          <div className="flex items-center space-x-2 gap-2 ps-3 border-s border-[var(--border-color)]">
            <div className="w-8 h-8 rounded-full bg-[var(--secondary-bg)] border border-[var(--glass-border-color)] flex items-center justify-center text-[var(--muted-fg)]">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-start">
              <p className="text-xs font-semibold text-[var(--fg-color)] leading-none">{user?.fullName}</p>
              <p className="text-[10px] text-[var(--muted-fg)] uppercase tracking-wider leading-tight mt-0.5">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Real-time Ready Order Notification Toast */}
      {readyToast && (
        <div className="fixed bottom-6 end-6 z-50 p-4 bg-emerald-950/95 border border-emerald-500/60 text-white rounded-2xl shadow-2xl flex items-center space-x-4 gap-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="p-2.5 rounded-xl bg-emerald-800/60 text-emerald-300 border border-emerald-600/40">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Kitchen Order Ready</span>
            </div>
            <p className="text-sm font-extrabold text-white mt-0.5">
              Order #{readyToast.orderId} (Table #{readyToast.tableNumber}) is ready to be served!
            </p>
          </div>
          <div className="flex items-center space-x-2 gap-2 ps-2">
            <Button
              variant="brand"
              size="sm"
              onClick={() => {
                navigate(`/orders?tableId=${readyToast.tableId}`);
                setReadyToast(null);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              View Order
            </Button>
            <button
              onClick={() => setReadyToast(null)}
              className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
