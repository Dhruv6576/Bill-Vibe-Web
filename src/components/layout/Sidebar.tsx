import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  Users,
  Package,
  Boxes,
  ShoppingCart,
  CreditCard,
  Receipt,
  RotateCcw,
  BarChart3,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Invoices', path: '/invoices', icon: FileText, badge: 'GST' },
  { name: 'Quotations', path: '/quotations', icon: FileSpreadsheet },
  { name: 'Parties', path: '/parties', icon: Users },
  { name: 'Products', path: '/products', icon: Package },
  { name: 'Inventory', path: '/inventory', icon: Boxes },
  { name: 'Purchases', path: '/purchases', icon: ShoppingCart },
  { name: 'Payments', path: '/payments', icon: CreditCard },
  { name: 'Expenses', path: '/expenses', icon: Receipt },
  { name: 'Returns & Notes', path: '/returns', icon: RotateCcw },
  { name: 'Reports & Taxes', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 z-40 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
          <Zap className="w-4 h-4 fill-white" />
        </div>
        <div>
          <span className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight">
            BillVibe
          </span>
          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 uppercase">
            GST Pro
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20 font-semibold dark:bg-indigo-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={clsx(
                        'w-4 h-4 transition-transform group-hover:scale-105',
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      )}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={clsx(
                        'text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Upgrade Banner / Support widget */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-indigo-950/40 dark:to-slate-800/60 border border-indigo-200/60 dark:border-indigo-800/40">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Unlimited Invoices</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Indian GST Compliant, Multi-Business & UPI enabled.
          </p>
        </div>
      </div>
    </aside>
  );
};
