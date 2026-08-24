import { PublicPaymentPage } from '../pages/PublicPaymentPage';
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../features/auth/LoginPage';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { InvoicesListPage } from '../features/invoices/InvoicesListPage';
import { InvoiceBuilderPage } from '../features/invoices/InvoiceBuilderPage';
import { InvoiceDetailPage } from '../features/invoices/InvoiceDetailPage';
import { QuotationsListPage } from '../features/quotations/QuotationsListPage';
import { QuotationBuilderPage } from '../features/quotations/QuotationBuilderPage';
import { QuotationDetailPage } from '../features/quotations/QuotationDetailPage';
import { PartiesPage } from '../features/parties/PartiesPage';
import { PartyDetailPage } from '../features/parties/PartyDetailPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { PurchasesPage } from '../features/purchases/PurchasesPage';
import { PaymentsPage } from '../features/payments/PaymentsPage';
import { ExpensesPage } from '../features/expenses/ExpensesPage';
import { ReturnsPage } from '../features/returns/ReturnsPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { SettingsPage } from '../features/settings/SettingsPage';

export const router = createBrowserRouter([
  // Public Marketing Landing Page
  {
    path: '/',
    element: <LandingPage />,
  },
  // Public Auth
  {
    path: '/login',
    element: <LoginPage />,
  },
  // Business Onboarding Wizard
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  // Public Instant UPI Pay Gateway (For Invoices & PDFs)
  {
    path: '/pay',
    element: <PublicPaymentPage />,
  },
  // Main Authenticated SaaS App (Wrapped with AppLayout, Sidebar, Navbar, Guards)
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      // Invoices
      {
        path: 'invoices',
        element: <InvoicesListPage />,
      },
      {
        path: 'invoices/new',
        element: <InvoiceBuilderPage />,
      },
      {
        path: 'invoices/:id',
        element: <InvoiceDetailPage />,
      },
      {
        path: 'invoices/:id/edit',
        element: <InvoiceBuilderPage />,
      },
      // Quotations
      {
        path: 'quotations',
        element: <QuotationsListPage />,
      },
      {
        path: 'quotations/new',
        element: <QuotationBuilderPage />,
      },
      {
        path: 'quotations/:id',
        element: <QuotationDetailPage />,
      },
      // Parties
      {
        path: 'parties',
        element: <PartiesPage />,
      },
      {
        path: 'parties/:id',
        element: <PartyDetailPage />,
      },
      // Products & Inventory
      {
        path: 'products',
        element: <ProductsPage />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
      // Purchases
      {
        path: 'purchases',
        element: <PurchasesPage />,
      },
      // Payments
      {
        path: 'payments',
        element: <PaymentsPage />,
      },
      // Expenses
      {
        path: 'expenses',
        element: <ExpensesPage />,
      },
      // Returns
      {
        path: 'returns',
        element: <ReturnsPage />,
      },
      // Reports
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      // Settings
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  // Catch all fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
