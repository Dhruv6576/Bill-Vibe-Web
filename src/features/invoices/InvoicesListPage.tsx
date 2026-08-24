import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Download,
  Share2,
  CreditCard,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  Ban,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { Invoice, InvoiceStatus } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, Column } from '../../components/common/DataTable';
import { formatINR, formatDate } from '../../utils/currency';
import { exportToCSV } from '../../utils/csvHelper';
import { useNotification } from '../../context/NotificationContext';

export const InvoicesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeBusinessId } = useBusiness();
  const { showToast } = useNotification();

  const [invoices, setInvoices] = useState<Invoice[]>(() => storageService.getInvoices(activeBusinessId));
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('filter') || 'all');

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'all') return invoices;
    if (statusFilter === 'unpaid') {
      return invoices.filter((i) => i.status === 'sent' || i.status === 'partially_paid' || i.status === 'overdue');
    }
    return invoices.filter((i) => i.status === statusFilter);
  }, [invoices, statusFilter]);

  const handleExportCSV = () => {
    const exportData = filteredInvoices.map((i) => ({
      InvoiceNumber: i.invoice_number,
      Date: i.invoice_date,
      DueDate: i.due_date,
      CustomerName: i.party_name,
      CustomerGSTIN: i.party_gstin || '',
      PlaceOfSupply: i.place_of_supply || '',
      TaxableAmount: i.taxable_amount,
      TotalTax: i.total_tax,
      GrandTotal: i.grand_total,
      AmountPaid: i.amount_paid,
      BalanceDue: i.balance_due,
      Status: i.status,
    }));
    exportToCSV(`invoices_${statusFilter}_export`, exportData);
    showToast({ type: 'success', title: 'Export Complete', message: 'Invoices exported to CSV.' });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
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

  const columns: Column<Invoice>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice #',
      sortable: true,
      render: (i) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
            {i.invoice_number}
          </span>
          <span className="text-[10px] text-slate-400 block">{formatDate(i.invoice_date)}</span>
        </div>
      ),
    },
    {
      key: 'party_name',
      header: 'Customer',
      sortable: true,
      render: (i) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{i.party_name}</p>
          <p className="text-xs text-slate-400 truncate max-w-xs">{i.party_business_name || i.party_phone || '-'}</p>
        </div>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (i) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">{formatDate(i.due_date)}</span>
      ),
    },
    {
      key: 'grand_total',
      header: 'Amount',
      sortable: true,
      render: (i) => (
        <div>
          <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatINR(i.grand_total)}
          </span>
          {i.balance_due > 0 ? (
            <span className="text-[10px] text-rose-500 font-mono block">
              Due: {formatINR(i.balance_due)}
            </span>
          ) : (
            <span className="text-[10px] text-emerald-600 block">Fully Paid</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => getStatusBadge(i.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (i) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/invoices/${i.id}`)}
            className="p-1.5 h-7 text-indigo-600"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
            Invoices
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create, track and manage your Indian GST compliant tax invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export
          </Button>
          <Button size="sm" onClick={() => navigate('/invoices/new')} leftIcon={<Plus className="w-4 h-4" />}>
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setStatusFilter('unpaid')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === 'unpaid'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Unpaid ({invoices.filter((i) => i.balance_due > 0 && i.status !== 'cancelled').length})
        </button>
        <button
          onClick={() => setStatusFilter('paid')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === 'paid'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Paid ({invoices.filter((i) => i.status === 'paid').length})
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === 'draft'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Drafts ({invoices.filter((i) => i.status === 'draft').length})
        </button>
      </div>

      {/* Invoices DataTable */}
      <DataTable
        columns={columns}
        data={filteredInvoices}
        searchPlaceholder="Search by invoice #, customer name, phone..."
        searchKeys={['invoice_number', 'party_name', 'party_business_name', 'party_phone']}
        onRowClick={(i) => navigate(`/invoices/${i.id}`)}
        emptyTitle="No invoices created yet"
        emptyDescription="Start creating professional GST invoices and receive fast UPI payments."
        emptyAction={
          <Button size="sm" onClick={() => navigate('/invoices/new')} leftIcon={<Plus className="w-4 h-4" />}>
            Create First Invoice
          </Button>
        }
      />
    </div>
  );
};
