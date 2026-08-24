export type UserRole = 'owner' | 'admin' | 'accountant' | 'staff' | 'viewer';
export type PartyType = 'customer' | 'supplier' | 'both';
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
export type PurchaseStatus = 'draft' | 'ordered' | 'received' | 'paid' | 'partially_paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'card' | 'cheque' | 'other';
export type InventoryTransactionType = 'purchase' | 'sale' | 'sales_return' | 'purchase_return' | 'adjustment_in' | 'adjustment_out' | 'manual_update';
export type TemplateId = 'modern' | 'classic' | 'minimal' | 'professional' | 'compact';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  business_type: string;
  tagline?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  state_code?: string;
  pincode?: string;
  country?: string;
  logo_url?: string;
  signature_url?: string;
  is_gst_registered: boolean;
  gstin?: string;
  pan?: string;
  tax_preference: 'inclusive' | 'exclusive';
  currency: string;
  currency_symbol: string;
  invoice_prefix: string;
  starting_invoice_number: number;
  current_invoice_sequence: number;
  quotation_prefix: string;
  purchase_prefix: string;
  default_payment_terms: string;
  default_notes: string;
  default_terms_conditions: string;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  upi_id?: string;
  upi_qr_enabled: boolean;
  active_template_id: TemplateId;
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  profile?: Profile;
}

export interface Party {
  id: string;
  business_id: string;
  type: PartyType;
  name: string;
  business_name?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  state_code?: string;
  pincode?: string;
  country?: string;
  credit_limit: number;
  opening_balance: number;
  opening_balance_type: 'receive' | 'pay';
  current_balance: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  category_id?: string;
  category_name?: string;
  name: string;
  sku?: string;
  hsn_code?: string;
  description?: string;
  unit: string;
  selling_price: number;
  purchase_price: number;
  gst_rate: number;
  tax_type: 'exclusive' | 'inclusive';
  cess_rate: number;
  opening_stock: number;
  current_stock: number;
  low_stock_threshold: number;
  barcode?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  business_id: string;
  product_id: string;
  product_name?: string;
  transaction_type: InventoryTransactionType;
  quantity: number;
  unit_price: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
}

export interface InvoiceItem {
  id?: string;
  product_id?: string;
  name: string;
  description?: string;
  hsn_code?: string;
  quantity: number;
  unit: string;
  rate: number;
  discount_percent: number;
  taxable_amount: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total: number;
  sort_order?: number;
}

export interface Invoice {
  id: string;
  business_id: string;
  party_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: InvoiceStatus;
  
  // Party snapshot
  party_name: string;
  party_business_name?: string;
  party_gstin?: string;
  party_phone?: string;
  party_email?: string;
  party_address?: string;
  party_state?: string;
  party_state_code?: string;
  
  place_of_supply?: string;
  is_interstate: boolean;
  
  subtotal: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  taxable_amount: number;
  
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_tax: number;
  
  shipping_charges: number;
  round_off: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  
  notes?: string;
  terms_conditions?: string;
  template_id: TemplateId;
  qr_code_data?: string;
  quotation_id?: string;
  
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface QuotationItem {
  id?: string;
  product_id?: string;
  name: string;
  description?: string;
  hsn_code?: string;
  quantity: number;
  unit: string;
  rate: number;
  discount_percent: number;
  taxable_amount: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total: number;
  sort_order?: number;
}

export interface Quotation {
  id: string;
  business_id: string;
  party_id: string;
  quotation_number: string;
  quotation_date: string;
  expiry_date: string;
  status: QuotationStatus;
  
  party_name: string;
  party_business_name?: string;
  party_gstin?: string;
  party_phone?: string;
  party_email?: string;
  party_address?: string;
  party_state?: string;
  party_state_code?: string;
  
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_tax: number;
  grand_total: number;
  
  notes?: string;
  terms_conditions?: string;
  converted_to_invoice_id?: string;
  
  items: QuotationItem[];
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  business_id: string;
  party_id: string;
  party_name?: string;
  invoice_id?: string;
  invoice_number?: string;
  payment_number?: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
  receipt_url?: string;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  business_id: string;
  category_id?: string;
  category_name: string;
  title: string;
  amount: number;
  expense_date: string;
  payment_method: PaymentMethod;
  party_id?: string;
  supplier_name?: string;
  reference_number?: string;
  notes?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id?: string;
  product_id?: string;
  name: string;
  hsn_code?: string;
  quantity: number;
  unit: string;
  purchase_rate: number;
  gst_rate: number;
  tax_amount: number;
  total: number;
}

export interface Purchase {
  id: string;
  business_id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_gstin?: string;
  bill_number: string;
  bill_date: string;
  due_date?: string;
  status: PurchaseStatus;
  subtotal: number;
  total_tax: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  notes?: string;
  items: PurchaseItem[];
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  business_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'invoice' | 'payment' | 'stock';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  business_id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface GSTState {
  code: string;
  name: string;
  type: 'state' | 'ut';
}
