import { supabaseSync } from './supabaseSync';
import {
  Business,
  BusinessMember,
  Party,
  Product,
  ProductCategory,
  Invoice,
  Quotation,
  Payment,
  Expense,
  ExpenseCategory,
  Purchase,
  InventoryTransaction,
  InventoryTransactionType,
  Notification,
  AuditLog,
  Profile,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEYS = {
  PROFILES: 'billvibe_profiles',
  BUSINESSES: 'billvibe_businesses',
  BUSINESS_MEMBERS: 'billvibe_business_members',
  PARTIES: 'billvibe_parties',
  CATEGORIES: 'billvibe_categories',
  PRODUCTS: 'billvibe_products',
  INVENTORY_TX: 'billvibe_inventory_transactions',
  INVOICES: 'billvibe_invoices',
  QUOTATIONS: 'billvibe_quotations',
  PAYMENTS: 'billvibe_payments',
  EXPENSES: 'billvibe_expenses',
  EXPENSE_CATEGORIES: 'billvibe_expense_categories',
  PURCHASES: 'billvibe_purchases',
  NOTIFICATIONS: 'billvibe_notifications',
  AUDIT_LOGS: 'billvibe_audit_logs',
  ACTIVE_BUSINESS_ID: 'billvibe_active_business_id',
  CURRENT_USER: 'billvibe_current_user',
};

// Initial Seed Data
const DEFAULT_USER: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@shreehari.com',
  full_name: 'Dhruv Patel',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  phone: '+91 98765 43210',
  created_at: new Date().toISOString(),
};

