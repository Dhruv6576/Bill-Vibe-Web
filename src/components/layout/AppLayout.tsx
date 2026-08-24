import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../feedback/ToastContainer';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { businesses, isLoading: isBusinessLoading } = useBusiness();

  if (isAuthLoading || isBusinessLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500">Syncing with Cloud...</span>
        </div>
      </div>
    );
  }

  // If not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user has no business after cloud sync finishes, redirect to onboarding
  if (businesses.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans w-full max-w-full overflow-x-hidden">
      {/* Desktop Sidebar (Fixed) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen min-w-0 w-full max-w-full pb-20 lg:pb-8">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
