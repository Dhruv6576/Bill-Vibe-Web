import { supabaseSync } from '../services/supabaseSync';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Business } from '../types';
import { storageService } from '../services/storageService';
import { useAuth } from './AuthContext';

interface BusinessContextType {
  businesses: Business[];
  activeBusiness: Business | null;
  activeBusinessId: string;
  isLoading: boolean;
  setActiveBusinessId: (id: string) => void;
  createBusiness: (data: Partial<Business>) => Business;
  updateActiveBusiness: (data: Partial<Business>) => Business | null;
  refreshBusinesses: () => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessIdState] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    // 1. Instant local load
    const list = storageService.getBusinesses(user?.id);
    setBusinesses(list);
    let activeId = storageService.getActiveBusinessId();
    if (list.some((b) => b.id === activeId)) {
      setActiveBusinessIdState(activeId);
    } else if (list.length > 0) {
      activeId = list[0].id;
      setActiveBusinessIdState(activeId);
      storageService.setActiveBusinessId(activeId);
    } else {
      setActiveBusinessIdState('');
    }

    // 2. Fetch from Supabase tables
    if (user?.id) {
      try {
        const remote = await supabaseSync.pullBusinesses(user.id);
        if (remote && remote.length > 0) {
          remote.forEach((b) => storageService.saveBusiness(b));
          const updatedList = storageService.getBusinesses(user.id);
          setBusinesses(updatedList);
          if (!activeId || !updatedList.some((b) => b.id === activeId)) {
            const nextActive = updatedList[0].id;
            setActiveBusinessIdState(nextActive);
            storageService.setActiveBusinessId(nextActive);
          }
        }
      } catch (err) {
        console.warn('Error pulling remote businesses:', err);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (!isAuthLoading) {
      loadData();
    }
  }, [user, isAuthLoading]);

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
      is_gst_registered: !!data.is_gst_registered,
      tax_preference: data.tax_preference || 'exclusive',
      currency: 'INR',
      currency_symbol: '₹',
      invoice_prefix: data.invoice_prefix || 'INV',
      starting_invoice_number: 1,
      current_invoice_sequence: 0,
      quotation_prefix: 'QTN',
      purchase_prefix: 'PUR',
      default_payment_terms: 'Due on Receipt',
      default_notes: 'Thank you for your business!',
      default_terms_conditions: 'Payment is due within payment terms. Late fees may apply.',
      active_template_id: 'modern',
      upi_qr_enabled: true,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Business;

    const saved = storageService.saveBusiness(newBiz);
    loadData();
    return saved;
  };

  const updateActiveBusiness = (data: Partial<Business>): Business | null => {
    if (!activeBusinessId) return null;
    const current = businesses.find((b) => b.id === activeBusinessId);
    if (!current) return null;
    const updated = { ...current, ...data, updated_at: new Date().toISOString() };
    storageService.saveBusiness(updated);
    loadData();
    return updated;
  };

  const refreshBusinesses = () => {
    loadData();
  };

  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) || businesses[0] || null;

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusiness,
        activeBusinessId,
        isLoading,
        setActiveBusinessId,
        createBusiness,
        updateActiveBusiness,
        refreshBusinesses,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
