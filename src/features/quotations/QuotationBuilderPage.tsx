import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { Quotation, QuotationItem } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { GST_STATES, calculateLineItemTaxes, calculateInvoiceTotals } from '../../utils/gstEngine';
import { formatINR } from '../../utils/currency';
import { useNotification } from '../../context/NotificationContext';

export const QuotationBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeBusinessId, activeBusiness } = useBusiness();
  const { showToast } = useNotification();

  const parties = storageService.getParties(activeBusinessId);
  const products = storageService.getProducts(activeBusinessId);
  const defaultParty = parties[0];

  const [partyId, setPartyId] = useState<string>(defaultParty?.id || '');
  const [partyName, setPartyName] = useState<string>(defaultParty?.name || '');
  const [partyBusinessName, setPartyBusinessName] = useState<string>(defaultParty?.business_name || '');
  const [partyGstin, setPartyGstin] = useState<string>(defaultParty?.gstin || '');
  const [partyPhone, setPartyPhone] = useState<string>(defaultParty?.phone || '');
  const [partyAddress, setPartyAddress] = useState<string>(defaultParty?.address || '');
  const [partyStateCode, setPartyStateCode] = useState<string>(defaultParty?.state_code || '24');

  const [quotationNumber, setQuotationNumber] = useState<string>(
    storageService.getNextQuotationNumber(activeBusinessId)
  );
  const [quotationDate, setQuotationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('Quotation is valid for 30 days from the issue date.');
  const [terms, setTerms] = useState<string>(activeBusiness?.default_terms_conditions || '');

  const [items, setItems] = useState<QuotationItem[]>([
    {
      name: products[0]?.name || 'Standard Service Package',
      description: products[0]?.description || '',
      hsn_code: products[0]?.hsn_code || '998311',
      quantity: 1,
      unit: products[0]?.unit || 'PCS',
      rate: products[0]?.selling_price || 15000,
      discount_percent: 0,
      taxable_amount: products[0]?.selling_price || 15000,
      gst_rate: products[0]?.gst_rate || 18,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      total: products[0]?.selling_price || 15000,
    },
  ]);

  const handlePartySelect = (selectedId: string) => {
    setPartyId(selectedId);
    const p = parties.find((part) => part.id === selectedId);
    if (p) {
      setPartyName(p.name);
      setPartyBusinessName(p.business_name || '');
      setPartyGstin(p.gstin || '');
      setPartyPhone(p.phone || '');
      setPartyAddress(p.address || '');
      setPartyStateCode(p.state_code || '24');
    }
  };

  const computedItems = useMemo(() => {
    return items.map((item) => {
      const calc = calculateLineItemTaxes(item.quantity, item.rate, item.discount_percent, item.gst_rate, 0, false, false);
      return {
        ...item,
        taxable_amount: calc.taxableAmount,
        cgst_amount: calc.cgstAmount,
        sgst_amount: calc.sgstAmount,
        igst_amount: calc.igstAmount,
        total: calc.total,
      };
    });
  }, [items]);

  const totals = useMemo(() => {
    return calculateInvoiceTotals(computedItems as any, 'fixed', 0, 0, 0, false);
  }, [computedItems]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: '',
        description: '',
        hsn_code: '',
        quantity: 1,
        unit: 'PCS',
        rate: 0,
        discount_percent: 0,
        taxable_amount: 0,
        gst_rate: 18,
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 0,
        total: 0,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof QuotationItem, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSave = (status: Quotation['status'] = 'sent') => {
    if (!partyName.trim()) {
      showToast({ type: 'warning', title: 'Client Required', message: 'Please specify customer name.' });
      return;
    }

    const stateObj = GST_STATES.find((s) => s.code === partyStateCode);

    const saved = storageService.saveQuotation({
      id: crypto.randomUUID(),
      business_id: activeBusinessId,
      party_id: partyId,
      quotation_number: quotationNumber,
      quotation_date: quotationDate,
      expiry_date: expiryDate,
      status,
      party_name: partyName,
      party_business_name: partyBusinessName,
      party_gstin: partyGstin,
      party_phone: partyPhone,
      party_email: '',
      party_address: partyAddress,
      party_state: stateObj?.name || 'Gujarat',
      party_state_code: partyStateCode,
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      taxable_amount: totals.taxableAmount,
      cgst_amount: totals.cgstAmount,
      sgst_amount: totals.sgstAmount,
      igst_amount: totals.igstAmount,
      cess_amount: 0,
      total_tax: totals.totalTax,
      grand_total: totals.grandTotal,
      notes,
      terms_conditions: terms,
      items: computedItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    showToast({
      type: 'success',
      title: 'Quotation Created',
      message: `${quotationNumber} saved for ${partyName}.`,
    });

    navigate(`/quotations`);
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
            <h1 className="text-xl font-bold font-display text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Create Quotation / Estimate</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                {quotationNumber}
              </span>
            </h1>
            <p className="text-xs text-slate-500">Prepare estimate for potential client</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleSave('draft')}>
            Save Draft
          </Button>
          <Button size="sm" onClick={() => handleSave('sent')}>
            Save & Send
          </Button>
        </div>
      </div>

      {/* Form Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Client / Party"
            value={partyId}
            onChange={(e) => handlePartySelect(e.target.value)}
            options={parties.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.business_name || 'Individual'})`,
            }))}
          />
          <Input
            label="Client Name"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Quotation Number"
            value={quotationNumber}
            onChange={(e) => setQuotationNumber(e.target.value)}
            required
          />
          <Input
            label="Quotation Date"
            type="date"
            value={quotationDate}
            onChange={(e) => setQuotationDate(e.target.value)}
            required
          />
          <Input
            label="Expiry / Valid Till"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Line Items Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider">Estimated Items & Scope</span>
          <Button size="sm" variant="outline" onClick={handleAddItem} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Line
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <Input
                    label="Item / Service Name"
                    value={item.name}
                    onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                />
                <Input
                  label="Rate (₹)"
                  type="number"
                  value={item.rate}
                  onChange={(e) => handleUpdateItem(idx, 'rate', Number(e.target.value))}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 pt-1 border-t border-slate-200">
                <span>GST Rate: {item.gst_rate}%</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                  Line Total: {formatINR(item.total || item.quantity * item.rate * 1.18)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals Summary */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
          <span className="text-sm font-bold">Estimated Grand Total (incl. GST):</span>
          <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {formatINR(totals.grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};
