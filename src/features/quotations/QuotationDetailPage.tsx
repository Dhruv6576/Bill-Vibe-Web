import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Share2,
  FileSpreadsheet,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatINR, formatDate } from '../../utils/currency';
import { useNotification } from '../../context/NotificationContext';

export const QuotationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeBusinessId, activeBusiness } = useBusiness();
  const { showToast } = useNotification();

  const [quotation, setQuotation] = useState(() => (id ? storageService.getQuotationById(id) : undefined));

  if (!quotation || !activeBusiness) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold">Quotation not found</h2>
        <Button size="sm" onClick={() => navigate('/quotations')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Quotations
        </Button>
      </div>
    );
  }

  const handleConvertToInvoice = () => {
    const invNumber = storageService.getNextInvoiceNumber(activeBusinessId);
    const newInvoice = storageService.saveInvoice({
      id: crypto.randomUUID(),
      business_id: activeBusinessId,
      party_id: quotation.party_id,
      invoice_number: invNumber,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'sent',
      party_name: quotation.party_name,
      party_business_name: quotation.party_business_name,
      party_gstin: quotation.party_gstin,
      party_phone: quotation.party_phone,
      party_email: quotation.party_email,
      party_address: quotation.party_address,
      party_state: quotation.party_state,
      party_state_code: quotation.party_state_code,
      place_of_supply: `${quotation.party_state || 'Gujarat'} (${quotation.party_state_code || '24'})`,
      is_interstate: false,
      subtotal: quotation.subtotal,
      discount_type: 'fixed',
      discount_value: quotation.discount_amount,
      discount_amount: quotation.discount_amount,
      taxable_amount: quotation.taxable_amount,
      cgst_amount: quotation.cgst_amount,
      sgst_amount: quotation.sgst_amount,
      igst_amount: quotation.igst_amount,
      cess_amount: quotation.cess_amount,
      total_tax: quotation.total_tax,
      shipping_charges: 0,
      round_off: 0,
      grand_total: quotation.grand_total,
      amount_paid: 0,
      balance_due: quotation.grand_total,
      notes: quotation.notes,
      terms_conditions: quotation.terms_conditions,
      template_id: 'modern',
      quotation_id: quotation.id,
      items: quotation.items.map((item) => ({
        ...item,
        cess_amount: 0,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    quotation.status = 'converted';
    quotation.converted_to_invoice_id = newInvoice.id;
    storageService.saveQuotation(quotation);

    showToast({
      type: 'success',
      title: 'Quotation Converted!',
      message: `Invoice ${invNumber} generated from quotation.`,
    });

    navigate(`/invoices/${newInvoice.id}`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/quotations')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="p-1.5"
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
                {quotation.quotation_number}
              </h1>
              <Badge variant="purple">{quotation.status.toUpperCase()}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued for {quotation.party_name} on {formatDate(quotation.quotation_date)} • Valid till {formatDate(quotation.expiry_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {quotation.status !== 'converted' && (
            <Button size="sm" onClick={handleConvertToInvoice} leftIcon={<Sparkles className="w-4 h-4" />}>
              Convert to Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Main Quotation Sheet Preview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex justify-between items-start pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{activeBusiness.name}</h2>
            <p className="text-xs text-slate-500 mt-1">{activeBusiness.address_line1}, {activeBusiness.city}</p>
            {activeBusiness.gstin && <p className="text-xs text-indigo-600 font-semibold font-mono">GSTIN: {activeBusiness.gstin}</p>}
          </div>
          <div className="text-right">
            <div className="px-3 py-1 bg-purple-50 text-purple-700 font-bold uppercase tracking-wider text-xs rounded mb-2 inline-block border border-purple-200">
              Quotation / Estimate
            </div>
            <p className="text-xs text-slate-500">Date: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(quotation.quotation_date)}</span></p>
            <p className="text-xs text-slate-500">Valid Till: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(quotation.expiry_date)}</span></p>
          </div>
        </div>

        {/* Client Info */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Quotation Prepared For
          </span>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{quotation.party_name}</p>
          {quotation.party_business_name && <p className="text-xs text-slate-600 dark:text-slate-400">{quotation.party_business_name}</p>}
          {quotation.party_phone && <p className="text-xs text-slate-500 mt-0.5">Phone: {quotation.party_phone}</p>}
        </div>

        {/* Items Table */}
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
              <th className="py-2.5 px-2">#</th>
              <th className="py-2.5 px-2">Scope / Item Description</th>
              <th className="py-2.5 px-2 text-right">Qty</th>
              <th className="py-2.5 px-2 text-right">Rate</th>
              <th className="py-2.5 px-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {quotation.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 px-2 text-slate-400">{idx + 1}</td>
                <td className="py-3 px-2 font-semibold text-slate-900 dark:text-slate-100">{item.name}</td>
                <td className="py-3 px-2 text-right">{item.quantity} {item.unit}</td>
                <td className="py-3 px-2 text-right font-mono">{formatINR(item.rate)}</td>
                <td className="py-3 px-2 text-right font-bold font-mono text-slate-900 dark:text-slate-100">{formatINR(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <div className="w-64 space-y-1.5 text-xs text-right">
            <div className="flex justify-between text-slate-500">
              <span>Taxable Value:</span>
              <span className="font-mono">{formatINR(quotation.taxable_amount)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total GST:</span>
              <span className="font-mono">{formatINR(quotation.total_tax)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Estimated Total:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatINR(quotation.grand_total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
