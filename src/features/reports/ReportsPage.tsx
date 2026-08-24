import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  IndianRupee,
  TrendingUp,
  Percent,
  Boxes,
  Users,
  Receipt,
  FileText,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatINR } from '../../utils/currency';
import { exportToCSV } from '../../utils/csvHelper';
import { useNotification } from '../../context/NotificationContext';

export const ReportsPage: React.FC = () => {
  const { activeBusinessId, activeBusiness } = useBusiness();
  const { showToast } = useNotification();

  const [activeReport, setActiveReport] = useState<'gstr1' | 'pnl' | 'sales' | 'purchases' | 'expenses' | 'stock'>('gstr1');
  const [timeRange, setTimeRange] = useState<'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'all'>('this_month');

  const invoices = storageService.getInvoices(activeBusinessId);
  const purchases = storageService.getPurchases(activeBusinessId);
  const expenses = storageService.getExpenses(activeBusinessId);
  const products = storageService.getProducts(activeBusinessId);
  const parties = storageService.getParties(activeBusinessId);

  // Financial aggregates
  const totalSales = invoices.filter((i) => i.status !== 'cancelled').reduce((sum, i) => sum + i.grand_total, 0);
  const totalTaxable = invoices.filter((i) => i.status !== 'cancelled').reduce((sum, i) => sum + i.taxable_amount, 0);
  const totalCGST = invoices.filter((i) => i.status !== 'cancelled').reduce((sum, i) => sum + i.cgst_amount, 0);
  const totalSGST = invoices.filter((i) => i.status !== 'cancelled').reduce((sum, i) => sum + i.sgst_amount, 0);
  const totalIGST = invoices.filter((i) => i.status !== 'cancelled').reduce((sum, i) => sum + i.igst_amount, 0);
  const totalTax = totalCGST + totalSGST + totalIGST;

  const totalPurchaseCost = purchases.reduce((sum, p) => sum + p.grand_total, 0);
  const totalExpenseCost = expenses.reduce((sum, e) => sum + e.amount, 0);

  const grossProfit = totalSales - totalPurchaseCost;
  const netProfit = totalSales - totalPurchaseCost - totalExpenseCost;

  // GSTR-1 Breakdown
  const b2bInvoices = invoices.filter((i) => i.party_gstin && i.status !== 'cancelled');
  const b2csInvoices = invoices.filter((i) => !i.party_gstin && i.status !== 'cancelled');

  const handleExportCurrentReport = () => {
    if (activeReport === 'gstr1') {
      const gstrData = invoices.map((i) => ({
        GSTIN_UIN: i.party_gstin || 'Consumer',
        ReceiverName: i.party_name,
        InvoiceNumber: i.invoice_number,
        InvoiceDate: i.invoice_date,
        InvoiceValue: i.grand_total,
        PlaceOfSupply: i.place_of_supply || '',
        ReverseCharge: 'N',
        ApplicableRate: i.is_interstate ? 'IGST' : 'CGST+SGST',
        TaxableValue: i.taxable_amount,
        CGST: i.cgst_amount,
        SGST: i.sgst_amount,
        IGST: i.igst_amount,
      }));
      exportToCSV('GSTR1_Summary_Report', gstrData);
    } else if (activeReport === 'pnl') {
      const pnlData = [
        { Particulars: 'Total Sales Revenue', Amount: totalSales },
        { Particulars: 'Cost of Goods Sold (Purchases)', Amount: -totalPurchaseCost },
        { Particulars: 'Gross Profit', Amount: grossProfit },
        { Particulars: 'Total Operational Expenses', Amount: -totalExpenseCost },
        { Particulars: 'Net Profit / (Loss)', Amount: netProfit },
      ];
      exportToCSV('Profit_and_Loss_Report', pnlData);
    } else if (activeReport === 'stock') {
      const stockData = products.map((p) => ({
        SKU: p.sku || '',
        Name: p.name,
        HSN: p.hsn_code || '',
        CurrentStock: p.current_stock,
        Unit: p.unit,
        PurchaseRate: p.purchase_price,
        SellingRate: p.selling_price,
        StockCostValue: p.current_stock * p.purchase_price,
      }));
      exportToCSV('Stock_Valuation_Report', stockData);
    }
    showToast({ type: 'success', title: 'Report Exported', message: 'CSV downloaded successfully.' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
            Reports & Tax Statements
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Indian GSTR-1 filings, Profit & Loss statements, and stock valuation summaries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCurrentReport} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export to Excel / CSV
          </Button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveReport('gstr1')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeReport === 'gstr1'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          GSTR-1 Tax Summary
        </button>
        <button
          onClick={() => setActiveReport('pnl')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeReport === 'pnl'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Profit & Loss (P&L)
        </button>
        <button
          onClick={() => setActiveReport('stock')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeReport === 'stock'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Stock Valuation
        </button>
      </div>

      {/* REPORT 1: GSTR-1 Tax Summary */}
      {activeReport === 'gstr1' && (
        <div className="space-y-6 animate-fade-in">
          {/* Tax Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Taxable Value</span>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">{formatINR(totalTaxable)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Total CGST</span>
              <p className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">{formatINR(totalCGST)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Total SGST / UTGST</span>
              <p className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">{formatINR(totalSGST)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Total IGST (Interstate)</span>
              <p className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">{formatINR(totalIGST)}</p>
            </div>
          </div>

          {/* GSTR-1 Section Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                GSTR-1 Invoice Table Breakdown
              </h3>
              <span className="text-xs text-slate-400">Total Tax Liability: <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{formatINR(totalTax)}</span></span>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[550px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                    <th className="py-3 px-3">GSTR-1 Section</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3 text-right">No. of Invoices</th>
                    <th className="py-3 px-3 text-right">Taxable Value</th>
                    <th className="py-3 px-3 text-right">Tax Liability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-3.5 px-3 font-bold font-mono text-indigo-600">Table 4A (B2B)</td>
                    <td className="py-3.5 px-3">Taxable supplies made to registered persons (with GSTIN)</td>
                    <td className="py-3.5 px-3 text-right font-semibold">{b2bInvoices.length}</td>
                    <td className="py-3.5 px-3 text-right font-mono">{formatINR(b2bInvoices.reduce((s, i) => s + i.taxable_amount, 0))}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold">{formatINR(b2bInvoices.reduce((s, i) => s + i.total_tax, 0))}</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-3 font-bold font-mono text-indigo-600">Table 7 (B2CS)</td>
                    <td className="py-3.5 px-3">Taxable supplies made to unregistered consumers / retail clients</td>
                    <td className="py-3.5 px-3 text-right font-semibold">{b2csInvoices.length}</td>
                    <td className="py-3.5 px-3 text-right font-mono">{formatINR(b2csInvoices.reduce((s, i) => s + i.taxable_amount, 0))}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold">{formatINR(b2csInvoices.reduce((s, i) => s + i.total_tax, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: Profit & Loss Statement */}
      {activeReport === 'pnl' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in max-w-3xl mx-auto">
          <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-slate-100">
              Profit & Loss Statement (P&L)
            </h2>
            <p className="text-xs text-slate-500 mt-1">{activeBusiness?.name} • Financial Year 2025-26</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <span className="font-bold uppercase tracking-wider text-slate-400 block">Operating Income</span>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Gross Sales Revenue</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatINR(totalSales)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="font-bold uppercase tracking-wider text-slate-400 block">Cost of Goods Sold (COGS)</span>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Supplier Inward Purchases</span>
                <span className="font-mono text-rose-500">-{formatINR(totalPurchaseCost)}</span>
              </div>
            </div>

            <div className="flex justify-between py-3 border-y-2 border-slate-200 dark:border-slate-700 font-bold text-sm">
              <span>Gross Profit (Margin):</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatINR(grossProfit)}</span>
            </div>

            <div className="space-y-2 pt-2">
              <span className="font-bold uppercase tracking-wider text-slate-400 block">Operating Overhead Expenses</span>
              {expenses.map((e) => (
                <div key={e.id} className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{e.title} ({e.category_name})</span>
                  <span className="font-mono">-{formatINR(e.amount)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between py-4 border-t-2 border-slate-900 dark:border-slate-100 text-base font-extrabold">
              <span>Estimated Net Profit:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatINR(netProfit)}</span>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: Stock Valuation */}
      {activeReport === 'stock' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 animate-fade-in w-full max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Inventory Valuation Summary
            </h3>
            <span className="text-xs text-slate-400">Total Products: <span className="font-bold text-slate-900 dark:text-slate-100">{products.length}</span></span>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-3">Item Name</th>
                  <th className="py-3 px-3">SKU / HSN</th>
                  <th className="py-3 px-3 text-right">In Stock</th>
                  <th className="py-3 px-3 text-right">Purchase Cost</th>
                  <th className="py-3 px-3 text-right">Selling Rate</th>
                  <th className="py-3 px-3 text-right">Total Inventory Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{p.name}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-500">{p.sku || p.hsn_code || '-'}</td>
                    <td className="py-3.5 px-3 text-right font-semibold">{p.current_stock} {p.unit}</td>
                    <td className="py-3.5 px-3 text-right font-mono">{formatINR(p.purchase_price)}</td>
                    <td className="py-3.5 px-3 text-right font-mono">{formatINR(p.selling_price)}</td>
                    <td className="py-3.5 px-3 text-right font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {formatINR(p.current_stock * p.purchase_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
