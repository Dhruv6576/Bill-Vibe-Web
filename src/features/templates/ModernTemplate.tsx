import React, { useEffect, useState } from 'react';
import { Invoice, Business } from '../../types';
import { formatINR, formatDate } from '../../utils/currency';
import { numberToWordsINR } from '../../utils/numberToWords';
import { generateQRCodeDataUrl, generateUPIPaymentString } from '../../utils/upiHelper';

export interface TemplateProps {
  invoice: Invoice;
  business: Business;
}

export const ModernTemplate: React.FC<TemplateProps> = ({ invoice, business }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const makeQR = async () => {
      if (business.upi_id && business.upi_qr_enabled) {
        const upiString = generateUPIPaymentString({
          upiId: business.upi_id,
          payeeName: business.name,
          amount: invoice.balance_due,
          transactionNote: `Bill ${invoice.invoice_number}`,
        });
        const url = await generateQRCodeDataUrl(upiString);
        setQrDataUrl(url);
      }
    };
    makeQR();
  }, [business, invoice]);

  const amountInWords = numberToWordsINR(invoice.grand_total);

  return (
    <div
      id="invoice-a4-sheet"
      className="bg-white text-slate-900 p-8 sm:p-10 font-sans text-xs leading-relaxed w-full max-w-[794px] mx-auto space-y-5 box-border"
      style={{ width: '794px', boxSizing: 'border-box' }}
    >
      {/* Header: Business & Invoice Meta */}
      <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-5">
        <div className="space-y-1.5 max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900 font-display uppercase tracking-tight">
            {business.name}
          </h2>
          {business.tagline && <p className="text-xs text-slate-500 font-medium">{business.tagline}</p>}
          <p className="text-slate-600 text-xs">
            {business.address_line1}
            {business.city ? `, ${business.city}` : ''}
            {business.state ? `, ${business.state}` : ''} {business.pincode}
          </p>
          {business.phone && <p className="text-slate-600 text-xs">Phone: {business.phone}</p>}
          {business.email && <p className="text-slate-600 text-xs">Email: {business.email}</p>}
          {business.gstin && (
            <p className="text-xs font-semibold text-indigo-700">
              GSTIN: <span className="font-mono">{business.gstin}</span>
            </p>
          )}
          {business.pan && (
            <p className="text-xs text-slate-600">
              PAN: <span className="font-mono">{business.pan}</span>
            </p>
          )}
        </div>

        <div className="text-right space-y-1.5">
          <div className="inline-block px-3.5 py-1 bg-indigo-600 text-white font-bold uppercase tracking-wider text-xs rounded-md shadow-xs">
            Tax Invoice
          </div>
          <p className="text-xs">
            <span className="text-slate-500 font-medium">Invoice No:</span>{' '}
            <span className="font-bold text-slate-900 font-mono text-sm">{invoice.invoice_number}</span>
          </p>
          <p className="text-xs">
            <span className="text-slate-500 font-medium">Invoice Date:</span>{' '}
            <span className="font-medium text-slate-900">{formatDate(invoice.invoice_date)}</span>
          </p>
          <p className="text-xs">
            <span className="text-slate-500 font-medium">Due Date:</span>{' '}
            <span className="font-medium text-slate-900">{formatDate(invoice.due_date)}</span>
          </p>
          <p className="text-xs">
            <span className="text-slate-500 font-medium">Place of Supply:</span>{' '}
            <span className="font-semibold text-slate-900">{invoice.place_of_supply || business.state}</span>
          </p>
        </div>
      </div>

      {/* Bill To & Status Section */}
      <div className="grid grid-cols-2 gap-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Billed To (Customer)
          </span>
          <p className="font-bold text-slate-900 text-sm">{invoice.party_name}</p>
          {invoice.party_business_name && (
            <p className="font-medium text-slate-700">{invoice.party_business_name}</p>
          )}
          {invoice.party_address && <p className="text-slate-600 text-xs mt-0.5">{invoice.party_address}</p>}
          <p className="text-slate-600 text-xs">
            {invoice.party_state ? `${invoice.party_state} (${invoice.party_state_code || '-'})` : ''}
          </p>
          {invoice.party_phone && <p className="text-slate-600 text-xs">Phone: {invoice.party_phone}</p>}
          {invoice.party_gstin && (
            <p className="text-xs font-semibold text-slate-900 mt-1">
              GSTIN: <span className="font-mono text-indigo-700">{invoice.party_gstin}</span>
            </p>
          )}
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Payment Terms & Status
          </span>
          <p className="text-xs font-semibold text-slate-800">
            Terms: {business.default_payment_terms || 'Due on Receipt'}
          </p>
          <div className="mt-2 inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
            {invoice.status}
          </div>
          {invoice.balance_due > 0 ? (
            <p className="text-rose-600 font-bold font-mono text-xs mt-1.5">
              Balance Due: {formatINR(invoice.balance_due)}
            </p>
          ) : (
            <p className="text-emerald-600 font-bold text-xs mt-1.5">Fully Settled</p>
          )}
        </div>
      </div>

      {/* Item Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold uppercase text-[11px]">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-2 text-center">HSN</th>
              <th className="py-2.5 px-2 text-right">Qty</th>
              <th className="py-2.5 px-2 text-right">Rate</th>
              <th className="py-2.5 px-2 text-right">Taxable</th>
              {!invoice.is_interstate ? (
                <>
                  <th className="py-2.5 px-2 text-right">CGST</th>
                  <th className="py-2.5 px-2 text-right">SGST</th>
                </>
              ) : (
                <th className="py-2.5 px-2 text-right">IGST</th>
              )}
              <th className="py-2.5 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="py-2.5 px-3 font-medium text-slate-500">{idx + 1}</td>
                <td className="py-2.5 px-3">
                  <p className="font-bold text-slate-900">{item.name}</p>
                  {item.description && <p className="text-[10px] text-slate-500 mt-0.5">{item.description}</p>}
                </td>
                <td className="py-2.5 px-2 text-center font-mono text-slate-600">{item.hsn_code || '-'}</td>
                <td className="py-2.5 px-2 text-right font-semibold">
                  {item.quantity} {item.unit}
                </td>
                <td className="py-2.5 px-2 text-right font-mono">{formatINR(item.rate, false)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatINR(item.taxable_amount, false)}</td>
                {!invoice.is_interstate ? (
                  <>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                      {formatINR(item.cgst_amount, false)}
                      <span className="text-[9px] block text-slate-400">({item.gst_rate / 2}%)</span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                      {formatINR(item.sgst_amount, false)}
                      <span className="text-[9px] block text-slate-400">({item.gst_rate / 2}%)</span>
                    </td>
                  </>
                ) : (
                  <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                    {formatINR(item.igst_amount, false)}
                    <span className="text-[9px] block text-slate-400">({item.gst_rate}%)</span>
                  </td>
                )}
                <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                  {formatINR(item.total, false)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary & Bank Section */}
      <div className="grid grid-cols-12 gap-6 pt-2">
        {/* Left: Words, Bank & UPI */}
        <div className="col-span-7 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Amount in Words:
            </span>
            <p className="font-semibold text-slate-800 text-xs italic mt-0.5">
              {amountInWords}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 flex items-start gap-4">
            <div className="flex-1 space-y-1 text-xs text-slate-600">
              <span className="font-bold text-slate-900 uppercase block text-xs mb-1">
                Bank & Payment Details
              </span>
              {business.bank_name && <p><span className="text-slate-400">Bank:</span> {business.bank_name}</p>}
              {business.account_name && <p><span className="text-slate-400">A/C Name:</span> {business.account_name}</p>}
              {business.account_number && <p><span className="text-slate-400">A/C No:</span> <span className="font-mono font-bold text-slate-900">{business.account_number}</span></p>}
              {business.ifsc_code && <p><span className="text-slate-400">IFSC:</span> <span className="font-mono font-bold text-slate-900">{business.ifsc_code}</span></p>}
              {business.upi_id && <p><span className="text-slate-400">UPI ID:</span> <span className="font-mono font-semibold text-indigo-700">{business.upi_id}</span></p>}
            </div>

            {qrDataUrl && (
              <a
                href={generateUPIPaymentString({
                  upiId: business.upi_id || '',
                  payeeName: business.name,
                  amount: invoice.balance_due,
                  transactionNote: `Bill ${invoice.invoice_number}`,
                })}
                onClick={(e) => {
                  const upi = generateUPIPaymentString({
                    upiId: business.upi_id || '',
                    payeeName: business.name,
                    amount: invoice.balance_due,
                    transactionNote: `Bill ${invoice.invoice_number}`,
                  });
                  if (upi) {
                    window.location.href = upi;
                  }
                }}
                title="Scan or Tap to Pay via UPI"
                className="text-center shrink-0 cursor-pointer block group no-underline"
              >
                <img
                  src={qrDataUrl}
                  alt="UPI Payment QR"
                  className="w-20 h-20 rounded border border-slate-300 p-0.5 bg-white shadow-xs group-hover:border-indigo-500 transition-colors"
                />
                <span className="text-[9px] font-bold text-indigo-600 mt-1 block group-hover:underline">
                  Scan / Tap to Pay
                </span>
              </a>
            )}
          </div>
        </div>

        {/* Right: Totals Breakdown */}
        <div className="col-span-5 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Taxable Amount:</span>
            <span className="font-mono font-medium">{formatINR(invoice.taxable_amount)}</span>
          </div>

          {invoice.discount_amount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount:</span>
              <span className="font-mono">-{formatINR(invoice.discount_amount)}</span>
            </div>
          )}

          {!invoice.is_interstate ? (
            <>
              <div className="flex justify-between text-slate-600">
                <span>CGST:</span>
                <span className="font-mono font-medium">{formatINR(invoice.cgst_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST:</span>
                <span className="font-mono font-medium">{formatINR(invoice.sgst_amount)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-slate-600">
              <span>IGST:</span>
              <span className="font-mono font-medium">{formatINR(invoice.igst_amount)}</span>
            </div>
          )}

          {invoice.round_off !== 0 && (
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Round-off:</span>
              <span className="font-mono">{formatINR(invoice.round_off)}</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-extrabold text-slate-900">
            <span>Grand Total:</span>
            <span className="font-mono text-base text-indigo-700">{formatINR(invoice.grand_total)}</span>
          </div>

          <div className="flex justify-between text-slate-600 text-xs">
            <span>Amount Received:</span>
            <span className="font-mono text-emerald-600 font-semibold">{formatINR(invoice.amount_paid)}</span>
          </div>

          <div className="flex justify-between text-xs font-bold text-rose-600 pt-1 border-t border-slate-200">
            <span>Balance Due:</span>
            <span className="font-mono">{formatINR(invoice.balance_due)}</span>
          </div>
        </div>
      </div>

      {/* Footer Terms & Signature */}
      <div className="pt-6 border-t border-slate-200 mt-6 grid grid-cols-2 items-end">
        <div className="text-[10px] text-slate-500 space-y-1 pr-4">
          <span className="font-bold text-slate-700 uppercase block">Terms & Conditions</span>
          <p className="whitespace-pre-line leading-relaxed">{invoice.terms_conditions || business.default_terms_conditions}</p>
        </div>

        <div className="text-right space-y-2">
          <p className="text-xs font-bold text-slate-800">For {business.name}</p>
          <div className="flex flex-col items-end justify-end">
            {business.signature_url ? (
              <img
                src={business.signature_url}
                alt="Authorized Signature"
                className="max-h-12 max-w-[150px] object-contain mb-1"
              />
            ) : (
              <div className="h-10" />
            )}
            <div className="border-t border-slate-400 w-48 pt-1 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Authorized Signatory
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
