import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  ShoppingCart,
  Award,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  CreditCard,
  Receipt,
} from 'lucide-react';
import api from '../services/api';
import type { SalesReportDto, TopSellingItemDto } from '../types/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { signalRService } from '../services/signalr';

export const ReportsPage: React.FC = () => {
  const { i18n } = useTranslation();

  const [dateRangePreset, setDateRangePreset] = useState<'today' | 'week' | 'month' | 'custom'>('month');

  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);

  const [report, setReport] = useState<SalesReportDto | null>(null);
  const [topItems, setTopItems] = useState<TopSellingItemDto[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const applyPreset = (preset: 'today' | 'week' | 'month') => {
    setDateRangePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    setTo(todayStr);

    if (preset === 'today') {
      setFrom(todayStr);
    } else if (preset === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setFrom(d.toISOString().split('T')[0]);
    } else if (preset === 'month') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setFrom(d.toISOString().split('T')[0]);
    }
  };

  const fetchReports = async () => {
    try {
      const [salesRes, topRes] = await Promise.all([
        api.get<SalesReportDto>(`/Reports/sales?from=${from}&to=${to}`),
        api.get<TopSellingItemDto[]>(`/Reports/top-selling?from=${from}&to=${to}&topN=10`),
      ]);
      setReport(salesRes.data);
      setTopItems(topRes.data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  useEffect(() => {
    fetchReports();

    signalRService.startConnection().then(() => {
      signalRService.on('SalesUpdated', (data: { orderId: number; paymentId: number; amount: number }) => {
        console.log('[SignalR] SalesUpdated event received on ReportsPage -> Refreshing analytics:', data);
        fetchReports();
      });

      signalRService.on('ReceiveOrderUpdate', (data: { action: string }) => {
        if (data && data.action === 'PaymentCompleted') {
          console.log('[SignalR] PaymentCompleted event received on ReportsPage -> Refreshing analytics');
          fetchReports();
        }
      });
    });

    return () => {
      signalRService.off('SalesUpdated');
      signalRService.off('ReceiveOrderUpdate');
    };
  }, [from, to]);

  const handleExport = async (type: 'pdf' | 'excel', lang: 'ar' | 'en') => {
    setIsExporting(true);
    try {
      const res = await api.get(`/Reports/sales/export/${type}?from=${from}&to=${to}&language=${lang}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type:
          type === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Alaris_Sales_Report_${from}_${to}_${lang}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export report:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar with Presets & Date Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-[var(--card-bg)] p-4 sm:p-5 rounded-2xl border border-[var(--border-color)]">
        <div className="flex items-center space-x-3 gap-3">
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 text-[#5E6AD2] shrink-0">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[var(--fg-color)] tracking-tight">Executive Sales Analytics</h2>
            <p className="text-xs text-[var(--muted-fg)] mt-0.5">
              Real-time revenue metrics from {from} to {to}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto">
          {/* Preset Buttons */}
          <div className="flex items-center bg-[var(--secondary-bg)] p-1 rounded-xl border border-[var(--border-color)] justify-between sm:justify-start">
            <button
              onClick={() => applyPreset('today')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-colors text-center ${
                dateRangePreset === 'today'
                  ? 'bg-[var(--fg-color)] text-[var(--bg-color)]'
                  : 'text-[var(--muted-fg)] hover:text-[var(--fg-color)]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => applyPreset('week')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-colors text-center ${
                dateRangePreset === 'week'
                  ? 'bg-[var(--fg-color)] text-[var(--bg-color)]'
                  : 'text-[var(--muted-fg)] hover:text-[var(--fg-color)]'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => applyPreset('month')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-colors text-center ${
                dateRangePreset === 'month'
                  ? 'bg-[var(--fg-color)] text-[var(--bg-color)]'
                  : 'text-[var(--muted-fg)] hover:text-[var(--fg-color)]'
              }`}
            >
              This Month
            </button>
          </div>

          {/* Date Picker Range */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-36">
              <Input
                type="date"
                value={from}
                onChange={(e) => {
                  setDateRangePreset('custom');
                  setFrom(e.target.value);
                }}
              />
            </div>
            <span className="text-xs text-[var(--muted-fg)]">to</span>
            <div className="flex-1 sm:w-36">
              <Input
                type="date"
                value={to}
                onChange={(e) => {
                  setDateRangePreset('custom');
                  setTo(e.target.value);
                }}
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchReports} className="shrink-0">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Export Engines Dropdowns */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf', 'ar')}
              disabled={isExporting}
              className="text-xs gap-1.5 justify-center"
            >
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span>PDF (عربي)</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf', 'en')}
              disabled={isExporting}
              className="text-xs gap-1.5 justify-center"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>PDF (EN)</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel', 'ar')}
              disabled={isExporting}
              className="text-xs gap-1.5 justify-center"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel (عربي)</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel', 'en')}
              disabled={isExporting}
              className="text-xs gap-1.5 justify-center"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Excel (EN)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Summary KPI Metrics Cards (7 Cards Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-3">
        <Card className="p-3.5 border border-[var(--border-color)]">
          <span className="text-[10px] font-extrabold text-[var(--muted-fg)] uppercase tracking-wider">
            Gross Sales
          </span>
          <h3 className="text-lg font-black text-[var(--fg-color)] mt-1">
            {formatCurrency(report?.grossSales || 0, i18n.language)}
          </h3>
          <p className="text-[10px] text-[var(--muted-fg)] mt-0.5">Total before deductions</p>
        </Card>

        <Card className="p-3.5 border border-[var(--border-color)]">
          <span className="text-[10px] font-extrabold text-[var(--muted-fg)] uppercase tracking-wider">
            Discounts & Refunds
          </span>
          <h3 className="text-lg font-black text-amber-400 mt-1">
            -{formatCurrency((report?.discounts || 0) + (report?.refunds || 0), i18n.language)}
          </h3>
          <p className="text-[10px] text-[var(--muted-fg)] mt-0.5">Discounts and refunds</p>
        </Card>

        <Card className="p-3.5 border border-[#5E6AD2]/40 bg-[#5E6AD2]/5">
          <span className="text-[10px] font-extrabold text-[#5E6AD2] uppercase tracking-wider">
            Net Revenue
          </span>
          <h3 className="text-lg font-black text-[#5E6AD2] mt-1">
            {formatCurrency(report?.netRevenue || 0, i18n.language)}
          </h3>
          <p className="text-[10px] text-[var(--muted-fg)] mt-0.5">Net sales collected</p>
        </Card>

        <Card className="p-3.5 border border-rose-900/40 bg-rose-950/10">
          <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider">
            Total Expenses
          </span>
          <h3 className="text-lg font-black text-rose-400 mt-1">
            -{formatCurrency(report?.totalExpenses || 0, i18n.language)}
          </h3>
          <p className="text-[10px] text-[var(--muted-fg)] mt-0.5">Purchases & costs</p>
        </Card>

        <Card className={`p-3.5 border ${
          (report?.netProfit || 0) >= 0 ? 'border-emerald-900/40 bg-emerald-950/10' : 'border-rose-900/40 bg-rose-950/10'
        }`}>
          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
            (report?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            Net Profit
          </span>
          <h3 className={`text-lg font-black mt-1 ${
            (report?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {formatCurrency(report?.netProfit || 0, i18n.language)}
          </h3>
          <p className="text-[10px] text-[var(--muted-fg)] mt-0.5">Net Revenue - Expenses</p>
        </Card>

        <Card className="p-3.5 border border-[var(--border-color)]">
          <span className="text-[10px] font-extrabold text-[var(--muted-fg)] uppercase tracking-wider">
            Completed Orders
          </span>
          <h3 className="text-lg font-black text-[var(--fg-color)] mt-1">
            {formatNumber(report?.completedOrdersCount || 0, i18n.language)}
          </h3>
          <p className="text-[10px] text-[var(--muted-fg)] mt-0.5">Paid ticket count</p>
        </Card>

        <Card className="p-3.5 border border-[var(--border-color)]">
          <span className="text-[10px] font-extrabold text-[var(--muted-fg)] uppercase tracking-wider">
            Avg Order Value
          </span>
          <h3 className="text-lg font-black text-[var(--fg-color)] mt-1">
            {formatCurrency(report?.averageOrderValue || 0, i18n.language)}
          </h3>
          <p className="text-[10px] text-[var(--muted-fg)] mt-0.5">Average ticket size</p>
        </Card>
      </div>

      {/* Grid for Expense Breakdown, Payment Methods & Top Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Expense Breakdown */}
        <Card className="lg:col-span-4 p-0 overflow-hidden border border-[var(--border-color)]">
          <CardHeader className="p-4 border-b border-[var(--border-color)]">
            <CardTitle className="text-sm font-bold text-[var(--fg-color)] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-400" />
              <span>Expense Breakdown</span>
            </CardTitle>
          </CardHeader>
          <div className="p-4 space-y-3">
            {report?.expenseBreakdown && report.expenseBreakdown.length > 0 ? (
              report.expenseBreakdown.map((exp) => (
                <div
                  key={exp.category}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--secondary-bg)]/60 border border-[var(--border-color)]"
                >
                  <div>
                    <p className="text-xs font-bold text-[var(--fg-color)]">{exp.category}</p>
                    <p className="text-[10px] text-[var(--muted-fg)]">{exp.recordCount} entries</p>
                  </div>
                  <span className="font-mono font-black text-sm text-rose-400">
                    -{formatCurrency(exp.amount, i18n.language)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--muted-fg)] text-center py-6">No expenses recorded for this period.</p>
            )}
          </div>
        </Card>

        {/* Payment Methods Breakdown */}
        <Card className="lg:col-span-4 p-0 overflow-hidden border border-[var(--border-color)]">
          <CardHeader className="p-4 border-b border-[var(--border-color)]">
            <CardTitle className="text-sm font-bold text-[var(--fg-color)] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#5E6AD2]" />
              <span>Sales by Payment Method</span>
            </CardTitle>
          </CardHeader>
          <div className="p-4 space-y-3">
            {report?.paymentMethodBreakdown && report.paymentMethodBreakdown.length > 0 ? (
              report.paymentMethodBreakdown.map((pm) => (
                <div
                  key={pm.paymentMethod}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--secondary-bg)]/60 border border-[var(--border-color)]"
                >
                  <div>
                    <p className="text-xs font-bold text-[var(--fg-color)]">{pm.paymentMethodName}</p>
                    <p className="text-[10px] text-[var(--muted-fg)]">{pm.transactionCount} transactions</p>
                  </div>
                  <span className="font-mono font-black text-sm text-[var(--fg-color)]">
                    {formatCurrency(pm.amount, i18n.language)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--muted-fg)] text-center py-6">No payment records found.</p>
            )}
          </div>
        </Card>

        {/* Top Best Selling Items */}
        <Card className="lg:col-span-4 p-0 overflow-hidden border border-[var(--border-color)]">
          <CardHeader className="p-4 border-b border-[var(--border-color)]">
            <CardTitle className="text-sm font-bold text-[var(--fg-color)] flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Top 10 Best Selling Menu Items</span>
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-[var(--sidebar-bg)] border-b border-[var(--border-color)] text-[var(--muted-fg)] uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 text-start">Rank</th>
                  <th className="px-4 py-3 text-start">Menu Item Name</th>
                  <th className="px-4 py-3 text-start">Units Sold</th>
                  <th className="px-4 py-3 text-end">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {topItems.map((item, idx) => (
                  <tr key={item.menuItemId || idx} className="hover:bg-[var(--secondary-bg)]/40">
                    <td className="px-4 py-3 font-mono font-bold text-[var(--muted-fg)]">#{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--fg-color)]">
                      {item.menuItemName || item.itemName}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-[var(--fg-color)]">
                      {formatNumber(item.totalQuantitySold || item.quantitySold, i18n.language)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-end text-[var(--fg-color)]">
                      {formatCurrency(item.totalRevenue, i18n.language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Completed Orders Sales Log */}
      <Card className="p-0 overflow-hidden border border-[var(--border-color)]">
        <CardHeader className="p-4 border-b border-[var(--border-color)]">
          <CardTitle className="text-sm font-bold text-[var(--fg-color)] flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-indigo-400" />
            <span>Completed Orders Audit Log ({report?.orderDetails?.length || 0})</span>
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-[var(--sidebar-bg)] border-b border-[var(--border-color)] text-[var(--muted-fg)] uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 text-start">Order ID</th>
                <th className="px-4 py-3 text-start">Table #</th>
                <th className="px-4 py-3 text-start">Waiter</th>
                <th className="px-4 py-3 text-start">Gross</th>
                <th className="px-4 py-3 text-start">Discount</th>
                <th className="px-4 py-3 text-start">Final Net</th>
                <th className="px-4 py-3 text-start">Payment Method</th>
                <th className="px-4 py-3 text-end">Completed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {report?.orderDetails && report.orderDetails.length > 0 ? (
                report.orderDetails.map((ord) => (
                  <tr key={ord.orderId} className="hover:bg-[var(--secondary-bg)]/40">
                    <td className="px-4 py-3 font-mono font-bold text-[#5E6AD2]">#{ord.orderId}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--fg-color)]">Table {ord.tableNumber}</td>
                    <td className="px-4 py-3 text-[var(--muted-fg)]">{ord.waiterName}</td>
                    <td className="px-4 py-3 font-mono text-[var(--fg-color)]">
                      {formatCurrency(ord.grossAmount, i18n.language)}
                    </td>
                    <td className="px-4 py-3 font-mono text-amber-400">
                      -{formatCurrency(ord.discountAmount, i18n.language)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      {formatCurrency(ord.finalAmount, i18n.language)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--fg-color)]">{ord.paymentMethod}</td>
                    <td className="px-4 py-3 font-mono text-end text-[var(--muted-fg)]">
                      {new Date(ord.completedAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[var(--muted-fg)]">
                    No completed orders found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
