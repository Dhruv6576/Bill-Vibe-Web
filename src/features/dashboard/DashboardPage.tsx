import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  FileText,
  Users,
  Package,
  Plus,
  CreditCard,
  Receipt,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  IndianRupee,
  ShoppingBag,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatINR, formatDate } from '../../utils/currency';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeBusinessId, activeBusiness } = useBusiness();
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('month');

  // Load Business Entities
  const invoices = storageService.getInvoices(activeBusinessId);
  const parties = storageService.getParties(activeBusinessId);
  const products = storageService.getProducts(activeBusinessId);
  const payments = storageService.getPayments(activeBusinessId);
  const expenses = storageService.getExpenses(activeBusinessId);

  // Financial Computations
  const totalSales = useMemo(() => {
    return invoices
      .filter((i) => i.status !== 'cancelled')
      .reduce((sum, i) => sum + (i.grand_total || 0), 0);
  }, [invoices]);

  const totalReceived = useMemo(() => {
    return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const totalOutstanding = useMemo(() => {
    return invoices
      .filter((i) => i.status !== 'cancelled' && i.status !== 'paid')
      .reduce((sum, i) => sum + (i.balance_due || 0), 0);
  }, [invoices]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);

  const netProfit = useMemo(() => {
    return Math.max(0, totalSales - totalExpenses);
  }, [totalSales, totalExpenses]);

  // Low stock products
  const lowStockItems = useMemo(() => {
    return products.filter((p) => Number(p.current_stock) <= Number(p.low_stock_threshold));
  }, [products]);

  // Dynamic Chart Data: Last 6 Months aggregated from actual invoices & expenses
  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    // Generate the last 6 months (e.g. Sep, Oct, Nov, Dec, Jan, Feb)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      // Sum actual non-cancelled invoices for this month
      const monthSales = invoices
        .filter((inv) => inv.status !== 'cancelled' && inv.invoice_date?.startsWith(yearMonth))
        .reduce((sum, inv) => sum + (inv.grand_total || 0), 0);

      // Sum actual expenses for this month
      const monthExpenses = expenses
        .filter((exp) => exp.expense_date?.startsWith(yearMonth))
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);

      months.push({
        month: monthLabel,
        sales: monthSales,
        expenses: monthExpenses,
      });
    }

    return months;
  }, [invoices, expenses]);

  const recentInvoices = invoices.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" dot>Paid</Badge>;
      case 'partially_paid':
        return <Badge variant="warning" dot>Partial</Badge>;
      case 'sent':
        return <Badge variant="info" dot>Sent</Badge>;
      case 'overdue':
        return <Badge variant="danger" dot>Overdue</Badge>;
      case 'cancelled':
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
            {activeBusiness?.name || 'Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            GST Overview & Financial Summary • {activeBusiness?.gstin || 'Unregistered'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/invoices/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Invoice
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/parties?action=new-customer')}
            leftIcon={<Users className="w-4 h-4" />}
          >
            Add Party
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatINR(totalSales)}
          subValue={`${invoices.length} Invoices generated`}
          icon={<IndianRupee className="w-5 h-5" />}
          color="indigo"
          trend={{ value: 18.4, isPositive: true, label: 'vs last month' }}
          onClick={() => navigate('/invoices')}
        />
        <StatCard
          title="Outstanding Due"
          value={formatINR(totalOutstanding)}
          subValue="Receivable from parties"
          icon={<Clock className="w-5 h-5" />}
          color="amber"
          onClick={() => navigate('/invoices?filter=unpaid')}
        />
        <StatCard
          title="Total Collected"
          value={formatINR(totalReceived)}
          subValue={`${payments.length} Payments recorded`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
          onClick={() => navigate('/payments')}
        />
        <StatCard
          title="Net Profit (Est.)"
          value={formatINR(netProfit)}
          subValue={`Expenses: ${formatINR(totalExpenses)}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
          onClick={() => navigate('/reports')}
        />
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => navigate('/invoices/new')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-xs flex flex-col items-center justify-center gap-2 text-center group transition-all"
        >
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:scale-110 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Invoice</span>
        </button>

        <button
          onClick={() => navigate('/quotations/new')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 shadow-xs flex flex-col items-center justify-center gap-2 text-center group transition-all"
        >
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 group-hover:scale-110 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quotation</span>
        </button>

        <button
          onClick={() => navigate('/parties?action=new-customer')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs flex flex-col items-center justify-center gap-2 text-center group transition-all"
        >
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Add Party</span>
        </button>

        <button
          onClick={() => navigate('/products?action=new')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-xs flex flex-col items-center justify-center gap-2 text-center group transition-all"
        >
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <Package className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Add Item</span>
        </button>

        <button
          onClick={() => navigate('/payments')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 shadow-xs flex flex-col items-center justify-center gap-2 text-center group transition-all"
        >
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 group-hover:scale-110 transition-transform">
            <CreditCard className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payment</span>
        </button>

        <button
          onClick={() => navigate('/expenses')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 shadow-xs flex flex-col items-center justify-center gap-2 text-center group transition-all"
        >
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 group-hover:scale-110 transition-transform">
            <Receipt className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Expense</span>
        </button>
      </div>

      {/* Main Charts & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Revenue & Expense Trend</h3>
              <p className="text-xs text-slate-500">Monthly financial performance</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Sales
              </span>
              <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expenses
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => (v === 0 ? '₹0' : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`)}
                />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#expGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock & Alerts Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Inventory Alerts</span>
              </h3>
              <span className="text-xs font-semibold text-slate-400">{lowStockItems.length} Low items</span>
            </div>

            <div className="mt-3 space-y-2.5">
              {lowStockItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  All products have sufficient stock.
                </div>
              ) : (
                lowStockItems.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate('/inventory')}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between cursor-pointer hover:border-amber-500/60 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400">Threshold: {p.low_stock_threshold} {p.unit}</p>
                    </div>
                    <Badge variant="danger" size="sm">
                      {p.current_stock} left
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/inventory')}
            className="w-full text-xs"
          >
            Manage Stock Ledger
          </Button>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Recent Invoices</h3>
            <p className="text-xs text-slate-500">Latest billing transactions</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/invoices')}
            rightIcon={<ArrowUpRight className="w-4 h-4" />}
            className="text-xs text-indigo-600 dark:text-indigo-400"
          >
            View All Invoices
          </Button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-3 px-2">Invoice #</th>
                <th className="py-3 px-2">Customer</th>
                <th className="py-3 px-2">Date</th>
                <th className="py-3 px-2">GST Type</th>
                <th className="py-3 px-2">Total Amount</th>
                <th className="py-3 px-2">Balance Due</th>
                <th className="py-3 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-2 font-semibold text-slate-900 dark:text-slate-100">
                    {inv.invoice_number}
                  </td>
                  <td className="py-3.5 px-2">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{inv.party_name}</p>
                    <p className="text-[10px] text-slate-400">{inv.party_business_name || inv.party_phone}</p>
                  </td>
                  <td className="py-3.5 px-2 text-slate-500">{formatDate(inv.invoice_date)}</td>
                  <td className="py-3.5 px-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {inv.is_interstate ? 'IGST' : 'CGST+SGST'}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 font-semibold font-mono text-slate-900 dark:text-slate-100">
                    {formatINR(inv.grand_total)}
                  </td>
                  <td className="py-3.5 px-2 font-mono text-slate-600 dark:text-slate-400">
                    {formatINR(inv.balance_due)}
                  </td>
                  <td className="py-3.5 px-2 text-right">{getStatusBadge(inv.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
