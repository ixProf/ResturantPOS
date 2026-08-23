import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Languages, User, Bell, X, CheckCircle2, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { signalRService } from '../../services/signalr';
import api from '../../services/api';
import type { OrderDetailsDto } from '../../types/api';

interface HeaderProps {
  title?: string;
  onToggleMobileMenu?: () => void;
}

interface ToastNotification {
  id: number;
  orderId: number;
  tableNumber: number;
  tableId: number;
}

export const Header: React.FC<HeaderProps> = ({ title, onToggleMobileMenu }) => {
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
      <header className="h-16 px-3 sm:px-6 bg-[var(--card-bg)]/80 backdrop-blur-md border-b border-[var(--border-color)] flex items-center justify-between sticky top-0 z-20 transition-colors">
        <div className="flex items-center space-x-2 gap-2 truncate me-2">
          {/* Mobile Hamburger Menu Button */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 text-[var(--muted-fg)] hover:text-[var(--fg-color)] hover:bg-[var(--secondary-bg)] rounded-lg transition-colors"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-sm sm:text-base font-semibold text-[var(--fg-color)] tracking-tight truncate">
            {title || t('app.title')}
          </h2>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 gap-1.5 sm:gap-2 shrink-0">
          {/* Language Switcher Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="px-2 py-1 text-xs gap-1 font-medium"
          >
            <Languages className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{i18n.language === 'ar' ? 'EN' : 'عربي'}</span>
            <span className="xs:hidden">{i18n.language === 'ar' ? 'EN' : 'ع'}</span>
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
          <div className="flex items-center space-x-2 gap-2 ps-2 sm:ps-3 border-s border-[var(--border-color)]">
            <div className="w-8 h-8 rounded-full bg-[var(--secondary-bg)] border border-[var(--glass-border-color)] flex items-center justify-center text-[var(--muted-fg)] shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden md:block text-start">
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
        <div className="fixed inset-x-3 bottom-3 sm:inset-auto sm:bottom-6 sm:end-6 z-50 p-3.5 sm:p-4 bg-emerald-950/95 border border-emerald-500/60 text-white rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-800/60 text-emerald-300 border border-emerald-600/40 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Order Ready</span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-white truncate mt-0.5">
                Order #{readyToast.orderId} (Table #{readyToast.tableNumber})
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 gap-1.5 shrink-0">
            <Button
              variant="brand"
              size="sm"
              onClick={() => {
                navigate(`/orders?tableId=${readyToast.tableId}`);
                setReadyToast(null);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1"
            >
              View
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
