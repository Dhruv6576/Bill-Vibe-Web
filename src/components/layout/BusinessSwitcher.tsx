import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Building2, Check, ChevronDown, Plus, Store } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { GST_STATES } from '../../utils/gstEngine';

export const BusinessSwitcher: React.FC = () => {
  const { businesses, activeBusiness, setActiveBusinessId, createBusiness } = useBusiness();
  const [isOpen, setIsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New business form state
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('Retail');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('24');
  const [gstin, setGstin] = useState('');
  const [prefix, setPrefix] = useState('INV');

  const handleCreateNewBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const stateObj = GST_STATES.find((s) => s.code === stateCode);

    createBusiness({
      name: name.trim(),
      business_type: businessType,
      city: city.trim(),
      state: stateObj?.name || 'Gujarat',
      state_code: stateCode,
      gstin: gstin.trim(),
      is_gst_registered: !!gstin.trim(),
      invoice_prefix: prefix.trim() || 'INV',
    });

    setIsAddModalOpen(false);
    setName('');
    setCity('');
    setGstin('');
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 border border-slate-200/60 dark:border-slate-700/60 transition-all text-left w-full sm:w-64 select-none cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            {activeBusiness?.name?.charAt(0) || 'B'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {activeBusiness?.name || 'My Business'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
              <Store className="w-3 h-3" />
              {activeBusiness?.business_type || 'Retail'} {activeBusiness?.city ? `• ${activeBusiness.city}` : ''}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-40 animate-slide-up">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                Your Businesses ({businesses.length})
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto">
                {businesses.map((b) => {
                  const isSelected = b.id === activeBusiness?.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        setActiveBusinessId(b.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <div className="truncate">
                          <p className="text-xs font-medium truncate">{b.name}</p>
                          <p className="text-[10px] opacity-70 truncate">{b.city || 'India'} {b.gstin ? `• ${b.gstin}` : ''}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsAddModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Business</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add New Business Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Business"
        description="Create a separate business profile with isolated invoicing and party data."
      >
        <form onSubmit={handleCreateNewBusiness} className="space-y-4">
          <Input
            label="Business Name"
            placeholder="e.g. Apex Traders, Supermart"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Business Type"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              options={[
                { value: 'Retail', label: 'Retail Shop / Store' },
                { value: 'Wholesale', label: 'Wholesale & Distribution' },
                { value: 'Services', label: 'Services & Consulting' },
                { value: 'Freelancer', label: 'Freelancer / Professional' },
                { value: 'Manufacturing', label: 'Manufacturing' },
                { value: 'Restaurant', label: 'Restaurant / Food' },
                { value: 'Other', label: 'Other Business' },
              ]}
            />
            <Input
              label="City"
              placeholder="e.g. Mumbai, Ahmedabad"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="State (GST)"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              options={GST_STATES.map((s) => ({
                value: s.code,
                label: `${s.code} - ${s.name}`,
              }))}
            />
            <Input
              label="Invoice Prefix"
              placeholder="e.g. INV, AT"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            />
          </div>

          <Input
            label="GSTIN (Optional)"
            placeholder="15-digit GSTIN (e.g. 24AABCS1429B1Z8)"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Create Business
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
