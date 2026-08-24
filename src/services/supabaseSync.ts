import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Business, Party, Product, Invoice, Payment, Expense, Profile } from '../types';

/**
 * Direct real-time Supabase Database Sync Engine
 * Transparently mirrors all entity writes and reads to PostgreSQL tables
 */
export const supabaseSync = {
  // Profiles
  async syncProfile(profile: Profile): Promise<void> {
    if (!isSupabaseConfigured() || !profile?.id) return;
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        phone: profile.phone,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase syncProfile error:', error.message || error);
      }
    } catch (e) {
      console.warn('Supabase syncProfile exception:', e);
    }
  },

  // Businesses
  async syncBusiness(business: Business): Promise<void> {
    if (!isSupabaseConfigured() || !business?.id) return;
    try {
      const payload: any = {
        id: business.id,
        owner_id: business.owner_id,
        name: business.name,
        business_type: business.business_type || 'Retail',
        tagline: business.tagline || null,
        email: business.email || null,
        phone: business.phone || null,
        website: business.website || null,
        address_line1: business.address_line1 || null,
        city: business.city || null,
        state: business.state || 'Gujarat',
        state_code: business.state_code || '24',
        pincode: business.pincode || null,
        logo_url: business.logo_url || null,
        signature_url: business.signature_url || null,
        is_gst_registered: !!business.is_gst_registered,
        gstin: business.gstin || null,
        pan: business.pan || null,
        tax_preference: business.tax_preference || 'exclusive',
        currency: business.currency || 'INR',
        currency_symbol: business.currency_symbol || '₹',
        invoice_prefix: business.invoice_prefix || 'INV',
        current_invoice_sequence: business.current_invoice_sequence || 0,
        bank_name: business.bank_name || null,
        account_name: business.account_name || null,
        account_number: business.account_number || null,
        ifsc_code: business.ifsc_code || null,
        branch_name: business.branch_name || null,
        upi_id: business.upi_id || null,
        upi_qr_enabled: business.upi_qr_enabled ?? true,
        default_payment_terms: business.default_payment_terms || 'Due on Receipt',
        default_notes: business.default_notes || null,
        default_terms_conditions: business.default_terms_conditions || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('businesses').upsert(payload);
      if (error) {
        console.warn('Supabase syncBusiness error:', error.message || error);
      } else {
        console.log('✅ Synced business to Supabase:', business.name);
      }
    } catch (e) {
      console.warn('Supabase syncBusiness exception:', e);
    }
  },

  // Parties
  async syncParty(party: Party): Promise<void> {
    if (!isSupabaseConfigured() || !party?.id) return;
    try {
      const { error } = await supabase.from('parties').upsert({
        id: party.id,
        business_id: party.business_id,
        name: party.name,
        business_name: party.business_name || null,
        party_type: party.type || 'customer',
        email: party.email || null,
        phone: party.phone || null,
        address: party.address || null,
        city: party.city || null,
        state: party.state || 'Gujarat',
        state_code: party.state_code || '24',
        pincode: party.pincode || null,
        is_gst_registered: !!party.gstin,
        gstin: party.gstin || null,
        pan: party.pan || null,
        opening_balance: Number(party.opening_balance) || 0,
        current_balance: Number(party.current_balance) || 0,
        notes: party.notes || null,
        is_active: party.is_active !== false,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase syncParty error:', error.message || error);
      } else {
        console.log('✅ Synced party to Supabase:', party.name);
      }
    } catch (e) {
      console.warn('Supabase syncParty exception:', e);
    }
  },

  // Products
  async syncProduct(product: Product): Promise<void> {
    if (!isSupabaseConfigured() || !product?.id) return;
    try {
      const { error } = await supabase.from('products').upsert({
        id: product.id,
        business_id: product.business_id,
        category_name: product.category_name || null,
        name: product.name,
        sku: product.sku || null,
        hsn_code: product.hsn_code || null,
        description: product.description || null,
        unit: product.unit || 'PCS',
        selling_price: Number(product.selling_price) || 0,
        purchase_price: Number(product.purchase_price) || 0,
        gst_rate: Number(product.gst_rate) || 0,
        tax_type: product.tax_type || 'exclusive',
        cess_rate: Number(product.cess_rate) || 0,
        opening_stock: Number(product.opening_stock) || 0,
        current_stock: Number(product.current_stock) || 0,
        low_stock_threshold: Number(product.low_stock_threshold) || 0,
        barcode: product.barcode || null,
        is_active: product.is_active !== false,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase syncProduct error:', error.message || error);
      } else {
        console.log('✅ Synced product to Supabase:', product.name);
      }
    } catch (e) {
      console.warn('Supabase syncProduct exception:', e);
    }
  },

  // Invoices & Line Items
  async syncInvoice(invoice: Invoice): Promise<void> {
    if (!isSupabaseConfigured() || !invoice?.id) return;
    try {
      const invoicePayload = {
        id: invoice.id,
        business_id: invoice.business_id,
        party_id: invoice.party_id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        status: invoice.status,
        party_name: invoice.party_name,
        party_business_name: invoice.party_business_name || null,
        party_gstin: invoice.party_gstin || null,
        party_phone: invoice.party_phone || null,
        party_email: invoice.party_email || null,
        party_address: invoice.party_address || null,
        party_state: invoice.party_state || 'Gujarat',
        party_state_code: invoice.party_state_code || '24',
        place_of_supply: invoice.place_of_supply || null,
        is_interstate: !!invoice.is_interstate,
        subtotal: Number(invoice.subtotal) || 0,
        discount_type: invoice.discount_type || 'percentage',
        discount_value: Number(invoice.discount_value) || 0,
        discount_amount: Number(invoice.discount_amount) || 0,
        taxable_amount: Number(invoice.taxable_amount) || 0,
        cgst_amount: Number(invoice.cgst_amount) || 0,
        sgst_amount: Number(invoice.sgst_amount) || 0,
        igst_amount: Number(invoice.igst_amount) || 0,
        cess_amount: Number(invoice.cess_amount) || 0,
        total_tax: Number(invoice.total_tax) || 0,
        shipping_charges: Number(invoice.shipping_charges) || 0,
        round_off: Number(invoice.round_off) || 0,
        grand_total: Number(invoice.grand_total) || 0,
        amount_paid: Number(invoice.amount_paid) || 0,
        balance_due: Number(invoice.balance_due) || 0,
        notes: invoice.notes || null,
        terms_conditions: invoice.terms_conditions || null,
        template_id: invoice.template_id || 'modern',
        updated_at: new Date().toISOString(),
      };

      const { error: invError } = await supabase.from('invoices').upsert(invoicePayload);
      if (invError) {
        console.warn('Supabase syncInvoice error:', invError.message || invError);
      } else {
        console.log('✅ Synced invoice to Supabase:', invoice.invoice_number);
      }

      // Line Items
      if (invoice.items && invoice.items.length > 0) {
        await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);
        const itemRows = invoice.items.map((item) => {
          const itemDiscount = (Number(item.rate) * Number(item.quantity) * Number(item.discount_percent || 0)) / 100;
          return {
            id: item.id || crypto.randomUUID(),
            invoice_id: invoice.id,
            product_id: item.product_id || null,
            name: item.name,
            description: item.description || null,
            hsn_code: item.hsn_code || null,
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'PCS',
            rate: Number(item.rate) || 0,
            discount_percent: Number(item.discount_percent) || 0,
            discount_amount: itemDiscount,
            taxable_amount: Number(item.taxable_amount) || 0,
            gst_rate: Number(item.gst_rate) || 0,
            cgst_amount: Number(item.cgst_amount) || 0,
            sgst_amount: Number(item.sgst_amount) || 0,
            igst_amount: Number(item.igst_amount) || 0,
            cess_amount: Number(item.cess_amount) || 0,
            total: Number(item.total) || 0,
          };
        });
        const { error: itemsError } = await supabase.from('invoice_items').insert(itemRows);
        if (itemsError) {
          console.warn('Supabase sync invoice_items error:', itemsError.message || itemsError);
        }
      }
    } catch (e) {
      console.warn('Supabase syncInvoice exception:', e);
    }
  },

  // Payments
  async syncPayment(payment: Payment): Promise<void> {
    if (!isSupabaseConfigured() || !payment?.id) return;
    try {
      const { error } = await supabase.from('payments').upsert({
        id: payment.id,
        business_id: payment.business_id,
        party_id: payment.party_id,
        invoice_id: payment.invoice_id || null,
        payment_number: payment.payment_number,
        payment_date: payment.payment_date,
        amount: Number(payment.amount) || 0,
        payment_method: payment.payment_method || 'cash',
        reference_number: payment.reference_number || null,
        notes: payment.notes || null,
      });
      if (error) {
        console.warn('Supabase syncPayment error:', error.message || error);
      } else {
        console.log('✅ Synced payment to Supabase:', payment.payment_number);
      }
    } catch (e) {
      console.warn('Supabase syncPayment exception:', e);
    }
  },

  // Expenses
  async syncExpense(expense: Expense): Promise<void> {
    if (!isSupabaseConfigured() || !expense?.id) return;
    try {
      const { error } = await supabase.from('expenses').upsert({
        id: expense.id,
        business_id: expense.business_id,
        category_name: expense.category_name,
        title: expense.title,
        amount: Number(expense.amount) || 0,
        expense_date: expense.expense_date,
        payment_method: expense.payment_method || 'cash',
        reference_number: expense.reference_number || null,
        receipt_url: expense.receipt_url || null,
        notes: expense.notes || null,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase syncExpense error:', error.message || error);
      } else {
        console.log('✅ Synced expense to Supabase:', expense.title);
      }
    } catch (e) {
      console.warn('Supabase syncExpense exception:', e);
    }
  },

  // Push All Local Storage Data to Supabase
  async syncAllLocalData(businessId: string): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase is not configured in .env' };
    }
    try {
      // Pull local items from storage
      const businesses = JSON.parse(localStorage.getItem('billvibe_businesses') || '[]');
      const parties = JSON.parse(localStorage.getItem('billvibe_parties') || '[]');
      const products = JSON.parse(localStorage.getItem('billvibe_products') || '[]');
      const invoices = JSON.parse(localStorage.getItem('billvibe_invoices') || '[]');
      const payments = JSON.parse(localStorage.getItem('billvibe_payments') || '[]');
      const expenses = JSON.parse(localStorage.getItem('billvibe_expenses') || '[]');

      for (const b of businesses) {
        await supabaseSync.syncBusiness(b);
      }
      for (const p of parties.filter((x: any) => !businessId || x.business_id === businessId)) {
        await supabaseSync.syncParty(p);
      }
      for (const prod of products.filter((x: any) => !businessId || x.business_id === businessId)) {
        await supabaseSync.syncProduct(prod);
      }
      for (const inv of invoices.filter((x: any) => !businessId || x.business_id === businessId)) {
        await supabaseSync.syncInvoice(inv);
      }
      for (const pay of payments.filter((x: any) => !businessId || x.business_id === businessId)) {
        await supabaseSync.syncPayment(pay);
      }
      for (const exp of expenses.filter((x: any) => !businessId || x.business_id === businessId)) {
        await supabaseSync.syncExpense(exp);
      }

      return { success: true, message: 'All local data successfully synced to Supabase tables!' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Sync error' };
    }
  },

  // Pull All Remote Data from Supabase Tables
  async pullBusinesses(ownerId: string): Promise<Business[]> {
    if (!isSupabaseConfigured() || !ownerId) return [];
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', ownerId);
      if (error || !data) return [];
      return data as Business[];
    } catch {
      return [];
    }
  },

  async pullParties(businessId: string): Promise<Party[]> {
    if (!isSupabaseConfigured() || !businessId) return [];
    try {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true);
      if (error || !data) return [];
      return data as Party[];
    } catch {
      return [];
    }
  },

  async pullProducts(businessId: string): Promise<Product[]> {
    if (!isSupabaseConfigured() || !businessId) return [];
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true);
      if (error || !data) return [];
      return data as Product[];
    } catch {
      return [];
    }
  },

  async pullInvoices(businessId: string): Promise<Invoice[]> {
    if (!isSupabaseConfigured() || !businessId) return [];
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, items:invoice_items(*)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data as Invoice[];
    } catch {
      return [];
    }
  },

  async pullPayments(businessId: string): Promise<Payment[]> {
    if (!isSupabaseConfigured() || !businessId) return [];
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('business_id', businessId);
      if (error || !data) return [];
      return data as Payment[];
    } catch {
      return [];
    }
  },

  async pullExpenses(businessId: string): Promise<Expense[]> {
    if (!isSupabaseConfigured() || !businessId) return [];
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('business_id', businessId);
      if (error || !data) return [];
      return data as Expense[];
    } catch {
      return [];
    }
  },
};
