import React, { createContext, useContext, useEffect, useState } from 'react';
import { Business } from '../types';
import { storageService } from '../services/storageService';
import { useAuth } from './AuthContext';

interface BusinessContextType {
  businesses: Business[];
  activeBusiness: Business | null;
  activeBusinessId: string;
  setActiveBusinessId: (id: string) => void;
  createBusiness: (data: Partial<Business>) => Business;
  updateActiveBusiness: (data: Partial<Business>) => Business | null;
  refreshBusinesses: () => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessIdState] = useState<string>('');

  const loadData = () => {
    const list = storageService.getBusinesses(user?.id);
    setBusinesses(list);
    const activeId = storageService.getActiveBusinessId();
    if (list.some((b) => b.id === activeId)) {
      setActiveBusinessIdState(activeId);
    } else if (list.length > 0) {
      setActiveBusinessIdState(list[0].id);
      storageService.setActiveBusinessId(list[0].id);
    } else {
      setActiveBusinessIdState('');
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const setActiveBusinessId = (id: string) => {
    setActiveBusinessIdState(id);
    storageService.setActiveBusinessId(id);
  };

  const createBusiness = (data: Partial<Business>): Business => {
    const newBiz: Business = {
      id: crypto.randomUUID(),
      owner_id: user?.id || '00000000-0000-0000-0000-000000000001',
      name: data.name || 'New Enterprise',
      business_type: data.business_type || 'Retail',
      currency: 'INR',
      currency_symbol: '₹',
      invoice_prefix: data.invoice_prefix || 'INV',
      starting_invoice_number: 1,
      current_invoice_sequence: 0,
      quotation_prefix: 'QTN',
      purchase_prefix: 'PUR',
      default_payment_terms: 'Due on Receipt',
      default_notes: 'Thank you for your business!',
      default_terms_conditions: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. for delayed payment.',
      is_gst_registered: !!data.gstin,
      tax_preference: 'exclusive',
      upi_qr_enabled: true,
      active_template_id: 'modern',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    };
    storageService.saveBusiness(newBiz);
    loadData();
    setActiveBusinessId(newBiz.id);
    return newBiz;
  };

  const updateActiveBusiness = (data: Partial<Business>): Business | null => {
    const active = businesses.find((b) => b.id === activeBusinessId);
    if (!active) return null;
    const updated = { ...active, ...data };
    storageService.saveBusiness(updated);
    loadData();
    return updated;
  };

  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) || businesses[0] || null;

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusiness,
        activeBusinessId,
        setActiveBusinessId,
        createBusiness,
        updateActiveBusiness,
        refreshBusinesses: loadData,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = (): BusinessContextType => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
