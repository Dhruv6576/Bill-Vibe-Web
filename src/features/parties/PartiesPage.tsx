import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Plus,
  Download,
  Upload,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Building2,
  Trash2,
  Edit2,
  ArrowUpRight,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { Party, PartyType } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { DataTable, Column } from '../../components/common/DataTable';
import { GST_STATES, getStateCodeFromGSTIN } from '../../utils/gstEngine';
import { formatINR } from '../../utils/currency';
import { exportToCSV, downloadPartyTemplateCSV, parseCSVFile } from '../../utils/csvHelper';
import { useNotification } from '../../context/NotificationContext';

export const PartiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeBusinessId } = useBusiness();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<PartyType | 'all'>('all');
  const [parties, setParties] = useState<Party[]>(() => storageService.getParties(activeBusinessId));
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new-customer');
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Party>>({
    type: 'customer',
    name: '',
    business_name: '',
    phone: '',
    email: '',
    gstin: '',
    pan: '',
    address: '',
    city: '',
    state: 'Gujarat',
    state_code: '24',
    pincode: '',
    credit_limit: 50000,
    opening_balance: 0,
    opening_balance_type: 'receive',
    notes: '',
  });

  const reloadParties = () => {
    setParties(storageService.getParties(activeBusinessId));
  };

  const filteredParties = useMemo(() => {
    if (activeTab === 'all') return parties;
    return parties.filter((p) => p.type === activeTab || p.type === 'both');
  }, [parties, activeTab]);

  const handleOpenAddModal = (type: PartyType = 'customer') => {
    setEditingParty(null);
    setFormData({
      type,
      name: '',
      business_name: '',
      phone: '',
      email: '',
      gstin: '',
      pan: '',
      address: '',
      city: '',
      state: 'Gujarat',
      state_code: '24',
      pincode: '',
      credit_limit: 50000,
      opening_balance: 0,
      opening_balance_type: 'receive',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (party: Party) => {
    setEditingParty(party);
    setFormData(party);
    setIsModalOpen(true);
  };

  const handleGSTChange = (gstinVal: string) => {
    const clean = gstinVal.toUpperCase();
    const code = getStateCodeFromGSTIN(clean);
    const matchedState = GST_STATES.find((s) => s.code === code);
    let autoPan = formData.pan || '';
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

  const handleSaveParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const saved = storageService.saveParty({
      ...(formData as Party),
      id: editingParty?.id || crypto.randomUUID(),
      business_id: activeBusinessId,
      name: formData.name.trim(),
      type: formData.type || 'customer',
      opening_balance: Number(formData.opening_balance || 0),
      current_balance: editingParty ? editingParty.current_balance : Number(formData.opening_balance || 0),
      credit_limit: Number(formData.credit_limit || 0),
      is_active: true,
      created_at: editingParty?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    showToast({
      type: 'success',
      title: editingParty ? 'Party Updated' : 'Party Created',
      message: `${saved.name} saved successfully.`,
    });

    setIsModalOpen(false);
    reloadParties();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      storageService.deleteParty(id);
      showToast({ type: 'info', title: 'Party Deleted', message: `${name} has been archived.` });
      reloadParties();
    }
  };

  const handleExportCSV = () => {
    exportToCSV(`parties_${activeTab}_export`, filteredParties);
    showToast({ type: 'success', title: 'Export Complete', message: 'Parties exported to CSV.' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows: any[] = await parseCSVFile(file);
      let count = 0;
      rows.forEach((r) => {
        if (r.Name) {
          storageService.saveParty({
            id: crypto.randomUUID(),
            business_id: activeBusinessId,
            name: String(r.Name).trim(),
            type: (r.Type?.toLowerCase() === 'supplier' ? 'supplier' : 'customer') as PartyType,
            business_name: r.BusinessName || '',
            phone: String(r.Phone || ''),
            email: r.Email || '',
            gstin: r.GSTIN || '',
            pan: r.PAN || '',
            address: r.Address || '',
            city: r.City || '',
            state: r.State || 'Gujarat',
            state_code: r.StateCode ? String(r.StateCode).padStart(2, '0') : '24',
            pincode: String(r.Pincode || ''),
            credit_limit: Number(r.CreditLimit || 50000),
            opening_balance: Number(r.OpeningBalance || 0),
            opening_balance_type: 'receive',
            current_balance: Number(r.OpeningBalance || 0),
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          count++;
        }
      });
      showToast({ type: 'success', title: 'Import Successful', message: `Imported ${count} parties.` });
      reloadParties();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Import Failed', message: err.message });
    }
  };

  const columns: Column<Party>[] = [
    {
      key: 'name',
      header: 'Party Name',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            {p.name}
            {p.type === 'both' && <Badge size="sm" variant="purple">Both</Badge>}
          </p>
          {p.business_name && (
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              {p.business_name}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact & Location',
      render: (p) => (
        <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
          {p.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {p.phone}</p>}
          <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {p.city || '-'}, {p.state}</p>
        </div>
      ),
    },
    {
      key: 'gstin',
      header: 'GSTIN / PAN',
      render: (p) => (
        <div className="text-xs">
          {p.gstin ? (
            <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">{p.gstin}</span>
          ) : (
            <span className="text-slate-400">Unregistered</span>
          )}
        </div>
      ),
    },
    {
      key: 'current_balance',
      header: 'Balance',
      sortable: true,
      render: (p) => {
        const bal = p.current_balance || 0;
        const isReceivable = bal > 0;
        const isPayable = bal < 0;
        return (
          <div>
            <p
              className={`font-semibold font-mono text-sm ${
                isReceivable
                  ? 'text-rose-600 dark:text-rose-400'
                  : isPayable
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              {formatINR(Math.abs(bal))}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">
              {isReceivable ? 'Receivable (Due)' : isPayable ? 'Payable' : 'Settled'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/invoices/new?partyId=${p.id}`)}
            title="Create Invoice for Customer"
            className="p-1.5 h-7 text-indigo-600"
          >
            <FileText className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(p)}
            className="p-1.5 h-7 text-slate-600"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(p.id, p.name)}
            className="p-1.5 h-7 text-rose-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
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
            Customers & Suppliers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your party directory, GST states, credit limits and balances
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </span>
          </label>

          <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export
          </Button>

          <Button size="sm" onClick={() => handleOpenAddModal('customer')} leftIcon={<Plus className="w-4 h-4" />}>
            Add Party
          </Button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Parties ({parties.length})
        </button>
        <button
          onClick={() => setActiveTab('customer')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'customer'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Customers ({parties.filter((p) => p.type === 'customer' || p.type === 'both').length})
        </button>
        <button
          onClick={() => setActiveTab('supplier')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'supplier'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Suppliers ({parties.filter((p) => p.type === 'supplier' || p.type === 'both').length})
        </button>
      </div>

      {/* Parties Table */}
      <DataTable
        columns={columns}
        data={filteredParties}
        searchPlaceholder="Search by name, business, phone, GSTIN..."
        searchKeys={['name', 'business_name', 'phone', 'email', 'gstin', 'city']}
        onRowClick={(p) => navigate(`/parties/${p.id}`)}
        emptyTitle="No parties found"
        emptyDescription="Create a customer or supplier to start issuing invoices."
        emptyAction={
          <Button size="sm" onClick={() => handleOpenAddModal('customer')} leftIcon={<Plus className="w-4 h-4" />}>
            Add First Party
          </Button>
        }
      />

      {/* Add / Edit Party Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingParty ? 'Edit Party' : 'Add New Party'}
        description="Enter customer or supplier details for invoicing and ledger tracking."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveParty} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Party Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as PartyType })}
              options={[
                { value: 'customer', label: 'Customer' },
                { value: 'supplier', label: 'Supplier' },
                { value: 'both', label: 'Both (Customer & Supplier)' },
              ]}
              required
            />
            <div className="sm:col-span-2">
              <Input
                label="Contact Person / Full Name"
                placeholder="e.g. Rajesh Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Company / Trade Name"
              placeholder="e.g. Apex Enterprises"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
            />
            <Input
              label="Phone Number"
              placeholder="+91 98250 11223"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="GSTIN (15-digit)"
              placeholder="e.g. 24AAACA1234F1Z5"
              value={formData.gstin}
              onChange={(e) => handleGSTChange(e.target.value)}
            />
            <Input
              label="PAN"
              placeholder="e.g. AAACA1234F"
              value={formData.pan}
              onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
            />
          </div>

          <Input
            label="Street Address / Office No."
            placeholder="401, Sapphire Arcade, CG Road"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="City"
              placeholder="Ahmedabad"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Select
              label="State (Place of Supply)"
              value={formData.state_code}
              onChange={(e) => {
                const sObj = GST_STATES.find((s) => s.code === e.target.value);
                setFormData({
                  ...formData,
                  state_code: e.target.value,
                  state: sObj?.name || formData.state,
                });
              }}
              options={GST_STATES.map((s) => ({
                value: s.code,
                label: `${s.code} - ${s.name}`,
              }))}
            />
            <Input
              label="PIN Code"
              placeholder="380006"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Input
              label="Credit Limit (₹)"
              type="number"
              value={formData.credit_limit}
              onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
            />
            <Input
              label="Opening Balance (₹)"
              type="number"
              value={formData.opening_balance}
              onChange={(e) => setFormData({ ...formData, opening_balance: Number(e.target.value) })}
              disabled={!!editingParty}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={downloadPartyTemplateCSV}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Download Sample CSV Template
            </button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {editingParty ? 'Save Changes' : 'Create Party'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
