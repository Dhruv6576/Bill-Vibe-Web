import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Copy,
  Printer,
  Download,
  Share2,
  CreditCard,
  Ban,
  CheckCircle2,
  Clock,
  Send,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { InvoicePreview } from './InvoicePreview';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { formatINR, formatDate } from '../../utils/currency';
import { PaymentMethod } from '../../types';
import { useNotification } from '../../context/NotificationContext';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeBusiness } = useBusiness();
  const { showToast } = useNotification();

  const [invoice, setInvoice] = useState(() => (id ? storageService.getInvoiceById(id) : undefined));
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Payment Recording State
  const [payAmount, setPayAmount] = useState<number>(invoice?.balance_due || 0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('upi');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  if (!invoice || !activeBusiness) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Invoice not found</h2>
        <Button size="sm" onClick={() => navigate('/invoices')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    storageService.recordPayment({
      id: crypto.randomUUID(),
      business_id: invoice.business_id,
      party_id: invoice.party_id,
      party_name: invoice.party_name,
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      amount: payAmount,
      payment_method: payMethod,
      reference_number: payRef.trim(),
      notes: payNotes.trim(),
      payment_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    });

    showToast({
      type: 'success',
      title: 'Payment Recorded',
      message: `₹ ${payAmount.toLocaleString('en-IN')} allocated to ${invoice.invoice_number}`,
    });

    setIsPaymentModalOpen(false);
    setInvoice(storageService.getInvoiceById(invoice.id));
  };

  const handleCancelInvoice = () => {
    if (window.confirm('Are you sure you want to mark this invoice as CANCELLED?')) {
      storageService.updateInvoiceStatus(invoice.id, 'cancelled');
      showToast({ type: 'info', title: 'Invoice Cancelled', message: 'Invoice status set to Cancelled.' });
      setInvoice(storageService.getInvoiceById(invoice.id));
    }
  };

  const handleDuplicate = () => {
    navigate(`/invoices/new?duplicateFrom=${invoice.id}`);
  };

  const handleWhatsAppShare = () => {
    const cleanPhone = (invoice.party_phone || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${invoice.party_name},\n\nYour invoice *${invoice.invoice_number}* for *${formatINR(
        invoice.grand_total
      )}* from *${activeBusiness.name}* is generated.\n\nBalance Due: *${formatINR(
        invoice.balance_due
      )}*\nDue Date: ${invoice.due_date}\n\nThank you for your business!`
    );
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/invoices')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="p-1.5"
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
                {invoice.invoice_number}
              </h1>
              <Badge
                variant={
                  invoice.status === 'paid'
                    ? 'success'
                    : invoice.status === 'partially_paid'
                    ? 'warning'
                    : invoice.status === 'sent'
                    ? 'info'
                    : invoice.status === 'overdue'
                    ? 'danger'
                    : 'neutral'
                }
              >
                {invoice.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Issued to {invoice.party_name} on {formatDate(invoice.invoice_date)} • Due on {formatDate(invoice.due_date)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {invoice.balance_due > 0 && invoice.status !== 'cancelled' && (
            <Button
              size="sm"
              onClick={() => {
                setPayAmount(invoice.balance_due);
                setIsPaymentModalOpen(true);
              }}
              leftIcon={<CreditCard className="w-4 h-4" />}
            >
              Record Payment
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsAppShare}
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
          >
            Share on WhatsApp
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
            leftIcon={<Edit className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            leftIcon={<Copy className="w-3.5 h-3.5" />}
          >
            Duplicate
          </Button>

          {invoice.status !== 'cancelled' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelInvoice}
              leftIcon={<Ban className="w-3.5 h-3.5" />}
              className="text-rose-600 hover:bg-rose-50"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Detail Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Grand Total</span>
          <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">{formatINR(invoice.grand_total)}</p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Amount Received</span>
          <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatINR(invoice.amount_paid)}</p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Balance Due</span>
          <p className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">{formatINR(invoice.balance_due)}</p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Place of Supply</span>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{invoice.place_of_supply || 'Same State'}</p>
        </div>
      </div>

      {/* Printable Live Invoice Preview Container */}
      <InvoicePreview
        invoice={invoice}
        business={activeBusiness}
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment for Invoice"
        description={`Allocate payment received against invoice ${invoice.invoice_number}.`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <Input
            label="Payment Amount (₹)"
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value))}
            required
            autoFocus
          />

          <Select
            label="Payment Mode"
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
            options={[
              { value: 'upi', label: 'UPI (GPay / PhonePe / Paytm)' },
              { value: 'bank_transfer', label: 'Bank Transfer (NEFT / RTGS / IMPS)' },
              { value: 'cash', label: 'Cash' },
              { value: 'cheque', label: 'Cheque' },
              { value: 'card', label: 'Credit / Debit Card' },
              { value: 'other', label: 'Other' },
            ]}
          />

          <Input
            label="Transaction Reference (Optional)"
            placeholder="e.g. UPI Ref / Bank UTR No."
            value={payRef}
            onChange={(e) => setPayRef(e.target.value)}
          />

          <Input
            label="Notes"
            placeholder="e.g. Received via UPI payment QR"
            value={payNotes}
            onChange={(e) => setPayNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Confirm Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
