import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Plus,
  ArrowLeft,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { useBusiness } from '../../context/BusinessContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { formatINR, formatDate } from '../../utils/currency';
import { PaymentMethod } from '../../types';
import { useNotification } from '../../context/NotificationContext';

export const PartyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeBusinessId } = useBusiness();
  const { showToast } = useNotification();

  const [party, setParty] = useState(() => (id ? storageService.getPartyById(id) : undefined));
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'quotations'>('invoices');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Payment Form State
  const [payAmount, setPayAmount] = useState<number>(party?.current_balance || 0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('upi');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  if (!party) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Party not found</h2>
        <Button size="sm" onClick={() => navigate('/parties')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Parties
        </Button>
      </div>
    );
  }

  const allInvoices = storageService.getInvoices(activeBusinessId).filter((i) => i.party_id === party.id);
  const allPayments = storageService.getPayments(activeBusinessId).filter((p) => p.party_id === party.id);
  const allQuotations = storageService.getQuotations(activeBusinessId).filter((q) => q.party_id === party.id);

  const totalBilled = allInvoices.reduce((sum, i) => sum + (i.grand_total || 0), 0);
  const totalPaid = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    storageService.recordPayment({
      id: crypto.randomUUID(),
      business_id: activeBusinessId,
      party_id: party.id,
      party_name: party.name,
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
      message: `₹ ${payAmount.toLocaleString('en-IN')} recorded for ${party.name}`,
    });

    setIsPaymentModalOpen(false);
    setParty(storageService.getPartyById(party.id));
  };

  return (
    <div className="space-y-6">
      {/* Top back button & Actions */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/parties')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="text-slate-600 dark:text-slate-300"
        >
          All Parties
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaymentModalOpen(true)}
            leftIcon={<CreditCard className="w-4 h-4" />}
          >
            Record Payment
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/invoices/new?partyId=${party.id}`)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Party Profile Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
                {party.name}
              </h1>
              <Badge variant="purple" size="sm">
                {party.type.toUpperCase()}
              </Badge>
            </div>
            {party.business_name && (
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {party.business_name}
              </p>
            )}
          </div>

          {/* Current Balance Pill */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-right">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Current Outstanding Due
            </span>
            <span
              className={`text-2xl font-extrabold font-mono ${
                party.current_balance > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : party.current_balance < 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {formatINR(Math.abs(party.current_balance))}
            </span>
          </div>
        </div>

        {/* Contact & GST Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-900 dark:text-slate-200 block uppercase text-[10px]">
              Contact Details
            </span>
            <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {party.phone || 'No phone'}</p>
            <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {party.email || 'No email'}</p>
          </div>

          <div className="space-y-1.5">
            <span className="font-semibold text-slate-900 dark:text-slate-200 block uppercase text-[10px]">
              GST & Location
            </span>
            <p><span className="text-slate-400">GSTIN:</span> <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{party.gstin || 'Unregistered'}</span></p>
            <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {party.city || '-'}, {party.state} ({party.state_code})</p>
          </div>

          <div className="space-y-1.5">
            <span className="font-semibold text-slate-900 dark:text-slate-200 block uppercase text-[10px]">
              Financial Summary
            </span>
            <p><span className="text-slate-400">Total Billed:</span> <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatINR(totalBilled)}</span></p>
            <p><span className="text-slate-400">Total Paid:</span> <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatINR(totalPaid)}</span></p>
          </div>
        </div>
      </div>

      {/* Tabs for Transaction History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'invoices'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Invoices ({allInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'payments'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Payments ({allPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('quotations')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'quotations'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Quotations ({allQuotations.length})
          </button>
        </div>

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs w-full max-w-full">
            {allInvoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No invoices generated for this party yet.
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[550px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Balance</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {allInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{formatDate(inv.invoice_date)}</td>
                        <td className="py-3.5 px-4 text-slate-500">{formatDate(inv.due_date)}</td>
                        <td className="py-3.5 px-4 font-semibold font-mono">{formatINR(inv.grand_total)}</td>
                        <td className="py-3.5 px-4 font-mono text-rose-500">{formatINR(inv.balance_due)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <Badge
                            variant={inv.status === 'paid' ? 'success' : inv.status === 'partially_paid' ? 'warning' : 'info'}
                            size="sm"
                          >
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs w-full max-w-full">
            {allPayments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No payment receipts recorded yet.
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[550px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4 text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {allPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {p.payment_number || 'REC-0001'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{formatDate(p.payment_date)}</td>
                        <td className="py-3.5 px-4 uppercase font-mono font-medium text-indigo-600">
                          {p.payment_method}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{p.reference_number || '-'}</td>
                        <td className="py-3.5 px-4 font-semibold font-mono text-emerald-600 dark:text-emerald-400 text-right">
                          {formatINR(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Quotations Tab */}
        {activeTab === 'quotations' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs w-full max-w-full">
            {allQuotations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No quotations created for this party yet.
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[550px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                      <th className="py-3 px-4">Quotation #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {allQuotations.map((q) => (
                      <tr
                        key={q.id}
                        onClick={() => navigate(`/quotations/${q.id}`)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {q.quotation_number}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{formatDate(q.quotation_date)}</td>
                        <td className="py-3.5 px-4 text-slate-500">{formatDate(q.expiry_date)}</td>
                        <td className="py-3.5 px-4 font-semibold font-mono">{formatINR(q.grand_total)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <Badge variant="info" size="sm">
                            {q.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment from Party"
        description={`Record cash/UPI/bank payment received from ${party.name}.`}
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
            label="Reference / Transaction No. (Optional)"
            placeholder="e.g. UPI Ref / Cheque No."
            value={payRef}
            onChange={(e) => setPayRef(e.target.value)}
          />

          <Input
            label="Payment Notes"
            placeholder="e.g. Part payment for Feb billing"
            value={payNotes}
            onChange={(e) => setPayNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Record Receipt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
