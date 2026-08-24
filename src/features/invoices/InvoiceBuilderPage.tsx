import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Share2,
  Download,
  Printer,
  Sparkles,
  Users,
  Eye,
  Edit3,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { Invoice, InvoiceItem, Party, Product } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { InvoicePreview } from './InvoicePreview';
import {
  GST_STATES,
  isInterStateSupply,
  calculateInvoiceTotals,
  calculateLineItemTaxes,
} from '../../utils/gstEngine';
import { formatINR } from '../../utils/currency';
import { useNotification } from '../../context/NotificationContext';

export const InvoiceBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams<{ id?: string }>();
  const { activeBusinessId, activeBusiness } = useBusiness();
  const { showToast } = useNotification();

  const parties = storageService.getParties(activeBusinessId);
  const products = storageService.getProducts(activeBusinessId);

  // Check if editing existing invoice
  const existingInvoice = id ? storageService.getInvoiceById(id) : undefined;

  // Pre-selected party if passed via query param
  const queryPartyId = searchParams.get('partyId');
  const defaultParty = parties.find((p) => p.id === (existingInvoice?.party_id || queryPartyId)) || parties[0];

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Form State
  const [partyId, setPartyId] = useState<string>(defaultParty?.id || '');
  const [partyName, setPartyName] = useState<string>(existingInvoice?.party_name || defaultParty?.name || '');
  const [partyBusinessName, setPartyBusinessName] = useState<string>(existingInvoice?.party_business_name || defaultParty?.business_name || '');
  const [partyGstin, setPartyGstin] = useState<string>(existingInvoice?.party_gstin || defaultParty?.gstin || '');
  const [partyPhone, setPartyPhone] = useState<string>(existingInvoice?.party_phone || defaultParty?.phone || '');
  const [partyAddress, setPartyAddress] = useState<string>(existingInvoice?.party_address || defaultParty?.address || '');
  const [partyStateCode, setPartyStateCode] = useState<string>(existingInvoice?.party_state_code || defaultParty?.state_code || '24');

  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    existingInvoice?.invoice_number || storageService.getNextInvoiceNumber(activeBusinessId)
  );
  const [invoiceDate, setInvoiceDate] = useState<string>(
    existingInvoice?.invoice_date || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    existingInvoice?.due_date || new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );

  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(existingInvoice?.discount_type || 'percentage');
  const [discountValue, setDiscountValue] = useState<number>(existingInvoice?.discount_value || 0);
  const [shippingCharges, setShippingCharges] = useState<number>(existingInvoice?.shipping_charges || 0);
  const [amountPaid, setAmountPaid] = useState<number>(existingInvoice?.amount_paid || 0);

  const [notes, setNotes] = useState<string>(existingInvoice?.notes || activeBusiness?.default_notes || 'Thank you for your business!');
  const [terms, setTerms] = useState<string>(existingInvoice?.terms_conditions || activeBusiness?.default_terms_conditions || '');

  // Line items state
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    if (existingInvoice?.items?.length) return existingInvoice.items;
    if (products.length > 0) {
      const p = products[0];
      return [
        {
          product_id: p.id,
          name: p.name,
          description: p.description || '',
          hsn_code: p.hsn_code || '',
          quantity: 1,
          unit: p.unit,
          rate: p.selling_price,
          discount_percent: 0,
          taxable_amount: p.selling_price,
          gst_rate: p.gst_rate,
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 0,
          cess_amount: 0,
          total: p.selling_price,
        },
      ];
    }
    return [
      {
        name: 'Standard Consulting Services',
        description: 'Professional Services',
        hsn_code: '998311',
        quantity: 1,
        unit: 'HRS',
        rate: 5000,
        discount_percent: 0,
        taxable_amount: 5000,
        gst_rate: 18,
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 0,
        cess_amount: 0,
        total: 5000,
      },
    ];
  });

  // When selected party changes, auto-fill contact & state code
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

  // Determine if Inter-State (IGST) or Intra-State (CGST + SGST)
  const isInterstate = useMemo(() => {
    return isInterStateSupply(activeBusiness?.state_code || '24', partyStateCode);
  }, [activeBusiness?.state_code, partyStateCode]);

  // Recalculate line items whenever quantities, rates, discount, or tax rates change
  const computedItems = useMemo(() => {
    return items.map((item) => {
      const calc = calculateLineItemTaxes(
        item.quantity,
        item.rate,
        item.discount_percent,
        item.gst_rate,
        0,
        isInterstate,
        false
      );
      return {
        ...item,
        taxable_amount: calc.taxableAmount,
        cgst_amount: calc.cgstAmount,
        sgst_amount: calc.sgstAmount,
        igst_amount: calc.igstAmount,
        total: calc.total,
      };
    });
  }, [items, isInterstate]);

  // Recalculate Grand Totals
  const totals = useMemo(() => {
    return calculateInvoiceTotals(
      computedItems,
      discountType,
      discountValue,
      shippingCharges,
      amountPaid,
      isInterstate
    );
  }, [computedItems, discountType, discountValue, shippingCharges, amountPaid, isInterstate]);

  // Item row operations
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
        cess_amount: 0,
        total: 0,
      },
    ]);
  };

  const handleSelectProductForItem = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        product_id: prod.id,
        name: prod.name,
        description: prod.description || '',
        hsn_code: prod.hsn_code || '',
        unit: prod.unit,
        rate: prod.selling_price,
        gst_rate: prod.gst_rate,
      };
      return copy;
    });
  };

  const handleUpdateItemField = (index: number, field: keyof InvoiceItem, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      showToast({ type: 'warning', title: 'Line Item Required', message: 'An invoice must have at least 1 item.' });
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Assembled Invoice Object for Live Preview & Save
  const assembledInvoice: Invoice = useMemo(() => {
    const stateObj = GST_STATES.find((s) => s.code === partyStateCode);
    let invoiceStatus: Invoice['status'] = 'sent';
    if (totals.balanceDue === 0) {
      invoiceStatus = 'paid';
    } else if (amountPaid > 0) {
      invoiceStatus = 'partially_paid';
    }

    return {
      id: existingInvoice?.id || crypto.randomUUID(),
      business_id: activeBusinessId,
      party_id: partyId,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      status: invoiceStatus,
      party_name: partyName,
      party_business_name: partyBusinessName,
      party_gstin: partyGstin,
      party_phone: partyPhone,
      party_address: partyAddress,
      party_state: stateObj?.name || 'Gujarat',
      party_state_code: partyStateCode,
      place_of_supply: `${stateObj?.name || 'Gujarat'} (${partyStateCode})`,
      is_interstate: isInterstate,
      subtotal: totals.subtotal,
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: totals.discountAmount,
      taxable_amount: totals.taxableAmount,
      cgst_amount: totals.cgstAmount,
      sgst_amount: totals.sgstAmount,
      igst_amount: totals.igstAmount,
      cess_amount: totals.cessAmount,
      total_tax: totals.totalTax,
      shipping_charges: totals.shippingCharges,
      round_off: totals.roundOff,
      grand_total: totals.grandTotal,
      amount_paid: amountPaid,
      balance_due: totals.balanceDue,
      notes,
      terms_conditions: terms,
      template_id: 'modern',
      items: computedItems,
      created_at: existingInvoice?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }, [
    existingInvoice,
    activeBusinessId,
    partyId,
    invoiceNumber,
    invoiceDate,
    dueDate,
    partyName,
    partyBusinessName,
    partyGstin,
    partyPhone,
    partyAddress,
    partyStateCode,
    isInterstate,
    totals,
    discountType,
    discountValue,
    amountPaid,
    notes,
    terms,
    computedItems,
  ]);

  const handleSaveInvoice = (status: Invoice['status'] = 'sent') => {
    if (!partyName.trim()) {
      showToast({ type: 'warning', title: 'Party Required', message: 'Please specify customer name.' });
      return;
    }

    const toSave = { ...assembledInvoice, status };
    storageService.saveInvoice(toSave);

    showToast({
      type: 'success',
      title: 'Invoice Saved Successfully',
      message: `Invoice ${invoiceNumber} for ${partyName} recorded.`,
    });

    navigate(`/invoices/${toSave.id}`);
  };

  const handleWhatsAppShare = () => {
    const cleanPhone = partyPhone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${partyName},\n\nYour invoice *${invoiceNumber}* for *${formatINR(
        totals.grandTotal
      )}* from *${activeBusiness?.name}* is ready.\n\nBalance Due: *${formatINR(
        totals.balanceDue
      )}*\nDue Date: ${dueDate}\n\nThank you for your business!`
    );
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
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
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{existingInvoice ? 'Edit Invoice' : 'Create New GST Invoice'}</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50">
                {invoiceNumber}
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tax Rule: {isInterstate ? 'Inter-State (IGST)' : 'Intra-State (CGST 50% + SGST 50%)'}
            </p>
          </div>
        </div>

        {/* Mobile Switcher (Editor / Preview) */}
        <div className="flex sm:hidden border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-white dark:bg-slate-900 w-full">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-500'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-500'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>A4 Preview</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSaveInvoice('draft')}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={() => handleSaveInvoice('sent')}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Finalize & Save
          </Button>
        </div>
      </div>

      {/* Split Screen Layout (Editor on Left, Live Preview on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Form Editor */}
        <div className={`lg:col-span-6 space-y-6 ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          {/* Customer / Party Section */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Customer / Bill To
              </span>
              <button
                type="button"
                onClick={() => navigate('/parties?action=new-customer')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Party</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Select from Parties"
                value={partyId}
                onChange={(e) => handlePartySelect(e.target.value)}
                options={parties.map((p) => ({
                  value: p.id,
                  label: `${p.name} ${p.business_name ? `(${p.business_name})` : ''}`,
                }))}
              />
              <Input
                label="Customer Name"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Company / Trade Name"
                placeholder="e.g. Apex Enterprises"
                value={partyBusinessName}
                onChange={(e) => setPartyBusinessName(e.target.value)}
              />
              <Input
                label="Phone Number"
                placeholder="+91 98250 11223"
                value={partyPhone}
                onChange={(e) => setPartyPhone(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="GSTIN (15-digit)"
                placeholder="24AAACA1234F1Z5"
                value={partyGstin}
                onChange={(e) => setPartyGstin(e.target.value.toUpperCase())}
              />
              <Select
                label="Place of Supply (State)"
                value={partyStateCode}
                onChange={(e) => setPartyStateCode(e.target.value)}
                options={GST_STATES.map((s) => ({
                  value: s.code,
                  label: `${s.code} - ${s.name}`,
                }))}
              />
            </div>

            <Input
              label="Billing Address"
              placeholder="Office / Street Address"
              value={partyAddress}
              onChange={(e) => setPartyAddress(e.target.value)}
            />
          </div>

          {/* Invoice Meta Section */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Invoice Number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
              />
              <Input
                label="Invoice Date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
              <Input
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Line Items Builder Section */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Line Items & Services ({items.length})
              </span>
              <Button size="sm" variant="outline" onClick={handleAddItem} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Item Row
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Item #{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Catalog Auto-fill picker if catalog products exist */}
                  {products.length > 0 && (
                    <Select
                      label="Auto-fill from Catalog"
                      value={item.product_id || ''}
                      onChange={(e) => handleSelectProductForItem(idx, e.target.value)}
                      options={[
                        { value: '', label: '-- Select Item to Auto-populate --' },
                        ...products.map((p) => ({
                          value: p.id,
                          label: `${p.name} (₹${p.selling_price} | ${p.gst_rate}% GST)`,
                        })),
                      ]}
                    />
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <Input
                        label="Item Description"
                        placeholder="e.g. Samsung Galaxy S24 Ultra"
                        value={item.name}
                        onChange={(e) => handleUpdateItemField(idx, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <Input
                      label="HSN / SAC"
                      placeholder="e.g. 85171200"
                      value={item.hsn_code || ''}
                      onChange={(e) => handleUpdateItemField(idx, 'hsn_code', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Input
                      label="Quantity"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItemField(idx, 'quantity', Number(e.target.value))}
                      required
                    />
                    <Input
                      label="Unit Rate (₹)"
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleUpdateItemField(idx, 'rate', Number(e.target.value))}
                      required
                    />
                    <Input
                      label="Discount %"
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount_percent}
                      onChange={(e) => handleUpdateItemField(idx, 'discount_percent', Number(e.target.value))}
                    />
                    <Select
                      label="GST Rate"
                      value={item.gst_rate}
                      onChange={(e) => handleUpdateItemField(idx, 'gst_rate', Number(e.target.value))}
                      options={[
                        { value: 0, label: '0% (Exempt)' },
                        { value: 5, label: '5%' },
                        { value: 12, label: '12%' },
                        { value: 18, label: '18%' },
                        { value: 28, label: '28%' },
                      ]}
                    />
                  </div>

                  {/* Line Total Calculation preview */}
                  <div className="pt-2 flex justify-between items-center text-xs text-slate-500 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span>
                      Taxable: <span className="font-mono font-medium">{formatINR(item.taxable_amount || item.quantity * item.rate)}</span>
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Line Total: <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatINR(item.total || item.quantity * item.rate * 1.18)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discounts, Shipping & Payment Summary Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider block pb-2 border-b border-slate-100 dark:border-slate-800">
              Discounts, Shipping & Payments
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Overall Discount Type"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                options={[
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'fixed', label: 'Fixed Amount (₹)' },
                ]}
              />
              <Input
                label={`Discount Value (${discountType === 'percentage' ? '%' : '₹'})`}
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
              />
              <Input
                label="Shipping Charges (₹)"
                type="number"
                value={shippingCharges}
                onChange={(e) => setShippingCharges(Number(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Input
                label="Amount Paid Now (₹)"
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
              />
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Balance Remaining:</span>
                <span className="text-sm font-bold font-mono text-rose-500">
                  {formatINR(totals.balanceDue)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <Input
                label="Invoice Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Textarea
                label="Terms & Conditions"
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              />
            </div>
          </div>

          {/* Sticky Mobile Action buttons */}
          <div className="lg:hidden flex items-center gap-2 pt-2">
            <Button
              className="flex-1"
              size="md"
              onClick={() => handleSaveInvoice('sent')}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Finalize Invoice
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={handleWhatsAppShare}
              leftIcon={<Share2 className="w-4 h-4" />}
            >
              Share
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Vector A4 Invoice Preview */}
        <div className={`lg:col-span-6 sticky top-20 ${activeTab === 'editor' ? 'hidden lg:block' : 'block'}`}>
          {activeBusiness && (
            <InvoicePreview
              invoice={assembledInvoice}
              business={activeBusiness}
              onShareWhatsApp={handleWhatsAppShare}
            />
          )}
        </div>
      </div>
    </div>
  );
};
