import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './locales/i18n';

import { LoginPage } from './pages/LoginPage';
import { AboutPage } from './pages/AboutPage';
import { TablesPage } from './pages/TablesPage';
import { OrdersPage } from './pages/OrdersPage';
import { KitchenPage } from './pages/KitchenPage';
import { MenuManagementPage } from './pages/MenuManagementPage';
import { InventoryPage } from './pages/InventoryPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { DiscountsPage } from './pages/DiscountsPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AboutPage />} />
            <Route path="/about" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute title="Tables View" allowedRoles={['Manager', 'Waiter', 'Cashier']} />}>
              <Route path="/tables" element={<TablesPage />} />
            </Route>

            <Route element={<ProtectedRoute title="Order Management POS" allowedRoles={['Manager', 'Waiter', 'Cashier']} />}>
              <Route path="/orders" element={<OrdersPage />} />
            </Route>

            <Route element={<ProtectedRoute title="Kitchen Display System" allowedRoles={['Manager', 'Chef']} />}>
              <Route path="/kitchen" element={<KitchenPage />} />
            </Route>

            <Route element={<ProtectedRoute title="Menu & Category Management" allowedRoles={['Manager', 'Chef']} />}>
              <Route path="/menu" element={<MenuManagementPage />} />
            </Route>

            <Route element={<ProtectedRoute title="Inventory & Stock Tracking" allowedRoles={['Manager', 'InventoryManager']} />}>
              <Route path="/inventory" element={<InventoryPage />} />
            </Route>

            <Route element={<ProtectedRoute title="Payments & Receipt Checkout" allowedRoles={['Manager', 'Cashier']} />}>
              <Route path="/payments" element={<PaymentsPage />} />
            </Route>

            <Route element={<ProtectedRoute title="Discount & Promotion Management" allowedRoles={['Manager']} />}>
              <Route path="/discounts" element={<DiscountsPage />} />
            </Route>

            <Route element={<ProtectedRoute title="Executive Sales Analytics" allowedRoles={['Manager']} />}>
              <Route path="/reports" element={<ReportsPage />} />
            </Route>

            <Route element={<ProtectedRoute title="Staff & Employee Management" allowedRoles={['Manager']} />}>
              <Route path="/employees" element={<EmployeesPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/tables" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
