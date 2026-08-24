import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Download,
  Calendar,
  Trash2,
  PieChart as PieIcon,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { Expense, PaymentMethod } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { DataTable, Column } from '../../components/common/DataTable';
import { formatINR, formatDate } from '../../utils/currency';
import { exportToCSV } from '../../utils/csvHelper';
import { useNotification } from '../../context/NotificationContext';

export const ExpensesPage: React.FC = () => {
  const { activeBusinessId } = useBusiness();
  const { showToast } = useNotification();

  const [expenses, setExpenses] = useState<Expense[]>(() => storageService.getExpenses(activeBusinessId));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [categoryName, setCategoryName] = useState('Rent');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');

  const reloadData = () => {
    setExpenses(storageService.getExpenses(activeBusinessId));
  };

  const filteredExpenses = useMemo(() => {
    if (selectedCategory === 'all') return expenses;
    return expenses.filter((e) => e.category_name === selectedCategory);
  }, [expenses, selectedCategory]);

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    storageService.saveExpense({
      id: crypto.randomUUID(),
      business_id: activeBusinessId,
      title: title.trim(),
      category_name: categoryName,
      amount,
      expense_date: date,
      payment_method: method,
      reference_number: refNumber.trim(),
      notes: notes.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    showToast({
      type: 'success',
      title: 'Expense Recorded',
      message: `₹ ${amount.toLocaleString('en-IN')} recorded under ${categoryName}.`,
    });

    setIsModalOpen(false);
    setTitle('');
    setAmount(0);
    setRefNumber('');
    setNotes('');
    reloadData();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete expense "${name}"?`)) {
      storageService.deleteExpense(id);
      showToast({ type: 'info', title: 'Expense Deleted', message: `${name} removed.` });
      reloadData();
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredExpenses.map((e) => ({
      Title: e.title,
      Category: e.category_name,
      Amount: e.amount,
      Date: e.expense_date,
      PaymentMethod: e.payment_method,
      Reference: e.reference_number || '',
      Notes: e.notes || '',
    }));
    exportToCSV(`expenses_${selectedCategory}_export`, exportData);
    showToast({ type: 'success', title: 'Export Complete', message: 'Expenses exported to CSV.' });
  };

  const categoriesList = [
    'Rent',
    'Electricity',
    'Internet & Utilities',
    'Salary & Wages',
    'Transport & Logistics',
    'Marketing & Ads',
    'Software & Subscriptions',
    'Office Supplies',
    'Maintenance',
    'Other',
  ];

  const columns: Column<Expense>[] = [
    {
      key: 'title',
      header: 'Expense Item',
      sortable: true,
      render: (e) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{e.title}</p>
          <span className="text-[10px] text-slate-400 block">{formatDate(e.expense_date)}</span>
        </div>
      ),
    },
    {
      key: 'category_name',
      header: 'Category',
      sortable: true,
      render: (e) => <Badge variant="neutral">{e.category_name}</Badge>,
    },
    {
      key: 'payment_method',
      header: 'Paid Via',
      render: (e) => (
        <span className="text-xs font-mono uppercase text-slate-600 dark:text-slate-400">
          {e.payment_method}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      className: 'text-right',
      render: (e) => (
        <span className="font-bold font-mono text-rose-600 dark:text-rose-400 text-sm">
          {formatINR(e.amount)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (e) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(e.id, e.title)}
          className="p-1.5 h-7 text-rose-500"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
            Business Expenses
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log overhead costs, operational expenses and track business profitability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Record Expense
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Operational Expenses
          </span>
          <span className="text-2xl font-bold font-display font-mono text-rose-600 dark:text-rose-400 mt-1 block">
            {formatINR(totalExpense)}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Expense Records
          </span>
          <span className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100 mt-1 block">
            {expenses.length} Records
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Largest Expense Item
          </span>
          <span className="text-2xl font-bold font-display text-slate-800 dark:text-slate-200 mt-1 block truncate">
            Commercial Rent
          </span>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          All Categories ({expenses.length})
        </button>
        {categoriesList.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredExpenses}
        searchPlaceholder="Search expenses by title or category..."
        searchKeys={['title', 'category_name', 'notes']}
        emptyTitle="No expenses recorded"
        emptyDescription="Record rent, salaries, utilities and office costs to calculate real net profit."
        emptyAction={
          <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Record First Expense
          </Button>
        }
      />

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Business Expense"
        description="Log an operational expenditure with category and payment method."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Expense Title"
            placeholder="e.g. Office Internet Bill, Showroom Rent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Expense Category"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              options={categoriesList.map((c) => ({ value: c, label: c }))}
              required
            />
            <Input
              label="Amount Paid (₹)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Select
              label="Payment Method"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              options={[
                { value: 'bank_transfer', label: 'Bank Transfer (NEFT / IMPS)' },
                { value: 'upi', label: 'UPI (GPay / PhonePe / Paytm)' },
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Card' },
                { value: 'cheque', label: 'Cheque' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>

          <Input
            label="Reference / Bill / Voucher No."
            placeholder="e.g. INV-9812 / NEFT-28912"
            value={refNumber}
            onChange={(e) => setRefNumber(e.target.value)}
          />

          <Input
            label="Notes"
            placeholder="e.g. Monthly payment for high-speed fiber connection"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
