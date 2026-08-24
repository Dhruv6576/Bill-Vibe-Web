import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Minus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Search,
  Package,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { Product, InventoryTransaction, InventoryTransactionType } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { formatINR, formatDate } from '../../utils/currency';
import { useNotification } from '../../context/NotificationContext';

export const InventoryPage: React.FC = () => {
  const { activeBusinessId } = useBusiness();
  const { showToast } = useNotification();

  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts(activeBusinessId));
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(() =>
    storageService.getInventoryTransactions(activeBusinessId)
  );

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [adjustType, setAdjustType] = useState<InventoryTransactionType>('adjustment_in');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  const reloadData = () => {
    setProducts(storageService.getProducts(activeBusinessId));
    setTransactions(storageService.getInventoryTransactions(activeBusinessId));
  };

  // Inventory Valuation
  const totalStockUnits = useMemo(() => {
    return products.reduce((sum, p) => sum + Number(p.current_stock || 0), 0);
  }, [products]);

  const totalCostValue = useMemo(() => {
    return products.reduce((sum, p) => sum + Number(p.current_stock || 0) * Number(p.purchase_price || 0), 0);
  }, [products]);

  const totalRetailValue = useMemo(() => {
    return products.reduce((sum, p) => sum + Number(p.current_stock || 0) * Number(p.selling_price || 0), 0);
  }, [products]);

  const lowStockItems = useMemo(() => {
    return products.filter((p) => Number(p.current_stock) <= Number(p.low_stock_threshold));
  }, [products]);

  const handleStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || adjustQty <= 0) return;

    const isNegative = adjustType === 'adjustment_out' || adjustType === 'sales_return';
    const effectiveQty = isNegative ? -adjustQty : adjustQty;

    storageService.adjustStock(
      activeBusinessId,
      selectedProductId,
      effectiveQty,
      adjustType,
      adjustNotes.trim() || 'Manual stock update'
    );

    showToast({
      type: 'success',
      title: 'Stock Updated',
      message: `Adjusted ${adjustQty} units in inventory.`,
    });

    setIsAdjustModalOpen(false);
    setAdjustQty(1);
    setAdjustNotes('');
    reloadData();
  };

  const getTxTypeBadge = (type: InventoryTransactionType) => {
    switch (type) {
      case 'purchase':
        return <Badge variant="success">Stock In (Purchase)</Badge>;
      case 'sale':
        return <Badge variant="neutral">Stock Out (Sale)</Badge>;
      case 'adjustment_in':
        return <Badge variant="info">+ Adjustment In</Badge>;
      case 'adjustment_out':
        return <Badge variant="warning">- Adjustment Out</Badge>;
      case 'sales_return':
        return <Badge variant="purple">Customer Return</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
            Stock & Inventory Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time stock valuation, item movement ledger and low-stock alerts
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setSelectedProductId(products[0]?.id || '');
            setIsAdjustModalOpen(true);
          }}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Adjust Stock
        </Button>
      </div>

      {/* Stock Valuation Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Items in Stock
          </span>
          <span className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100 mt-1 block">
            {totalStockUnits.toLocaleString('en-IN')} Units
          </span>
          <span className="text-xs text-slate-500 mt-0.5 block">{products.length} Active Catalog SKUs</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Inventory Cost Value
          </span>
          <span className="text-2xl font-bold font-display font-mono text-indigo-600 dark:text-indigo-400 mt-1 block">
            {formatINR(totalCostValue)}
          </span>
          <span className="text-xs text-slate-500 mt-0.5 block">Based on purchase prices</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Estimated Retail Value
          </span>
          <span className="text-2xl font-bold font-display font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
            {formatINR(totalRetailValue)}
          </span>
          <span className="text-xs text-slate-500 mt-0.5 block">Based on selling rates</span>
        </div>
      </div>

      {/* Low Stock Warning Alert if any */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">
              Low Stock Warnings ({lowStockItems.length} Products)
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              The following products are at or below their reorder threshold:{' '}
              <span className="font-semibold">{lowStockItems.map((p) => `${p.name} (${p.current_stock} left)`).join(', ')}</span>
            </p>
          </div>
        </div>
      )}

      {/* Inventory Movement Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Stock Movement Ledger</h3>
            <p className="text-xs text-slate-500">Chronological history of all stock additions, deductions and adjustments</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">{transactions.length} Total Logs</span>
        </div>

        <div className="w-full overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No stock transactions recorded yet. Creating invoices and purchase bills automatically updates this ledger.
            </div>
          ) : (
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-2">Date & Time</th>
                  <th className="py-3 px-2">Product Name</th>
                  <th className="py-3 px-2">Activity Type</th>
                  <th className="py-3 px-2">Qty Change</th>
                  <th className="py-3 px-2">Unit Rate</th>
                  <th className="py-3 px-2">Notes / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {transactions.map((tx) => {
                  const isPos = tx.quantity > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-2 text-slate-500">{formatDate(tx.created_at, 'long')}</td>
                      <td className="py-3.5 px-2 font-semibold text-slate-900 dark:text-slate-100">
                        {tx.product_name || 'Product'}
                      </td>
                      <td className="py-3.5 px-2">{getTxTypeBadge(tx.transaction_type)}</td>
                      <td className="py-3.5 px-2 font-mono font-bold">
                        <span className={isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isPos ? `+${tx.quantity}` : tx.quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 font-mono text-slate-600 dark:text-slate-400">
                        {formatINR(tx.unit_price)}
                      </td>
                      <td className="py-3.5 px-2 text-slate-500">{tx.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Adjust Inventory Stock"
        description="Add manual stock inflow, scrap damaged inventory, or record count corrections."
      >
        <form onSubmit={handleStockAdjustment} className="space-y-4">
          <Select
            label="Select Product"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            options={products.map((p) => ({
              value: p.id,
              label: `${p.name} (Current Stock: ${p.current_stock} ${p.unit})`,
            }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Adjustment Reason / Type"
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as InventoryTransactionType)}
              options={[
                { value: 'adjustment_in', label: 'Stock In (Stock Found / Inflow)' },
                { value: 'adjustment_out', label: 'Stock Out (Damaged / Missing / Scrap)' },
                { value: 'sales_return', label: 'Customer Return' },
                { value: 'purchase', label: 'Supplier Inflow' },
              ]}
              required
            />
            <Input
              label="Quantity to Adjust"
              type="number"
              min="1"
              value={adjustQty}
              onChange={(e) => setAdjustQty(Number(e.target.value))}
              required
            />
          </div>

          <Input
            label="Audit Notes / Reason"
            placeholder="e.g. Physical inventory count correction"
            value={adjustNotes}
            onChange={(e) => setAdjustNotes(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Apply Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
