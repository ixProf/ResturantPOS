import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  ShoppingBag,
  UtensilsCrossed,
  BookOpen,
  Boxes,
  CreditCard,
  BarChart3,
  Tag,
  Users,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { EmployeeRole } from '../../types/api';

import logoImg from '../../assets/logo.png';

interface NavItem {
  key: string;
  path: string;
  icon: React.ReactNode;
  roles: EmployeeRole[];
}

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const navItems: NavItem[] = [
    {
      key: 'tables',
      path: '/tables',
      icon: <Grid className="w-4 h-4" />,
      roles: ['Manager', 'Waiter', 'Cashier'],
    },
    {
      key: 'orders',
      path: '/orders',
      icon: <ShoppingBag className="w-4 h-4" />,
      roles: ['Manager', 'Waiter', 'Cashier'],
    },
    {
      key: 'kitchen',
      path: '/kitchen',
      icon: <UtensilsCrossed className="w-4 h-4" />,
      roles: ['Manager', 'Chef'],
    },
    {
      key: 'menu',
      path: '/menu',
      icon: <BookOpen className="w-4 h-4" />,
      roles: ['Manager', 'Chef'],
    },
    {
      key: 'inventory',
      path: '/inventory',
      icon: <Boxes className="w-4 h-4" />,
      roles: ['Manager', 'InventoryManager'],
    },
    {
      key: 'payments',
      path: '/payments',
      icon: <CreditCard className="w-4 h-4" />,
      roles: ['Manager', 'Cashier'],
    },
    {
      key: 'reports',
      path: '/reports',
      icon: <BarChart3 className="w-4 h-4" />,
      roles: ['Manager'],
    },
    {
      key: 'discounts',
      path: '/discounts',
      icon: <Tag className="w-4 h-4" />,
      roles: ['Manager'],
    },
    {
      key: 'employees',
      path: '/employees',
      icon: <Users className="w-4 h-4" />,
      roles: ['Manager'],
    },
  ];

  const filteredNav = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <aside className="w-64 bg-[var(--sidebar-bg)] border-e border-[var(--border-color)] flex flex-col h-screen sticky top-0 z-30 transition-colors">
      {/* Brand Header with Alaris FlowX Logo */}
      <div className="px-5 py-4 flex items-center space-x-3 gap-3 border-b border-[var(--border-color)]">
        <img
          src={logoImg}
          alt={t('app.logoAlt')}
          className="w-8 h-8 object-contain shrink-0"
        />
        <div className="truncate">
          <h1 className="font-bold text-base tracking-tight brand-gradient-text truncate">
            Alaris FlowX
          </h1>
          <p className="text-[10px] uppercase font-semibold text-[var(--muted-fg)] tracking-wider truncate">
            {t('app.subtitle')}
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 gap-3 ${
                isActive
                  ? 'bg-[var(--secondary-bg)] text-[var(--fg-color)] border-s-2 border-[var(--primary-color)] shadow-xs'
                  : 'text-[var(--muted-fg)] hover:text-[var(--fg-color)] hover:bg-[var(--secondary-bg)]/50'
              }`
            }
          >
            {item.icon}
            <span>{t(`nav.${item.key}`)}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-[var(--border-color)] bg-[var(--card-bg)]/50">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="truncate me-2">
            <p className="text-xs font-medium text-[var(--fg-color)] truncate">
              {user?.fullName}
            </p>
            <p className="text-[10px] text-[var(--muted-fg)] uppercase font-semibold">
              {user?.role}
            </p>
          </div>
          <button
            onClick={logout}
            title={t('nav.logout')}
            className="p-1.5 text-[var(--muted-fg)] hover:text-[var(--destructive-color)] hover:bg-[var(--secondary-bg)] rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
