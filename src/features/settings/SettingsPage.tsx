import React, { useState } from 'react';
import {
  Building2,
  FileCheck,
  CreditCard,
  QrCode,
  Users,
  ShieldCheck,
  Download,
  Save,
  CheckCircle2,
  FileText,
  Clock,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Badge } from '../../components/common/Badge';
import { GST_STATES } from '../../utils/gstEngine';
import { formatDate } from '../../utils/currency';
import { useNotification } from '../../context/NotificationContext';

export const SettingsPage: React.FC = () => {
  const { activeBusiness, updateActiveBusiness, activeBusinessId } = useBusiness();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'profile' | 'tax' | 'invoice' | 'bank' | 'team' | 'audit' | 'backup'>('profile');

  // Business Profile State
  const [formData, setFormData] = useState({
    name: activeBusiness?.name || '',
    tagline: activeBusiness?.tagline || '',
    business_type: activeBusiness?.business_type || 'Retail',
    email: activeBusiness?.email || '',
    phone: activeBusiness?.phone || '',
    website: activeBusiness?.website || '',
    address_line1: activeBusiness?.address_line1 || '',
    city: activeBusiness?.city || '',
    state: activeBusiness?.state || 'Gujarat',
    state_code: activeBusiness?.state_code || '24',
    pincode: activeBusiness?.pincode || '',
    is_gst_registered: activeBusiness?.is_gst_registered || false,
    gstin: activeBusiness?.gstin || '',
    pan: activeBusiness?.pan || '',
    invoice_prefix: activeBusiness?.invoice_prefix || 'INV',
    default_payment_terms: activeBusiness?.default_payment_terms || 'Due on Receipt',
    default_notes: activeBusiness?.default_notes || '',
    default_terms_conditions: activeBusiness?.default_terms_conditions || '',
    bank_name: activeBusiness?.bank_name || '',
    account_name: activeBusiness?.account_name || '',
    account_number: activeBusiness?.account_number || '',
    ifsc_code: activeBusiness?.ifsc_code || '',
    branch_name: activeBusiness?.branch_name || '',
    upi_id: activeBusiness?.upi_id || '',
    upi_qr_enabled: activeBusiness?.upi_qr_enabled ?? true,
    logo_url: activeBusiness?.logo_url || '',
    signature_url: activeBusiness?.signature_url || '',
  });

  const auditLogs = storageService.getAuditLogs(activeBusinessId);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateActiveBusiness(formData);
    showToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Business configurations updated successfully.',
    });
  };

  const handleDownloadFullBackup = () => {
    const jsonStr = storageService.exportAllData(activeBusinessId);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BillVibe_Backup_${activeBusiness?.name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'Backup Downloaded', message: 'Complete JSON archive saved.' });
  };

  const teamMembers = [
    { name: 'Dhruv Patel (You)', email: 'dhruv@shreehari.com', role: 'Owner', permissions: 'Full Superadmin Access' },
    { name: 'Priya Mehta', email: 'accounts@shreehari.com', role: 'Accountant', permissions: 'Invoicing, Payments & GST Reports' },
    { name: 'Ravi Kumar', email: 'sales@shreehari.com', role: 'Staff', permissions: 'Create Invoices & Quotations' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
          Business Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure business details, GST rules, invoice numbering, bank details, and team members
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Company Profile
        </button>
        <button
          onClick={() => setActiveTab('tax')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'tax' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          GST & Tax
        </button>
        <button
          onClick={() => setActiveTab('invoice')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'invoice' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Invoice Numbering & Terms
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'bank' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Bank & UPI QR
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'team' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Team & Roles
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Audit Log
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'backup' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Data Backup
        </button>
      </div>

      {/* Profile Form */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 max-w-2xl">
          <Input
            label="Business / Trading Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Business Tagline / Subtitle"
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Official Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <Input
            label="Street Address"
            value={formData.address_line1}
            onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="City"
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
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Input
              label="Business Logo URL"
              placeholder="https://.../logo.png"
              value={formData.logo_url || ''}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              helperText="Displays at top left of invoices"
            />
            <Input
              label="Digital Signature / Stamp URL"
              placeholder="https://.../signature.png"
              value={formData.signature_url || ''}
              onChange={(e) => setFormData({ ...formData, signature_url: e.target.value })}
              helperText="Appears above Authorized Signatory line"
            />
          </div>
          <div className="pt-2">
            <Button type="submit" size="sm" leftIcon={<Save className="w-4 h-4" />}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      )}

      {/* GST & Tax */}
      {activeTab === 'tax' && (
        <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 max-w-2xl">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_gst_registered}
                onChange={(e) => setFormData({ ...formData, is_gst_registered: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Registered under Indian GST</span>
            </label>
          </div>
          <Input
            label="GSTIN (15-Digit)"
            placeholder="24AABCS1429B1Z8"
            value={formData.gstin}
            onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
          />
          <Input
            label="PAN"
            placeholder="AABCS1429B"
            value={formData.pan}
            onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
          />
          <div className="pt-2">
            <Button type="submit" size="sm" leftIcon={<Save className="w-4 h-4" />}>
              Save Tax Settings
            </Button>
          </div>
        </form>
      )}

      {/* Invoice Settings & Numbering */}
      {activeTab === 'invoice' && (
        <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Invoice Series Prefix"
              value={formData.invoice_prefix}
              onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value.toUpperCase() })}
              helperText="Example: SHE-26 -> SHE-26-00001"
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
          <Input
            label="Default Customer Notes"
            value={formData.default_notes}
            onChange={(e) => setFormData({ ...formData, default_notes: e.target.value })}
          />
          <Textarea
            label="Default Terms & Conditions"
            rows={3}
            value={formData.default_terms_conditions}
            onChange={(e) => setFormData({ ...formData, default_terms_conditions: e.target.value })}
          />
          <div className="pt-2">
            <Button type="submit" size="sm" leftIcon={<Save className="w-4 h-4" />}>
              Save Invoicing Defaults
            </Button>
          </div>
        </form>
      )}

      {/* Bank & UPI QR */}
      {activeTab === 'bank' && (
        <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 max-w-2xl">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.upi_qr_enabled}
                onChange={(e) => setFormData({ ...formData, upi_qr_enabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Enable Dynamic UPI Payment QR Code on all invoices</span>
            </label>
          </div>
          <Input
            label="UPI ID (VPA) for Payment QR"
            placeholder="e.g. shreehari@okhdfcbank"
            value={formData.upi_id}
            onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Input
              label="Bank Name"
              placeholder="e.g. HDFC Bank"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
            />
            <Input
              label="Account Holder Name"
              placeholder="e.g. Shree Hari Electronics"
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Account Number"
              placeholder="50200041234567"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            />
            <Input
              label="IFSC Code"
              placeholder="HDFC0000123"
              value={formData.ifsc_code}
              onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="pt-2">
            <Button type="submit" size="sm" leftIcon={<Save className="w-4 h-4" />}>
              Save Bank & UPI Details
            </Button>
          </div>
        </form>
      )}

      {/* Team & Roles */}
      {activeTab === 'team' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 max-w-3xl w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Team Members & Permissions</h3>
              <p className="text-xs text-slate-500">Collaborate with accountants and staff</p>
            </div>
            <Button size="sm" leftIcon={<Users className="w-3.5 h-3.5" />}>
              Invite Member
            </Button>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {teamMembers.map((m, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{m.name}</p>
                      <p className="text-slate-400">{m.email}</p>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={m.role === 'Owner' ? 'purple' : 'info'}>{m.role}</Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{m.permissions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 max-w-4xl w-full overflow-hidden">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Audit Trail History</h3>
            <span className="text-xs text-slate-400">{auditLogs.length} Events logged</span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No events logged yet.</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Entity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-3 px-3 text-slate-500">{formatDate(log.created_at, 'long')}</td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">{log.user_email || 'Owner'}</td>
                      <td className="py-3 px-3">
                        <Badge variant="neutral">{log.action}</Badge>
                      </td>
                      <td className="py-3 px-3 uppercase text-slate-600 dark:text-slate-400">{log.entity_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Backup & Export */}
      {activeTab === 'backup' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Complete Business Data Export</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Export all invoices, items, customer ledgers, payments, and audit logs into a portable JSON backup.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Export All Data</p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-400">Includes Invoices, Parties, Catalog, Payments & Logs</p>
            </div>
            <Button size="sm" onClick={handleDownloadFullBackup} leftIcon={<Download className="w-4 h-4" />}>
              Download JSON Backup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
