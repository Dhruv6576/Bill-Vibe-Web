import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Download,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Phone,
  User,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { Payment, PaymentMethod } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { DataTable, Column } from '../../components/common/DataTable';
import { formatINR, formatDate } from '../../utils/currency';
import { exportToCSV } from '../../utils/csvHelper';
import { useNotification } from '../../context/NotificationContext';

export const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeBusinessId } = useBusiness();
  const { showToast } = useNotification();

  const [payments, setPayments] = useState<Payment[]>(() => storageService.getPayments(activeBusinessId));
  const parties = storageService.getParties(activeBusinessId);
  const invoices = storageService.getInvoices(activeBusinessId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Form State
  const [partyId, setPartyId] = useState<string>(parties[0]?.id || '');
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [refNumber, setRefNumber] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  const reloadData = () => {
    setPayments(storageService.getPayments(activeBusinessId));
  };

  const filteredPayments = useMemo(() => {
    if (methodFilter === 'all') return payments;
    return payments.filter((p) => p.payment_method === methodFilter);
  }, [payments, methodFilter]);

  const totalCollected = useMemo(() => {
    return payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const handleRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const party = parties.find((p) => p.id === partyId);
    const invoice = invoices.find((i) => i.id === invoiceId);

    const saved = storageService.recordPayment({
      id: crypto.randomUUID(),
      business_id: activeBusinessId,
      party_id: partyId,
      party_name: party?.name || 'Customer',
      invoice_id: invoiceId || undefined,
      invoice_number: invoice?.invoice_number || undefined,
      amount,
      payment_method: method,
      reference_number: refNumber.trim(),
      payment_date: date,
      notes: notes.trim(),
      created_at: new Date().toISOString(),
    });

    showToast({
      type: 'success',
      title: 'Payment Recorded',
      message: `₹ ${amount.toLocaleString('en-IN')} received via ${method.toUpperCase()}.`,
    });

    setIsModalOpen(false);
    setAmount(0);
    setRefNumber('');
    setNotes('');
    reloadData();
  };

  const handleExportCSV = () => {
    const exportData = filteredPayments.map((p) => ({
      PaymentNumber: p.payment_number || '',
      Date: p.payment_date,
      CustomerName: p.party_name || '',
      InvoiceNumber: p.invoice_number || '',
      Amount: p.amount,
      Method: p.payment_method,
      Reference: p.reference_number || '',
      Notes: p.notes || '',
    }));
    exportToCSV(`payments_${methodFilter}_export`, exportData);
    showToast({ type: 'success', title: 'Export Complete', message: 'Payments exported to CSV.' });
  };

  const columns: Column<Payment>[] = [
    {
      key: 'payment_number',
      header: 'Receipt #',
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
            {p.payment_number || 'REC-0001'}
          </span>
          <span className="text-[10px] text-slate-400 block">{formatDate(p.payment_date)}</span>
        </div>
      ),
    },
    {
      key: 'party_name',
      header: 'Customer / Party',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{p.party_name || 'Direct Customer'}</p>
          {p.invoice_number && (
            <span
              onClick={() => p.invoice_id && navigate(`/invoices/${p.invoice_id}`)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Inv: {p.invoice_number}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'payment_method',
      header: 'Payment Mode',
      render: (p) => (
        <Badge variant="info" size="sm">
          {p.payment_method.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'reference_number',
      header: 'Ref / UTR No.',
      render: (p) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{p.reference_number || '-'}</span>,
    },
    {
      key: 'amount',
      header: 'Amount Received',
      sortable: true,
      className: 'text-right',
      render: (p) => (
        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
          {formatINR(p.amount)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
            Payments Received
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track and allocate receipts from customers across cash, UPI, cards and bank transfers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Record Payment
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Collections
          </span>
          <span className="text-2xl font-bold font-display font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
            {formatINR(totalCollected)}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Transactions
          </span>
          <span className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100 mt-1 block">
            {payments.length} Receipts
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Top Payment Channel
          </span>
          <span className="text-2xl font-bold font-display text-indigo-600 dark:text-indigo-400 mt-1 block uppercase">
            UPI / QR Code
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {['all', 'upi', 'bank_transfer', 'cash', 'card', 'cheque'].map((m) => (
          <button
            key={m}
            onClick={() => setMethodFilter(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap uppercase transition-colors ${
              methodFilter === m
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {m.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        searchPlaceholder="Search receipts by client, reference or number..."
        searchKeys={['payment_number', 'party_name', 'reference_number', 'notes']}
        emptyTitle="No payment receipts found"
        emptyDescription="Record customer payments to mark invoices as settled."
        emptyAction={
          <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Record First Payment
          </Button>
        }
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Payment Receipt"
        description="Enter payment received from customer or invoice allocation."
      >
        <form onSubmit={handleRecord} className="space-y-4">
          <Select
            label="Customer / Party"
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            options={parties.map((p) => ({
              value: p.id,
              label: `${p.name} (Balance: ${formatINR(p.current_balance)})`,
            }))}
            required
          />

          <Select
            label="Link to Specific Invoice (Optional)"
            value={invoiceId}
            onChange={(e) => {
              setInvoiceId(e.target.value);
              const inv = invoices.find((i) => i.id === e.target.value);
              if (inv) setAmount(inv.balance_due);
            }}
            options={[
              { value: '', label: '-- Unallocated / General Advance Receipt --' },
              ...invoices
                .filter((i) => i.party_id === partyId && i.balance_due > 0)
                .map((i) => ({
                  value: i.id,
                  label: `${i.invoice_number} (Due: ${formatINR(i.balance_due)})`,
                })),
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Amount Received (₹)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              autoFocus
            />
            <Select
              label="Payment Method"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              options={[
                { value: 'upi', label: 'UPI (GPay / PhonePe / Paytm)' },
                { value: 'bank_transfer', label: 'Bank Transfer (NEFT / RTGS / IMPS)' },
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Debit / Credit Card' },
                { value: 'cheque', label: 'Cheque' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Payment Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Input
              label="Transaction / Reference No."
              placeholder="e.g. UPI Ref / UTR / Cheque No."
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
            />
          </div>

          <Input
            label="Notes"
            placeholder="e.g. Full settlement for invoice"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Confirm Receipt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
