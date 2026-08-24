import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Users, Package, CreditCard, Receipt, Settings, ArrowRight, X } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { activeBusinessId } = useBusiness();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const invoices = storageService.getInvoices(activeBusinessId);
  const parties = storageService.getParties(activeBusinessId);
  const products = storageService.getProducts(activeBusinessId);

  const q = query.toLowerCase().trim();

  const filteredInvoices = q
    ? invoices.filter((i) => i.invoice_number.toLowerCase().includes(q) || i.party_name.toLowerCase().includes(q)).slice(0, 4)
    : [];

  const filteredParties = q
    ? parties.filter((p) => p.name.toLowerCase().includes(q) || (p.business_name && p.business_name.toLowerCase().includes(q))).slice(0, 4)
    : [];

  const filteredProducts = q
    ? products.filter((pr) => pr.name.toLowerCase().includes(q) || (pr.sku && pr.sku.toLowerCase().includes(q))).slice(0, 4)
    : [];

  const quickLinks = [
    { label: 'Create New Invoice', path: '/invoices/new', icon: <FileText className="w-4 h-4 text-indigo-500" /> },
    { label: 'Add New Customer', path: '/parties?action=new-customer', icon: <Users className="w-4 h-4 text-emerald-500" /> },
    { label: 'Add New Product', path: '/products?action=new', icon: <Package className="w-4 h-4 text-amber-500" /> },
    { label: 'Record Payment', path: '/payments', icon: <CreditCard className="w-4 h-4 text-sky-500" /> },
    { label: 'Add Expense', path: '/expenses', icon: <Receipt className="w-4 h-4 text-rose-500" /> },
    { label: 'Business Settings', path: '/settings', icon: <Settings className="w-4 h-4 text-slate-500" /> },
  ];

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up z-10">
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search invoices, customers, products, settings... (ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full px-3 py-4 text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Quick Actions if query is empty */}
          {!query && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
                Quick Shortcuts
              </div>
              <div className="space-y-1">
                {quickLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => handleSelect(link.path)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {link.icon}
                      <span>{link.label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {query && (
            <>
              {filteredInvoices.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                    Invoices
                  </div>
                  {filteredInvoices.map((inv) => (
                    <button
                      key={inv.id}
                      onClick={() => handleSelect(`/invoices/${inv.id}`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{inv.invoice_number}</p>
                          <p className="text-xs text-slate-400">{inv.party_name}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        ₹ {inv.grand_total.toLocaleString('en-IN')}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {filteredParties.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                    Customers & Suppliers
                  </div>
                  {filteredParties.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect(`/parties/${p.id}`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-emerald-500" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.business_name || p.phone}</p>
                        </div>
                      </div>
                      <span className="text-xs capitalize text-slate-400">{p.type}</span>
                    </button>
                  ))}
                </div>
              )}

              {filteredProducts.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                    Products & Items
                  </div>
                  {filteredProducts.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => handleSelect('/products')}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Package className="w-4 h-4 text-amber-500" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{prod.name}</p>
                          <p className="text-xs text-slate-400">SKU: {prod.sku || '-'} | Stock: {prod.current_stock}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        ₹ {prod.selling_price.toLocaleString('en-IN')}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {filteredInvoices.length === 0 && filteredParties.length === 0 && filteredProducts.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-400">
                  No matching results for "{query}"
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">ESC</kbd> to close</span>
          <span>BillVibe Command Palette</span>
        </div>
      </div>
    </div>
  );
};
