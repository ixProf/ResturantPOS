import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { EmployeeRole } from '../../types/api';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Button } from '../ui/Button';

interface ProtectedRouteProps {
  allowedRoles?: EmployeeRole[];
  title?: string;
}

export const getDefaultRoleRoute = (role?: EmployeeRole): string => {
  switch (role) {
    case 'Chef':
      return '/kitchen';
    case 'Cashier':
      return '/payments';
    case 'InventoryManager':
      return '/inventory';
    case 'Waiter':
    case 'Manager':
    default:
      return '/tables';
  }
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, title }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultRoute = getDefaultRoleRoute(user.role);

    // If default route is different from current location, redirect to default route
    if (location.pathname !== defaultRoute) {
      return <Navigate to={defaultRoute} replace />;
    }

    // Fallback Access Denied Screen inside authenticated layout
    return (
      <div className="flex min-h-screen bg-[var(--bg-color)] text-[var(--fg-color)] transition-colors">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title={title} />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="max-w-md w-full text-center p-8 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl space-y-4">
              <div className="p-3 bg-rose-950/40 border border-rose-800/40 text-rose-300 w-fit mx-auto rounded-xl">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[var(--fg-color)]">Access Restricted</h2>
              <p className="text-xs text-[var(--muted-fg)]">
                Your role ({user.role}) does not have permission to view this screen.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(defaultRoute)}
                className="w-full mt-2"
              >
                Go to My Terminal
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-color)] text-[var(--fg-color)] transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
