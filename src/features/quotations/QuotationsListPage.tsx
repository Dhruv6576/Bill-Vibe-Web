import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  ArrowRight,
  Eye,
  CheckCircle2,
  Sparkles,
  Download,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { Quotation, QuotationStatus } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, Column } from '../../components/common/DataTable';
import { formatINR, formatDate } from '../../utils/currency';
import { exportToCSV } from '../../utils/csvHelper';
import { useNotification } from '../../context/NotificationContext';

export const QuotationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeBusinessId } = useBusiness();
  const { showToast } = useNotification();

  const [quotations, setQuotations] = useState<Quotation[]>(() => storageService.getQuotations(activeBusinessId));
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const reloadData = () => {
    setQuotations(storageService.getQuotations(activeBusinessId));
  };

  const filteredQuotations = useMemo(() => {
    if (statusFilter === 'all') return quotations;
    return quotations.filter((q) => q.status === statusFilter);
  }, [quotations, statusFilter]);

  const handleConvertToInvoice = (q: Quotation) => {
    // Generate invoice from quotation
    const invNumber = storageService.getNextInvoiceNumber(activeBusinessId);
    const newInvoice = storageService.saveInvoice({
      id: crypto.randomUUID(),
      business_id: activeBusinessId,
      party_id: q.party_id,
      invoice_number: invNumber,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'sent',
      party_name: q.party_name,
      party_business_name: q.party_business_name,
      party_gstin: q.party_gstin,
      party_phone: q.party_phone,
      party_email: q.party_email,
      party_address: q.party_address,
      party_state: q.party_state,
      party_state_code: q.party_state_code,
      place_of_supply: `${q.party_state || 'Gujarat'} (${q.party_state_code || '24'})`,
      is_interstate: false,
      subtotal: q.subtotal,
      discount_type: 'fixed',
      discount_value: q.discount_amount,
      discount_amount: q.discount_amount,
      taxable_amount: q.taxable_amount,
      cgst_amount: q.cgst_amount,
      sgst_amount: q.sgst_amount,
      igst_amount: q.igst_amount,
      cess_amount: q.cess_amount,
      total_tax: q.total_tax,
      shipping_charges: 0,
      round_off: 0,
      grand_total: q.grand_total,
      amount_paid: 0,
      balance_due: q.grand_total,
      notes: q.notes,
      terms_conditions: q.terms_conditions,
      template_id: 'modern',
      quotation_id: q.id,
      items: q.items.map((item) => ({
        ...item,
        cess_amount: 0,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Mark quotation as converted
    q.status = 'converted';
    q.converted_to_invoice_id = newInvoice.id;
    storageService.saveQuotation(q);

    showToast({
      type: 'success',
      title: 'Quotation Converted!',
      message: `Invoice ${invNumber} generated from quotation.`,
    });

    navigate(`/invoices/${newInvoice.id}`);
  };

  const handleExportCSV = () => {
    const exportData = filteredQuotations.map((q) => ({
      QuotationNumber: q.quotation_number,
      Date: q.quotation_date,
      ExpiryDate: q.expiry_date,
      CustomerName: q.party_name,
      GrandTotal: q.grand_total,
      Status: q.status,
    }));
    exportToCSV(`quotations_${statusFilter}_export`, exportData);
    showToast({ type: 'success', title: 'Export Complete', message: 'Quotations exported to CSV.' });
  };

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="success">Accepted</Badge>;
      case 'converted':
        return <Badge variant="purple">Converted to Invoice</Badge>;
      case 'sent':
        return <Badge variant="info">Sent</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'expired':
        return <Badge variant="warning">Expired</Badge>;
      default:
        return <Badge variant="neutral">Draft</Badge>;
    }
  };

  const columns: Column<Quotation>[] = [
    {
      key: 'quotation_number',
      header: 'Quotation #',
      sortable: true,
      render: (q) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
            {q.quotation_number}
          </span>
          <span className="text-[10px] text-slate-400 block">{formatDate(q.quotation_date)}</span>
        </div>
      ),
    },
    {
      key: 'party_name',
      header: 'Customer',
      sortable: true,
      render: (q) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{q.party_name}</p>
          <p className="text-xs text-slate-400">{q.party_business_name || q.party_phone || '-'}</p>
        </div>
      ),
    },
    {
      key: 'expiry_date',
      header: 'Valid Till',
      render: (q) => <span className="text-xs text-slate-600 dark:text-slate-400">{formatDate(q.expiry_date)}</span>,
    },
    {
      key: 'grand_total',
      header: 'Estimated Total',
      sortable: true,
      render: (q) => (
        <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
          {formatINR(q.grand_total)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (q) => getStatusBadge(q.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (q) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {q.status !== 'converted' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConvertToInvoice(q)}
              className="text-xs text-indigo-600 h-7"
              leftIcon={<Sparkles className="w-3 h-3" />}
            >
              Convert to Invoice
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/quotations/${q.id}`)}
            className="p-1.5 h-7 text-slate-600"
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
            Quotations & Estimates
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create proposals, send estimates to clients and convert them to invoices with 1 click
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export
          </Button>
          <Button size="sm" onClick={() => navigate('/quotations/new')} leftIcon={<Plus className="w-4 h-4" />}>
            Create Quotation
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
          All ({quotations.length})
        </button>
        <button
          onClick={() => setStatusFilter('sent')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === 'sent'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Sent ({quotations.filter((q) => q.status === 'sent').length})
        </button>
        <button
          onClick={() => setStatusFilter('accepted')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === 'accepted'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Accepted ({quotations.filter((q) => q.status === 'accepted').length})
        </button>
        <button
          onClick={() => setStatusFilter('converted')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === 'converted'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Converted ({quotations.filter((q) => q.status === 'converted').length})
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredQuotations}
        searchPlaceholder="Search quotations by number or client..."
        searchKeys={['quotation_number', 'party_name', 'party_business_name']}
        onRowClick={(q) => navigate(`/quotations/${q.id}`)}
        emptyTitle="No quotations created"
        emptyDescription="Draft professional proposals and send them directly to prospective clients."
        emptyAction={
          <Button size="sm" onClick={() => navigate('/quotations/new')} leftIcon={<Plus className="w-4 h-4" />}>
            Create First Quotation
          </Button>
        }
      />
    </div>
  );
};
