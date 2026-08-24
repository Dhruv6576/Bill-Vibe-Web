import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  FileCheck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { PhoneInput } from '../../components/common/PhoneInput';
import { Select } from '../../components/common/Select';
import { GST_STATES, getStateCodeFromGSTIN } from '../../utils/gstEngine';
import { useBusiness } from '../../context/BusinessContext';
import { useNotification } from '../../context/NotificationContext';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { createBusiness } = useBusiness();
  const { showToast } = useNotification();

  const [step, setStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    business_type: 'Retail',
    email: '',
    phone: '',
    website: '',
    address_line1: '',
    city: '',
    state: 'Gujarat',
    state_code: '24',
    pincode: '',
    is_gst_registered: true,
    gstin: '',
    pan: '',
    invoice_prefix: 'INV',
    starting_invoice_number: 1,
    default_payment_terms: 'Due on Receipt',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
  });

  const handleGSTChange = (gstinVal: string) => {
    const clean = gstinVal.toUpperCase();
    const code = getStateCodeFromGSTIN(clean);
    const matchedState = GST_STATES.find((s) => s.code === code);
    
    // Extract PAN from 15 digit GSTIN (chars 2 to 12)
    let autoPan = formData.pan;
    if (clean.length >= 12) {
      autoPan = clean.substring(2, 12);
    }

    setFormData((prev) => ({
      ...prev,
      gstin: clean,
      pan: autoPan,
      state_code: code || prev.state_code,
      state: matchedState?.name || prev.state,
    }));
  };

  const handleNext = () => {
    if (step === 1 && !formData.name.trim()) {
      showToast({ type: 'warning', title: 'Required', message: 'Please enter your business name.' });
      return;
    }
    if (step < 5) {
      setStep((s) => s + 1);
    }
  };

  const handleFinish = () => {
    // Create the business in storage
    const newBiz = createBusiness({
      name: formData.name,
      business_type: formData.business_type,
      email: formData.email,
      phone: formData.phone,
      website: formData.website,
      address_line1: formData.address_line1,
      city: formData.city,
      state: formData.state,
      state_code: formData.state_code,
      pincode: formData.pincode,
      is_gst_registered: formData.is_gst_registered,
      gstin: formData.gstin,
      pan: formData.pan,
      invoice_prefix: formData.invoice_prefix || 'INV',
      starting_invoice_number: formData.starting_invoice_number || 1,
      default_payment_terms: formData.default_payment_terms,
      bank_name: formData.bank_name,
      account_number: formData.account_number,
      ifsc_code: formData.ifsc_code,
      upi_id: formData.upi_id,
      upi_qr_enabled: !!formData.upi_id,
    });

    // Fire celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    showToast({
      type: 'success',
      title: 'Business Setup Complete!',
      message: `${newBiz.name} is ready for invoicing.`,
    });

    setTimeout(() => {
      navigate('/dashboard');
    }, 1200);
  };

  const stepsHeader = [
    { num: 1, label: 'Identity', icon: Building2 },
    { num: 2, label: 'Contact', icon: MapPin },
    { num: 3, label: 'GST & Tax', icon: FileCheck },
    { num: 4, label: 'Invoicing & UPI', icon: CreditCard },
    { num: 5, label: 'Ready', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl w-full mx-auto">
        {/* Top Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Zap className="w-4 h-4 fill-indigo-600" />
            <span>Quick Onboarding</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
            Set Up Your Business Profile
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Fill in your company details to enable automated GST calculations and professional bills.
          </p>
        </div>

        {/* Stepper Wizard Bar */}
        <div className="flex items-center justify-between mb-8 px-2">
          {stepsHeader.map((s, idx) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            const Icon = s.icon;
            return (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-4 ring-indigo-50 dark:ring-indigo-950/60'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-medium mt-1.5 hidden sm:block ${isCurrent ? 'text-indigo-600 font-semibold' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < stepsHeader.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded transition-colors ${
                      step > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Card Content */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* Step 1: Business Name & Type */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">What is your business called?</h3>
                <p className="text-xs text-slate-500">This will appear on all your invoices and client communications.</p>
              </div>

              <Input
                label="Business Name"
                placeholder="e.g. Apex Traders, Shree Hari Electronics"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
              />

              <Select
                label="Business Category / Industry"
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                options={[
                  { value: 'Retail', label: 'Retail Store / Shop' },
                  { value: 'Wholesale', label: 'Wholesale & Distribution' },
                  { value: 'Services', label: 'IT, Consulting & Services' },
                  { value: 'Freelancer', label: 'Freelancer / Contractor' },
                  { value: 'Manufacturing', label: 'Manufacturing & Assembly' },
                  { value: 'Restaurant', label: 'Restaurant, Cafe & Food' },
                  { value: 'Other', label: 'Other Business Type' },
                ]}
              />
            </div>
          )}

          {/* Step 2: Contact & Address */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Where are you located?</h3>
                <p className="text-xs text-slate-500">Address details printed on invoice headers.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Official Email"
                  placeholder="contact@business.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <PhoneInput
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(val) => setFormData({ ...formData, phone: val })}
                />
              </div>

              <Input
                label="Street Address / Shop No."
                placeholder="Shop 12, Commercial Plaza, MG Road"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="City"
                  placeholder="e.g. Ahmedabad"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <Select
                  label="State (GST State)"
                  value={formData.state_code}
                  onChange={(e) => {
                    const matched = GST_STATES.find((s) => s.code === e.target.value);
                    setFormData({
                      ...formData,
                      state_code: e.target.value,
                      state: matched?.name || formData.state,
                    });
                  }}
                  options={GST_STATES.map((s) => ({
                    value: s.code,
                    label: `${s.code} - ${s.name}`,
                  }))}
                />
                <Input
                  label="PIN Code"
                  placeholder="380009"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 3: Tax & GST Information */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Tax & GST Information</h3>
                <p className="text-xs text-slate-500">Configure Indian GSTIN for tax invoice validation.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_gst_registered}
                    onChange={(e) => setFormData({ ...formData, is_gst_registered: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>This business is registered under Indian GST</span>
                </label>
              </div>

              {formData.is_gst_registered && (
                <div className="space-y-3">
                  <Input
                    label="GSTIN (15-digit GST Number)"
                    placeholder="e.g. 24AABCS1429B1Z8"
                    value={formData.gstin}
                    onChange={(e) => handleGSTChange(e.target.value)}
                    helperText="State and PAN are automatically extracted from your GSTIN."
                  />
                  <Input
                    label="PAN (Permanent Account Number)"
                    placeholder="e.g. AABCS1429B"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Invoice Prefix & UPI Details */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Invoicing & UPI Payment Setup</h3>
                <p className="text-xs text-slate-500">Configure your numbering and payment QR code.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Invoice Prefix"
                  placeholder="e.g. INV, SHE-26"
                  value={formData.invoice_prefix}
                  onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value.toUpperCase() })}
                  helperText="Format: PREFIX-00001"
                />
                <Select
                  label="Default Payment Terms"
                  value={formData.default_payment_terms}
                  onChange={(e) => setFormData({ ...formData, default_payment_terms: e.target.value })}
                  options={[
                    { value: 'Due on Receipt', label: 'Due on Receipt' },
                    { value: 'Net 7 Days', label: 'Net 7 Days' },
                    { value: 'Net 15 Days', label: 'Net 15 Days' },
                    { value: 'Net 30 Days', label: 'Net 30 Days' },
                  ]}
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  UPI & Bank Details (Optional for QR Code)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="UPI ID (for Payment QR)"
                    placeholder="e.g. yourname@okhdfcbank"
                    value={formData.upi_id}
                    onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                  />
                  <Input
                    label="Bank Name"
                    placeholder="e.g. HDFC Bank, SBI"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Ready / Review */}
          {step === 5 && (
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center ring-8 ring-emerald-50/50">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
                You're All Set to Start Invoicing!
              </h3>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-left text-xs space-y-1.5 max-w-md mx-auto border border-slate-200 dark:border-slate-700">
                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Business:</span> {formData.name}</p>
                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Location:</span> {formData.city || '-'}, {formData.state} ({formData.state_code})</p>
                <p><span className="font-semibold text-slate-700 dark:text-slate-300">GSTIN:</span> {formData.gstin || 'Not registered'}</p>
                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Invoice Series:</span> {formData.invoice_prefix}-00001</p>
              </div>
            </div>
          )}

          {/* Stepper Buttons */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {step > 1 ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setStep((s) => s - 1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <Button type="button" size="sm" onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={handleFinish} rightIcon={<CheckCircle2 className="w-4 h-4" />}>
                Launch Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
