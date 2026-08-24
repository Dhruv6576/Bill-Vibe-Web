import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Download,
  Calendar,
  IndianRupee,
  Boxes,
  CheckCircle2,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { Purchase, PurchaseItem, PurchaseStatus } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { DataTable, Column } from '../../components/common/DataTable';
import { formatINR, formatDate } from '../../utils/currency';
import { exportToCSV } from '../../utils/csvHelper';
import { useNotification } from '../../context/NotificationContext';

export const PurchasesPage: React.FC = () => {
  const { activeBusinessId } = useBusiness();
  const { showToast } = useNotification();

  const [purchases, setPurchases] = useState<Purchase[]>(() => storageService.getPurchases(activeBusinessId));
  const suppliers = storageService.getParties(activeBusinessId).filter((p) => p.type === 'supplier' || p.type === 'both');
  const products = storageService.getProducts(activeBusinessId);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [billNumber, setBillNumber] = useState<string>('');
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<PurchaseStatus>('received');
  const [notes, setNotes] = useState<string>('');

  const [items, setItems] = useState<PurchaseItem[]>([
    {
      product_id: products[0]?.id || '',
      name: products[0]?.name || 'Standard Inventory Item',
      hsn_code: products[0]?.hsn_code || '85171200',
      quantity: 5,
      unit: products[0]?.unit || 'PCS',
      purchase_rate: products[0]?.purchase_price || 10000,
      gst_rate: products[0]?.gst_rate || 18,
      tax_amount: 0,
      total: 0,
    },
  ]);

  const reloadData = () => {
    setPurchases(storageService.getPurchases(activeBusinessId));
  };

  const computedItems = useMemo(() => {
    return items.map((item) => {
      const taxable = item.quantity * item.purchase_rate;
      const tax = (taxable * item.gst_rate) / 100;
      return {
        ...item,
        tax_amount: tax,
        total: taxable + tax,
      };
    });
  }, [items]);

  const grandTotal = useMemo(() => {
    return computedItems.reduce((sum, i) => sum + i.total, 0);
  }, [computedItems]);

  const subtotal = useMemo(() => {
    return computedItems.reduce((sum, i) => sum + i.quantity * i.purchase_rate, 0);
  }, [computedItems]);

  const totalTax = useMemo(() => {
    return computedItems.reduce((sum, i) => sum + i.tax_amount, 0);
  }, [computedItems]);

  const totalPurchasesAmount = useMemo(() => {
    return purchases.reduce((sum, p) => sum + Number(p.grand_total || 0), 0);
  }, [purchases]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_id: products[0]?.id || '',
        name: products[0]?.name || '',
        hsn_code: products[0]?.hsn_code || '',
        quantity: 1,
        unit: 'PCS',
        purchase_rate: 0,
        gst_rate: 18,
        tax_amount: 0,
        total: 0,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof PurchaseItem, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSelectProduct = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        product_id: prod.id,
        name: prod.name,
        hsn_code: prod.hsn_code || '',
        unit: prod.unit,
        purchase_rate: prod.purchase_price,
        gst_rate: prod.gst_rate,
      };
      return copy;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billNumber.trim() || grandTotal <= 0) return;

    const sup = suppliers.find((s) => s.id === supplierId);

    const saved = storageService.savePurchase({
      id: crypto.randomUUID(),
      business_id: activeBusinessId,
      supplier_id: supplierId,
      supplier_name: sup?.name || 'Supplier',
      supplier_gstin: sup?.gstin || '',
      bill_number: billNumber.trim(),
      bill_date: billDate,
      status,
      subtotal,
      total_tax: totalTax,
      grand_total: grandTotal,
      amount_paid: 0,
      balance_due: grandTotal,
      notes: notes.trim(),
      items: computedItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    showToast({
      type: 'success',
      title: 'Purchase Recorded',
      message: `Bill ${billNumber} recorded. Inventory stock increased.`,
    });

    setIsModalOpen(false);
    setBillNumber('');
    setNotes('');
    reloadData();
  };

  const handleExportCSV = () => {
    const exportData = purchases.map((p) => ({
      BillNumber: p.bill_number,
      Date: p.bill_date,
      SupplierName: p.supplier_name,
      SupplierGSTIN: p.supplier_gstin || '',
      GrandTotal: p.grand_total,
      Status: p.status,
    }));
    exportToCSV('purchases_ledger_export', exportData);
    showToast({ type: 'success', title: 'Export Complete', message: 'Purchase bills exported to CSV.' });
  };

  const columns: Column<Purchase>[] = [
    {
      key: 'bill_number',
      header: 'Bill / Invoice #',
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
            {p.bill_number}
          </span>
          <span className="text-[10px] text-slate-400 block">{formatDate(p.bill_date)}</span>
        </div>
      ),
    },
    {
      key: 'supplier_name',
      header: 'Supplier Name',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{p.supplier_name}</p>
          {p.supplier_gstin && <p className="text-[10px] font-mono text-slate-400">GST: {p.supplier_gstin}</p>}
        </div>
      ),
    },
    {
      key: 'items_count',
      header: 'Items Inwarded',
      render: (p) => <span className="text-xs text-slate-600 dark:text-slate-400">{p.items.length} Line items</span>,
    },
    {
      key: 'grand_total',
      header: 'Bill Amount',
      sortable: true,
      className: 'text-right',
      render: (p) => (
        <span className="font-bold font-mono text-slate-900 dark:text-slate-100 text-sm">
          {formatINR(p.grand_total)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <Badge variant="success">{p.status.toUpperCase()}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
            Supplier Purchases
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log supplier purchase bills and automatically increase inventory quantities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Record Purchase Bill
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Purchase Inflow
          </span>
          <span className="text-2xl font-bold font-display font-mono text-slate-900 dark:text-slate-100 mt-1 block">
            {formatINR(totalPurchasesAmount)}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Purchase Bills
          </span>
          <span className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100 mt-1 block">
            {purchases.length} Inward Bills
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Active Suppliers
          </span>
          <span className="text-2xl font-bold font-display text-indigo-600 dark:text-indigo-400 mt-1 block">
            {suppliers.length} Vendors
          </span>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={purchases}
        searchPlaceholder="Search purchases by bill #, supplier..."
        searchKeys={['bill_number', 'supplier_name', 'supplier_gstin']}
        emptyTitle="No purchases recorded yet"
        emptyDescription="Record supplier bills to auto-increment product stock levels."
        emptyAction={
          <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Record First Purchase
          </Button>
        }
      />

      {/* Record Purchase Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Supplier Purchase Bill"
        description="Enter supplier invoice details. Line items will automatically increment inventory stock."
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Supplier Vendor"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              options={suppliers.map((s) => ({
                value: s.id,
                label: `${s.name} ${s.business_name ? `(${s.business_name})` : ''}`,
              }))}
              required
            />
            <Input
              label="Supplier Bill / Invoice #"
              placeholder="e.g. SAM-PUR-901"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Bill Date"
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase">Items Inwarded</span>
              <Button size="sm" variant="outline" onClick={handleAddItem} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Item
              </Button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 space-y-2">
                {products.length > 0 && (
                  <Select
                    label="Catalog Product"
                    value={item.product_id || ''}
                    onChange={(e) => handleSelectProduct(idx, e.target.value)}
                    options={products.map((p) => ({
                      value: p.id,
                      label: `${p.name} (Stock: ${p.current_stock})`,
                    }))}
                  />
                )}
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Quantity"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                    required
                  />
                  <Input
                    label="Purchase Price (₹)"
                    type="number"
                    value={item.purchase_rate}
                    onChange={(e) => handleUpdateItem(idx, 'purchase_rate', Number(e.target.value))}
                    required
                  />
                  <Select
                    label="GST Rate"
                    value={item.gst_rate}
                    onChange={(e) => handleUpdateItem(idx, 'gst_rate', Number(e.target.value))}
                    options={[
                      { value: 0, label: '0%' },
                      { value: 5, label: '5%' },
                      { value: 12, label: '12%' },
                      { value: 18, label: '18%' },
                      { value: 28, label: '28%' },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
            <span className="text-xs font-bold">Total Inward Bill (incl. GST):</span>
            <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {formatINR(grandTotal)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Purchase Bill
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
