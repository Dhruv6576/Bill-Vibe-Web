import React, { useState } from 'react';
import {
  RotateCcw,
  Plus,
  FileText,
  CreditCard,
  Building2,
  Calendar,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { formatINR, formatDate } from '../../utils/currency';
import { useNotification } from '../../context/NotificationContext';

export const ReturnsPage: React.FC = () => {
  const { activeBusinessId } = useBusiness();
  const { showToast } = useNotification();

  const parties = storageService.getParties(activeBusinessId);
  const invoices = storageService.getInvoices(activeBusinessId);
  const products = storageService.getProducts(activeBusinessId);

  const [activeTab, setActiveTab] = useState<'sales_returns' | 'purchase_returns' | 'credit_notes' | 'debit_notes'>('sales_returns');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sample return records store in state
  const [salesReturns, setSalesReturns] = useState([
    {
      id: 'sr-1',
      return_number: 'SR-0001',
      date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
      customer_name: 'Rajesh Sharma (Apex Enterprises)',
      invoice_number: 'SHE-26-00001',
      amount: 4500,
      reason: 'Slight cosmetic box damage on headphones accessory',
    },
  ]);

  const [partyId, setPartyId] = useState(parties[0]?.id || '');
  const [invoiceId, setInvoiceId] = useState(invoices[0]?.id || '');
  const [returnAmount, setReturnAmount] = useState(0);
  const [reason, setReason] = useState('');

  const handleSaveReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (returnAmount <= 0) return;

    const p = parties.find((part) => part.id === partyId);
    const inv = invoices.find((i) => i.id === invoiceId);

    const newReturn = {
      id: crypto.randomUUID(),
      return_number: `SR-000${salesReturns.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      customer_name: p?.name || 'Customer',
      invoice_number: inv?.invoice_number || 'INV-001',
      amount: returnAmount,
      reason: reason.trim() || 'Customer return',
    };

    setSalesReturns([newReturn, ...salesReturns]);

    showToast({
      type: 'success',
      title: 'Sales Return Recorded',
      message: `Return ${newReturn.return_number} recorded.`,
    });

    setIsModalOpen(false);
    setReturnAmount(0);
    setReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
            Returns, Credit & Debit Notes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage customer sales returns, vendor purchase returns, and linked credit notes
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Record Sales Return
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('sales_returns')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'sales_returns'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Sales Returns ({salesReturns.length})
        </button>
        <button
          onClick={() => setActiveTab('purchase_returns')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'purchase_returns'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Purchase Returns (0)
        </button>
        <button
          onClick={() => setActiveTab('credit_notes')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'credit_notes'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Credit Notes (0)
        </button>
        <button
          onClick={() => setActiveTab('debit_notes')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'debit_notes'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Debit Notes (0)
        </button>
      </div>

      {/* Returns Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 w-full max-w-full overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-3">Return #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Invoice Ref</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3 text-right">Refund / Credit Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {salesReturns.map((sr) => (
                <tr key={sr.id}>
                  <td className="py-3.5 px-3 font-semibold font-mono text-slate-900 dark:text-slate-100">
                    {sr.return_number}
                  </td>
                  <td className="py-3.5 px-3 text-slate-500">{formatDate(sr.date)}</td>
                  <td className="py-3.5 px-3 font-medium text-slate-800 dark:text-slate-200">{sr.customer_name}</td>
                  <td className="py-3.5 px-3 font-mono text-indigo-600">{sr.invoice_number}</td>
                  <td className="py-3.5 px-3 text-slate-500">{sr.reason}</td>
                  <td className="py-3.5 px-3 text-right font-bold font-mono text-rose-500">
                    {formatINR(sr.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Return Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Customer Sales Return"
        description="Select original invoice and specify return refund amount."
      >
        <form onSubmit={handleSaveReturn} className="space-y-4">
          <Select
            label="Customer"
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            options={parties.map((p) => ({ value: p.id, label: p.name }))}
            required
          />

          <Select
            label="Linked Invoice"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            options={invoices.map((i) => ({ value: i.id, label: `${i.invoice_number} (${formatINR(i.grand_total)})` }))}
            required
          />

          <Input
            label="Refund / Credit Note Amount (₹)"
            type="number"
            value={returnAmount}
            onChange={(e) => setReturnAmount(Number(e.target.value))}
            required
            autoFocus
          />

          <Input
            label="Return Reason"
            placeholder="e.g. Defective item returned by customer"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Sales Return
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
