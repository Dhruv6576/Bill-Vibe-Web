import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Menu,
  Plus,
  Package,
  Boxes,
  ShoppingCart,
  CreditCard,
  Receipt,
  RotateCcw,
  BarChart3,
  Settings,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { clsx } from 'clsx';

export const MobileNav: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const moreItems = [
    { name: 'Quotations', path: '/quotations', icon: FileSpreadsheet },
    { name: 'Products & Items', path: '/products', icon: Package },
    { name: 'Stock & Inventory', path: '/inventory', icon: Boxes },
    { name: 'Purchases', path: '/purchases', icon: ShoppingCart },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Returns & Credit Notes', path: '/returns', icon: RotateCcw },
    { name: 'Reports & Taxes', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Bottom Sticky Tab Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 pb-safe">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center gap-1 w-14 py-1 text-[10px] font-medium transition-colors',
              isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
            )
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/invoices"
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center gap-1 w-14 py-1 text-[10px] font-medium transition-colors',
              isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
            )
          }
        >
          <FileText className="w-5 h-5" />
          <span>Invoices</span>
        </NavLink>

        {/* Center Quick Create Floating Button */}
        <button
          onClick={() => navigate('/invoices/new')}
          className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-95 transition-transform -mt-4 border-2 border-white dark:border-slate-900"
        >
          <Plus className="w-6 h-6" />
        </button>

        <NavLink
          to="/parties"
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center gap-1 w-14 py-1 text-[10px] font-medium transition-colors',
              isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
            )
          }
        >
          <Users className="w-5 h-5" />
          <span>Parties</span>
        </NavLink>

        <button
          onClick={() => setIsMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1 w-14 py-1 text-[10px] font-medium text-slate-500 dark:text-slate-400"
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </div>

      {/* Slide-Up / Side Drawer for Extra Menu Items */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden animate-fade-in">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white dark:bg-slate-900 p-6 shadow-2xl flex flex-col justify-between animate-slide-up">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-base text-slate-900 dark:text-slate-100">All Modules</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-1 overflow-y-auto max-h-[70vh]">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-indigo-50 text-indigo-600 font-semibold dark:bg-indigo-950/60 dark:text-indigo-400'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">BillVibe v1.0.0 • Mobile Suite</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