const DEFAULT_BUSINESS: Business = {
  id: '11111111-1111-1111-1111-111111111111',
  owner_id: '00000000-0000-0000-0000-000000000001',
  name: 'Shree Hari Electronics & Appliances',
  business_type: 'Retail',
  tagline: 'Premium Consumer Electronics & Smart Gadgets',
  email: 'contact@shreeharielectronics.in',
  phone: '+91 98765 43210',
  website: 'https://shreeharielectronics.in',
  address_line1: 'Shop 12-14, Shreeji Complex, MG Road',
  city: 'Ahmedabad',
  state: 'Gujarat',
  state_code: '24',
  pincode: '380009',
  country: 'India',
  is_gst_registered: true,
  gstin: '24AABCS1429B1Z8',
  pan: 'AABCS1429B',
  tax_preference: 'exclusive',
  currency: 'INR',
  currency_symbol: '₹',
  invoice_prefix: 'SHE-26',
  starting_invoice_number: 1,
  current_invoice_sequence: 3,
  quotation_prefix: 'QTN-26',
  purchase_prefix: 'PUR-26',
  default_payment_terms: 'Due on Receipt',
  default_notes: 'Thank you for your business! Please visit again.',
  default_terms_conditions: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is not made within the due date.\n3. Subject to Ahmedabad jurisdiction.',
  bank_name: 'HDFC Bank',
  account_name: 'Shree Hari Electronics',
  account_number: '50200041234567',
  ifsc_code: 'HDFC0000123',
  branch_name: 'Navrangpura Branch',
  upi_id: 'shreehari@okhdfcbank',
  upi_qr_enabled: true,
  active_template_id: 'modern',
  created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_CATEGORIES: ProductCategory[] = [
  { id: '33333333-3333-3333-3333-333333330001', business_id: DEFAULT_BUSINESS.id, name: 'Smartphones & Tablets', description: 'Smartphones and accessories', created_at: new Date().toISOString() },
  { id: '33333333-3333-3333-3333-333333330002', business_id: DEFAULT_BUSINESS.id, name: 'Laptops & Computers', description: 'Laptops, MacBooks & PCs', created_at: new Date().toISOString() },
  { id: '33333333-3333-3333-3333-333333330003', business_id: DEFAULT_BUSINESS.id, name: 'Audio & Wearables', description: 'Headphones, earbuds and smartwatches', created_at: new Date().toISOString() },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: '44444444-4444-4444-4444-444444440001',
    business_id: DEFAULT_BUSINESS.id,
    category_id: '33333333-3333-3333-3333-333333330001',
    category_name: 'Smartphones & Tablets',
    name: 'Samsung Galaxy S24 Ultra 256GB',
    sku: 'SAM-S24U-256',
    hsn_code: '85171200',
    description: 'Titanium Gray, 12GB RAM, 200MP Camera',
    unit: 'PCS',
    selling_price: 119999,
    purchase_price: 104000,
    gst_rate: 18,
    tax_type: 'exclusive',
    cess_rate: 0,
    opening_stock: 10,
    current_stock: 8,
    low_stock_threshold: 3,
    barcode: '8806095388741',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '44444444-4444-4444-4444-444444440002',
    business_id: DEFAULT_BUSINESS.id,
    category_id: '33333333-3333-3333-3333-333333330002',
    category_name: 'Laptops & Computers',
    name: 'Apple MacBook Air 15" M3 (16GB/512GB)',
    sku: 'APL-MBA15-M3',
    hsn_code: '84713010',
    description: 'Midnight Blue, Apple M3 8-Core CPU, 10-Core GPU',
    unit: 'PCS',
    selling_price: 134900,
    purchase_price: 118000,
    gst_rate: 18,
    tax_type: 'exclusive',
    cess_rate: 0,
    opening_stock: 5,
    current_stock: 4,
    low_stock_threshold: 2,
    barcode: '194253715893',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '44444444-4444-4444-4444-444444440003',
    business_id: DEFAULT_BUSINESS.id,
    category_id: '33333333-3333-3333-3333-333333330003',
    category_name: 'Audio & Wearables',
    name: 'Sony WH-1000XM5 Wireless ANC Headphones',
    sku: 'SNY-WHXM5-BLK',
    hsn_code: '85183000',
    description: 'Industry Leading Noise Canceling with Dual Processor',
    unit: 'PCS',
    selling_price: 28990,
    purchase_price: 23500,
    gst_rate: 18,
    tax_type: 'exclusive',
    cess_rate: 0,
    opening_stock: 15,
    current_stock: 12,
    low_stock_threshold: 4,
    barcode: '4548736132580',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_PARTIES: Party[] = [
  {
    id: '22222222-2222-2222-2222-222222220001',
    business_id: DEFAULT_BUSINESS.id,
    type: 'customer',
    name: 'Rajesh Sharma',
    business_name: 'Apex Enterprises',
    email: 'rajesh@apexenterprises.in',
    phone: '+91 98250 11223',
    gstin: '24AAACA1234F1Z5',
    pan: 'AAACA1234F',
    address: '401, Sapphire Arcade, CG Road',
    city: 'Ahmedabad',
    state: 'Gujarat',
    state_code: '24',
    pincode: '380006',
    country: 'India',
    credit_limit: 50000,
    opening_balance: 0,
    opening_balance_type: 'receive',
    current_balance: 18417,
    notes: 'Premium regular client',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222220002',
    business_id: DEFAULT_BUSINESS.id,
    type: 'customer',
    name: 'Pooja Nair',
    business_name: 'Nova Tech Solutions',
    email: 'pooja@novatech.co.in',
    phone: '+91 97123 99887',
    gstin: '27AABCT9988C1Z2',
    pan: 'AABCT9988C',
    address: 'Flat 302, Palm Heights, Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    state_code: '27',
    pincode: '400053',
    country: 'India',
    credit_limit: 200000,
    opening_balance: 0,
    opening_balance_type: 'receive',
    current_balance: 151223,
    notes: 'Outstation tech agency client',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222220003',
    business_id: DEFAULT_BUSINESS.id,
    type: 'supplier',
    name: 'Amitabh Verma',
    business_name: 'Samsung India Electronics Dist.',
    email: 'sales@samsungdistributors.com',
    phone: '+91 99000 44556',
    gstin: '24AAACS0001D1Z1',
    pan: 'AAACS0001D',
    address: 'Sector 18, GIDC Industrial Estate',
    city: 'Gandhinagar',
    state: 'Gujarat',
    state_code: '24',
    pincode: '382010',
    country: 'India',
    credit_limit: 1000000,
    opening_balance: 0,
    opening_balance_type: 'pay',
    current_balance: -85000,
    notes: 'Authorized Tier-1 Distributor',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: '55555555-5555-5555-5555-555555550001',
    business_id: DEFAULT_BUSINESS.id,
    party_id: '22222222-2222-2222-2222-222222220001',
    invoice_number: 'SHE-26-00001',
    invoice_date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'partially_paid',
    party_name: 'Rajesh Sharma',
    party_business_name: 'Apex Enterprises',
    party_gstin: '24AAACA1234F1Z5',
    party_phone: '+91 98250 11223',
    party_email: 'rajesh@apexenterprises.in',
    party_address: '401, Sapphire Arcade, CG Road, Ahmedabad',
    party_state: 'Gujarat',
    party_state_code: '24',
    place_of_supply: 'Gujarat (24)',
    is_interstate: false,
    subtotal: 57980,
    discount_type: 'percentage',
    discount_value: 0,
    discount_amount: 0,
    taxable_amount: 57980,
    cgst_amount: 5218.20,
    sgst_amount: 5218.20,
    igst_amount: 0,
    cess_amount: 0,
    total_tax: 10436.40,
    shipping_charges: 0,
    round_off: 0.60,
    grand_total: 68417,
    amount_paid: 50000,
    balance_due: 18417,
    notes: 'Thank you for your business!',
    terms_conditions: DEFAULT_BUSINESS.default_terms_conditions,
    template_id: 'modern',
    items: [
      {
        product_id: '44444444-4444-4444-4444-444444440003',
        name: 'Sony WH-1000XM5 Wireless ANC Headphones',
        description: 'Industry Leading Noise Canceling with Dual Processor',
        hsn_code: '85183000',
        quantity: 2,
        unit: 'PCS',
        rate: 28990,
        discount_percent: 0,
        taxable_amount: 57980,
        gst_rate: 18,
        cgst_amount: 5218.20,
        sgst_amount: 5218.20,
        igst_amount: 0,
        cess_amount: 0,
        total: 68416.40,
      },
    ],
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '55555555-5555-5555-5555-555555550002',
    business_id: DEFAULT_BUSINESS.id,
    party_id: '22222222-2222-2222-2222-222222220002',
    invoice_number: 'SHE-26-00002',
    invoice_date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'sent',
    party_name: 'Pooja Nair',
    party_business_name: 'Nova Tech Solutions',
    party_gstin: '27AABCT9988C1Z2',
    party_phone: '+91 97123 99887',
    party_email: 'pooja@novatech.co.in',
    party_address: 'Flat 302, Palm Heights, Andheri West, Mumbai',
    party_state: 'Maharashtra',
    party_state_code: '27',
    place_of_supply: 'Maharashtra (27)',
    is_interstate: true,
    subtotal: 134900,
    discount_type: 'percentage',
    discount_value: 5,
    discount_amount: 6745,
    taxable_amount: 128155,
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 23067.90,
    cess_amount: 0,
    total_tax: 23067.90,
    shipping_charges: 0,
    round_off: 0.10,
    grand_total: 151223,
    amount_paid: 0,
    balance_due: 151223,
    notes: 'Thank you for choosing Shree Hari Electronics!',
    terms_conditions: DEFAULT_BUSINESS.default_terms_conditions,
    template_id: 'modern',
    items: [
      {
        product_id: '44444444-4444-4444-4444-444444440002',
        name: 'Apple MacBook Air 15" M3 (16GB/512GB)',
        description: 'Midnight Blue, Apple M3 8-Core CPU',
        hsn_code: '84713010',
        quantity: 1,
        unit: 'PCS',
        rate: 134900,
        discount_percent: 5,
        taxable_amount: 128155,
        gst_rate: 18,
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 23067.90,
        cess_amount: 0,
        total: 151222.90,
      },
    ],
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_PAYMENTS: Payment[] = [
  {
    id: '66666666-6666-6666-6666-666666660001',
    business_id: DEFAULT_BUSINESS.id,
    party_id: '22222222-2222-2222-2222-222222220001',
    party_name: 'Rajesh Sharma (Apex Enterprises)',
    invoice_id: '55555555-5555-5555-5555-555555550001',
    invoice_number: 'SHE-26-00001',
    payment_number: 'REC-0001',
    payment_date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
    amount: 50000,
    payment_method: 'upi',
    reference_number: 'UPI/402819283719',
    notes: 'Advance installment via UPI',
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  },
];

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: '77777777-7777-7777-7777-777777770001',
    business_id: DEFAULT_BUSINESS.id,
    category_name: 'Rent',
    title: 'Showroom Commercial Rent (Feb 2026)',
    amount: 45000,
    expense_date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference_number: 'NEFT/HDFC/098172',
    notes: 'Paid to Shreeji Complex Society',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '77777777-7777-7777-7777-777777770002',
    business_id: DEFAULT_BUSINESS.id,
    category_name: 'Electricity',
    title: 'Electricity Bill - MG Road Store',
    amount: 8450,
    expense_date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString().split('T')[0],
    payment_method: 'upi',
    reference_number: 'UPI/UGVCL/987123',
    notes: 'UGVCL Monthly Power Bill',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: '88888888-8888-8888-8888-888888880001',
    business_id: DEFAULT_BUSINESS.id,
    title: 'Payment Received',
    message: '₹ 50,000 received for Invoice SHE-26-00001 from Rajesh Sharma.',
    type: 'payment',
    link: '/invoices/55555555-5555-5555-5555-555555550001',
    is_read: false,
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: '88888888-8888-8888-8888-888888880002',
    business_id: DEFAULT_BUSINESS.id,
    title: 'Low Stock Alert',
    message: 'Apple MacBook Air 15" M3 has only 4 units remaining.',
    type: 'stock',
    link: '/products',
    is_read: false,
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
];

// Local Storage Helper with automatic seed fallback
class LocalStore {
  private get<T>(key: string, defaultVal: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultVal;
      return JSON.parse(item);
    } catch {
      return defaultVal;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error:', e);
    }
  }

  initSeed(): void {
    if (!localStorage.getItem(STORAGE_KEYS.BUSINESSES)) {
      this.set(STORAGE_KEYS.PROFILES, [DEFAULT_USER]);
      this.set(STORAGE_KEYS.BUSINESSES, [DEFAULT_BUSINESS]);
      this.set(STORAGE_KEYS.BUSINESS_MEMBERS, [
        {
          id: '123',
          business_id: DEFAULT_BUSINESS.id,
          user_id: DEFAULT_USER.id,
          role: 'owner',
          created_at: new Date().toISOString(),
        },
      ]);
      this.set(STORAGE_KEYS.PARTIES, DEFAULT_PARTIES);
      this.set(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
      this.set(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
      this.set(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
      this.set(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS);
      this.set(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
      this.set(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
      this.set(STORAGE_KEYS.ACTIVE_BUSINESS_ID, DEFAULT_BUSINESS.id);
      this.set(STORAGE_KEYS.CURRENT_USER, DEFAULT_USER);
    }
  }

  // Profile & Auth
  getCurrentUser(): Profile {
    this.initSeed();
    return this.get<Profile>(STORAGE_KEYS.CURRENT_USER, DEFAULT_USER);
  }

  setCurrentUser(user: Profile): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  // Businesses
  getBusinesses(ownerId?: string): Business[] {
    this.initSeed();
    const all = this.get<Business[]>(STORAGE_KEYS.BUSINESSES, [DEFAULT_BUSINESS]);
    if (!ownerId) return all;
    if (ownerId === DEFAULT_USER.id) {
      return all.filter((b) => b.owner_id === DEFAULT_USER.id);
    }
    return all.filter((b) => b.owner_id === ownerId);
  }

  getBusinessById(id: string): Business | undefined {
    return this.get<Business[]>(STORAGE_KEYS.BUSINESSES, []).find((b) => b.id === id);
  }

  saveBusiness(business: Business): Business {
    const list = this.getBusinesses();
    const index = list.findIndex((b) => b.id === business.id);
    if (index >= 0) {
      list[index] = { ...business, updated_at: new Date().toISOString() };
    } else {
      list.push({ ...business, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    this.set(STORAGE_KEYS.BUSINESSES, list);
    supabaseSync.syncBusiness(business);
    return business;
  }

  getActiveBusinessId(): string {
    this.initSeed();
    return this.get<string>(STORAGE_KEYS.ACTIVE_BUSINESS_ID, DEFAULT_BUSINESS.id);
  }

  setActiveBusinessId(id: string): void {
    this.set(STORAGE_KEYS.ACTIVE_BUSINESS_ID, id);
  }

  // Parties
  getParties(businessId: string): Party[] {
    this.initSeed();
    return this.get<Party[]>(STORAGE_KEYS.PARTIES, []).filter((p) => p.business_id === businessId && p.is_active !== false);
  }

  getPartyById(id: string): Party | undefined {
    return this.get<Party[]>(STORAGE_KEYS.PARTIES, []).find((p) => p.id === id);
  }

  saveParty(party: Party): Party {
    const list = this.get<Party[]>(STORAGE_KEYS.PARTIES, []);
    const index = list.findIndex((p) => p.id === party.id);
    if (index >= 0) {
      list[index] = { ...party, updated_at: new Date().toISOString() };
    } else {
      list.push({ ...party, id: party.id || crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    this.set(STORAGE_KEYS.PARTIES, list);
    supabaseSync.syncParty(party);
    this.logAudit(party.business_id, index >= 0 ? 'update_party' : 'create_party', 'party', party.id, { name: party.name });
    return party;
  }

  deleteParty(id: string): void {
    const list = this.get<Party[]>(STORAGE_KEYS.PARTIES, []);
    const filtered = list.map((p) => (p.id === id ? { ...p, is_active: false } : p));
    this.set(STORAGE_KEYS.PARTIES, filtered);
  }

  // Categories & Products
  getCategories(businessId: string): ProductCategory[] {
    this.initSeed();
    return this.get<ProductCategory[]>(STORAGE_KEYS.CATEGORIES, []).filter((c) => c.business_id === businessId);
  }

  saveCategory(category: ProductCategory): ProductCategory {
    const list = this.get<ProductCategory[]>(STORAGE_KEYS.CATEGORIES, []);
    const index = list.findIndex((c) => c.id === category.id);
    if (index >= 0) {
      list[index] = category;
    } else {
      list.push({ ...category, id: category.id || crypto.randomUUID(), created_at: new Date().toISOString() });
    }
    this.set(STORAGE_KEYS.CATEGORIES, list);
    return category;
  }

  getProducts(businessId: string): Product[] {
    this.initSeed();
    return this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []).filter((p) => p.business_id === businessId && p.is_active !== false);
  }

  getProductById(id: string): Product | undefined {
    return this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []).find((p) => p.id === id);
  }

  saveProduct(product: Product): Product {
    const list = this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const index = list.findIndex((p) => p.id === product.id);
    const updated = {
      ...product,
      id: product.id || crypto.randomUUID(),
      updated_at: new Date().toISOString(),
      created_at: product.created_at || new Date().toISOString(),
    };
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.push(updated);
    }
    this.set(STORAGE_KEYS.PRODUCTS, list);
    supabaseSync.syncProduct(updated);
    this.logAudit(product.business_id, index >= 0 ? 'update_product' : 'create_product', 'product', updated.id, { name: product.name });
    return updated;
  }

  deleteProduct(id: string): void {
    const list = this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const updated = list.map((p) => (p.id === id ? { ...p, is_active: false } : p));
    this.set(STORAGE_KEYS.PRODUCTS, updated);
  }

  // Stock Adjustment
  adjustStock(businessId: string, productId: string, qtyChange: number, type: InventoryTransactionType, notes: string): void {
    const products = this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      prod.current_stock = Number(prod.current_stock) + Number(qtyChange);
      this.set(STORAGE_KEYS.PRODUCTS, products);

      // Record transaction
      const txs = this.get<InventoryTransaction[]>(STORAGE_KEYS.INVENTORY_TX, []);
      txs.unshift({
        id: crypto.randomUUID(),
        business_id: businessId,
        product_id: productId,
        product_name: prod.name,
        transaction_type: type,
        quantity: qtyChange,
        unit_price: prod.purchase_price || prod.selling_price,
        notes,
        created_at: new Date().toISOString(),
      });
      this.set(STORAGE_KEYS.INVENTORY_TX, txs);
    }
  }

  getInventoryTransactions(businessId: string, productId?: string): InventoryTransaction[] {
    const txs = this.get<InventoryTransaction[]>(STORAGE_KEYS.INVENTORY_TX, []);
    return txs.filter((t) => t.business_id === businessId && (!productId || t.product_id === productId));
  }

  // Invoices
  getInvoices(businessId: string): Invoice[] {
    this.initSeed();
    return this.get<Invoice[]>(STORAGE_KEYS.INVOICES, []).filter((i) => i.business_id === businessId);
  }

  getInvoiceById(id: string): Invoice | undefined {
    return this.get<Invoice[]>(STORAGE_KEYS.INVOICES, []).find((i) => i.id === id);
  }

  getNextInvoiceNumber(businessId: string): string {
    const business = this.getBusinessById(businessId) || DEFAULT_BUSINESS;
    const prefix = business.invoice_prefix || 'INV';
    const nextSeq = (business.current_invoice_sequence || 0) + 1;
    return `${prefix}-${String(nextSeq).padStart(5, '0')}`;
  }

  saveInvoice(invoice: Invoice): Invoice {
    const list = this.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const index = list.findIndex((i) => i.id === invoice.id);
    const updated = {
      ...invoice,
      id: invoice.id || crypto.randomUUID(),
      updated_at: new Date().toISOString(),
      created_at: invoice.created_at || new Date().toISOString(),
    };

    if (index >= 0) {
      list[index] = updated;
    } else {
      list.unshift(updated);
      // Increment business sequence
      const business = this.getBusinessById(invoice.business_id);
      if (business) {
        business.current_invoice_sequence = (business.current_invoice_sequence || 0) + 1;
        this.saveBusiness(business);
      }

      // Update party current balance
      const party = this.getPartyById(invoice.party_id);
      if (party) {
        party.current_balance = (party.current_balance || 0) + invoice.balance_due;
        this.saveParty(party);
      }

      // Decrement inventory stock
      invoice.items.forEach((item) => {
        if (item.product_id) {
          this.adjustStock(invoice.business_id, item.product_id, -item.quantity, 'sale', `Invoice ${invoice.invoice_number}`);
        }
      });
    }

    this.set(STORAGE_KEYS.INVOICES, list);
    supabaseSync.syncInvoice(updated);
    this.logAudit(invoice.business_id, index >= 0 ? 'update_invoice' : 'create_invoice', 'invoice', updated.id, {
      invoice_number: invoice.invoice_number,
      grand_total: invoice.grand_total,
    });
    return updated;
  }

  updateInvoiceStatus(id: string, status: Invoice['status']): void {
    const list = this.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const inv = list.find((i) => i.id === id);
    if (inv) {
      inv.status = status;
      inv.updated_at = new Date().toISOString();
      this.set(STORAGE_KEYS.INVOICES, list);
    }
  }

  // Quotations
  getQuotations(businessId: string): Quotation[] {
    this.initSeed();
    return this.get<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []).filter((q) => q.business_id === businessId);
  }

  getQuotationById(id: string): Quotation | undefined {
    return this.get<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []).find((q) => q.id === id);
  }

  getNextQuotationNumber(businessId: string): string {
    const business = this.getBusinessById(businessId) || DEFAULT_BUSINESS;
    const prefix = business.quotation_prefix || 'QTN';
    const list = this.getQuotations(businessId);
    const nextSeq = list.length + 1;
    return `${prefix}-${String(nextSeq).padStart(5, '0')}`;
  }

  saveQuotation(quotation: Quotation): Quotation {
    const list = this.get<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);
    const index = list.findIndex((q) => q.id === quotation.id);
    const updated = {
      ...quotation,
      id: quotation.id || crypto.randomUUID(),
      updated_at: new Date().toISOString(),
      created_at: quotation.created_at || new Date().toISOString(),
    };
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.unshift(updated);
    }
    this.set(STORAGE_KEYS.QUOTATIONS, list);
    return updated;
  }

  // Payments
  getPayments(businessId: string): Payment[] {
    this.initSeed();
    return this.get<Payment[]>(STORAGE_KEYS.PAYMENTS, []).filter((p) => p.business_id === businessId);
  }

  recordPayment(payment: Payment): Payment {
    const list = this.get<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
    const updated = {
      ...payment,
      id: payment.id || crypto.randomUUID(),
      payment_number: payment.payment_number || `REC-${String(list.length + 1).padStart(4, '0')}`,
      created_at: new Date().toISOString(),
    };
    list.unshift(updated);
    this.set(STORAGE_KEYS.PAYMENTS, list);

    // If linked to an invoice, update invoice paid amount & balance
    if (payment.invoice_id) {
      const invoices = this.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);
      const inv = invoices.find((i) => i.id === payment.invoice_id);
      if (inv) {
        inv.amount_paid = (inv.amount_paid || 0) + Number(payment.amount);
        inv.balance_due = Math.max(0, inv.grand_total - inv.amount_paid);
        if (inv.balance_due === 0) {
          inv.status = 'paid';
        } else if (inv.amount_paid > 0) {
          inv.status = 'partially_paid';
        }
        this.set(STORAGE_KEYS.INVOICES, invoices);
      }
    }

    // Update party balance
    if (payment.party_id) {
      const party = this.getPartyById(payment.party_id);
      if (party) {
        party.current_balance = (party.current_balance || 0) - Number(payment.amount);
        this.saveParty(party);
      }
    }

    // Add Notification
    this.addNotification({
      id: crypto.randomUUID(),
      business_id: payment.business_id,
      title: 'Payment Recorded',
      message: `₹ ${payment.amount.toLocaleString('en-IN')} recorded via ${payment.payment_method.toUpperCase()}`,
      type: 'payment',
      link: payment.invoice_id ? `/invoices/${payment.invoice_id}` : '/payments',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    this.logAudit(payment.business_id, 'record_payment', 'payment', updated.id, {
      amount: payment.amount,
      method: payment.payment_method,
    });

    return updated;
  }

  // Expenses
  getExpenses(businessId: string): Expense[] {
    this.initSeed();
    return this.get<Expense[]>(STORAGE_KEYS.EXPENSES, []).filter((e) => e.business_id === businessId);
  }

  saveExpense(expense: Expense): Expense {
    const list = this.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const index = list.findIndex((e) => e.id === expense.id);
    const updated = {
      ...expense,
      id: expense.id || crypto.randomUUID(),
      created_at: expense.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.unshift(updated);
    }
    this.set(STORAGE_KEYS.EXPENSES, list);
    supabaseSync.syncExpense(updated);
    return updated;
  }

  deleteExpense(id: string): void {
    const list = this.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    this.set(STORAGE_KEYS.EXPENSES, list.filter((e) => e.id !== id));
  }

  // Purchases
  getPurchases(businessId: string): Purchase[] {
    this.initSeed();
    return this.get<Purchase[]>(STORAGE_KEYS.PURCHASES, []).filter((p) => p.business_id === businessId);
  }

  savePurchase(purchase: Purchase): Purchase {
    const list = this.get<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
    const index = list.findIndex((p) => p.id === purchase.id);
    const updated = {
      ...purchase,
      id: purchase.id || crypto.randomUUID(),
      created_at: purchase.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.unshift(updated);
      // Increase product stock
      purchase.items.forEach((item) => {
        if (item.product_id) {
          this.adjustStock(purchase.business_id, item.product_id, item.quantity, 'purchase', `Purchase Bill ${purchase.bill_number}`);
        }
      });
    }
    this.set(STORAGE_KEYS.PURCHASES, list);
    return updated;
  }

  // Notifications
  getNotifications(businessId: string): Notification[] {
    this.initSeed();
    return this.get<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []).filter((n) => n.business_id === businessId);
  }

  addNotification(n: Notification): void {
    const list = this.get<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    list.unshift(n);
    this.set(STORAGE_KEYS.NOTIFICATIONS, list.slice(0, 50));
  }

  markNotificationAsRead(id: string): void {
    const list = this.get<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const item = list.find((n) => n.id === id);
    if (item) {
      item.is_read = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  }

  markAllNotificationsAsRead(businessId: string): void {
    const list = this.get<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    list.forEach((n) => {
      if (n.business_id === businessId) n.is_read = true;
    });
    this.set(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  // Audit Logs
  getAuditLogs(businessId: string): AuditLog[] {
    this.initSeed();
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []).filter((a) => a.business_id === businessId);
  }

  logAudit(businessId: string, action: string, entityType: string, entityId: string, details?: Record<string, any>): void {
    const logs = this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    const user = this.getCurrentUser();
    logs.unshift({
      id: crypto.randomUUID(),
      business_id: businessId,
      user_id: user.id,
      user_email: user.email,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString(),
    });
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 200));
  }

  // Export Complete Backup
  exportAllData(businessId: string): string {
    const data = {
      business: this.getBusinessById(businessId),
      parties: this.getParties(businessId),
      products: this.getProducts(businessId),
      invoices: this.getInvoices(businessId),
      quotations: this.getQuotations(businessId),
      payments: this.getPayments(businessId),
      expenses: this.getExpenses(businessId),
      purchases: this.getPurchases(businessId),
      inventory: this.getInventoryTransactions(businessId),
      auditLogs: this.getAuditLogs(businessId),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    return JSON.stringify(data, null, 2);
  }
}

export const storageService = new LocalStore();
