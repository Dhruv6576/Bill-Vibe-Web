-- ====================================================================
-- BillVibe — Production Multi-Tenant PostgreSQL Database Schema
-- Complete ERP & Invoicing Database (No RLS Blocks for Seamless Persistence)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. PROFILES (Users)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 2. BUSINESSES (Tenants / Enterprises)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    business_type TEXT NOT NULL DEFAULT 'Retail', -- Retail, Wholesale, Services, Manufacturing, etc.
    tagline TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    state_code TEXT,
    pincode TEXT,
    country TEXT DEFAULT 'India',
    logo_url TEXT,
    signature_url TEXT,
    is_gst_registered BOOLEAN DEFAULT false,
    gstin TEXT,
    pan TEXT,
    tax_preference TEXT DEFAULT 'exclusive', -- exclusive, inclusive
    currency TEXT DEFAULT 'INR',
    currency_symbol TEXT DEFAULT '₹',
    invoice_prefix TEXT DEFAULT 'INV',
    starting_invoice_number INT DEFAULT 1,
    current_invoice_sequence INT DEFAULT 0,
    quotation_prefix TEXT DEFAULT 'QTN',
    purchase_prefix TEXT DEFAULT 'PUR',
    default_payment_terms TEXT DEFAULT 'Due on Receipt',
    default_notes TEXT DEFAULT 'Thank you for your business!',
    default_terms_conditions TEXT,
    bank_name TEXT,
    account_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    branch_name TEXT,
    upi_id TEXT,
    upi_qr_enabled BOOLEAN DEFAULT true,
    active_template_id TEXT DEFAULT 'modern',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. BUSINESS MEMBERS (Role-Based Team Collaboration)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'accountant', 'staff', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);

-- --------------------------------------------------------------------
-- 4. PARTIES (Customers & Suppliers)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    business_name TEXT,
    party_type TEXT DEFAULT 'customer' CHECK (party_type IN ('customer', 'supplier', 'both')),
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    state_code TEXT,
    pincode TEXT,
    country TEXT DEFAULT 'India',
    is_gst_registered BOOLEAN DEFAULT false,
    gstin TEXT,
    pan TEXT,
    credit_limit NUMERIC(15,2) DEFAULT 0,
    opening_balance NUMERIC(15,2) DEFAULT 0,
    opening_balance_type TEXT DEFAULT 'receive' CHECK (opening_balance_type IN ('receive', 'pay')),
    current_balance NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 5. PRODUCT CATEGORIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 6. PRODUCTS (Inventory Catalog & Services)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    category_name TEXT,
    name TEXT NOT NULL,
    sku TEXT,
    hsn_code TEXT,
    description TEXT,
    unit TEXT DEFAULT 'PCS',
    selling_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    purchase_price NUMERIC(15,2) DEFAULT 0,
    gst_rate NUMERIC(5,2) DEFAULT 18,
    tax_type TEXT DEFAULT 'exclusive' CHECK (tax_type IN ('inclusive', 'exclusive')),
    cess_rate NUMERIC(5,2) DEFAULT 0,
    opening_stock NUMERIC(15,2) DEFAULT 0,
    current_stock NUMERIC(15,2) DEFAULT 0,
    low_stock_threshold NUMERIC(15,2) DEFAULT 5,
    barcode TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 7. INVENTORY TRANSACTIONS (Stock Ledger)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'adjustment_add', 'adjustment_sub', 'return_in', 'return_out')),
    quantity NUMERIC(15,2) NOT NULL,
    unit_price NUMERIC(15,2) DEFAULT 0,
    reference_type TEXT,
    reference_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 8. INVOICES (Sales Invoices & GST Tax Invoices)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled')),
    party_name TEXT NOT NULL,
    party_business_name TEXT,
    party_gstin TEXT,
    party_phone TEXT,
    party_email TEXT,
    party_address TEXT,
    party_state TEXT,
    party_state_code TEXT,
    place_of_supply TEXT,
    is_interstate BOOLEAN DEFAULT false,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(15,2) DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    cgst_amount NUMERIC(15,2) DEFAULT 0,
    sgst_amount NUMERIC(15,2) DEFAULT 0,
    igst_amount NUMERIC(15,2) DEFAULT 0,
    cess_amount NUMERIC(15,2) DEFAULT 0,
    total_tax NUMERIC(15,2) DEFAULT 0,
    shipping_charges NUMERIC(15,2) DEFAULT 0,
    round_off NUMERIC(15,2) DEFAULT 0,
    grand_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(15,2) DEFAULT 0,
    balance_due NUMERIC(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    terms_conditions TEXT,
    template_id TEXT DEFAULT 'modern',
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 9. INVOICE ITEMS (Line Items with Line-Level Tax)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    hsn_code TEXT,
    quantity NUMERIC(15,2) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'PCS',
    rate NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    gst_rate NUMERIC(5,2) DEFAULT 18,
    cgst_amount NUMERIC(15,2) DEFAULT 0,
    sgst_amount NUMERIC(15,2) DEFAULT 0,
    igst_amount NUMERIC(15,2) DEFAULT 0,
    cess_amount NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0
);

-- --------------------------------------------------------------------
-- 10. QUOTATIONS / ESTIMATES / PROFORMA
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    quotation_number TEXT NOT NULL,
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'converted', 'expired')),
    party_name TEXT NOT NULL,
    party_business_name TEXT,
    party_gstin TEXT,
    party_phone TEXT,
    party_email TEXT,
    party_address TEXT,
    party_state TEXT,
    party_state_code TEXT,
    place_of_supply TEXT,
    is_interstate BOOLEAN DEFAULT false,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    cgst_amount NUMERIC(15,2) DEFAULT 0,
    sgst_amount NUMERIC(15,2) DEFAULT 0,
    igst_amount NUMERIC(15,2) DEFAULT 0,
    cess_amount NUMERIC(15,2) DEFAULT 0,
    total_tax NUMERIC(15,2) DEFAULT 0,
    grand_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    terms_conditions TEXT,
    template_id TEXT DEFAULT 'modern',
    converted_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    hsn_code TEXT,
    quantity NUMERIC(15,2) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'PCS',
    rate NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    gst_rate NUMERIC(5,2) DEFAULT 18,
    cgst_amount NUMERIC(15,2) DEFAULT 0,
    sgst_amount NUMERIC(15,2) DEFAULT 0,
    igst_amount NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) NOT NULL DEFAULT 0
);

-- --------------------------------------------------------------------
-- 11. PAYMENTS (Receipts & Allocations)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    payment_number TEXT NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'upi', 'card', 'other')),
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 12. EXPENSE CATEGORIES & EXPENSES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL,
    title TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'upi', 'card', 'other')),
    reference_number TEXT,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 13. PURCHASES & PURCHASE ITEMS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    purchase_number TEXT NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('ordered', 'received', 'paid', 'partially_paid', 'cancelled')),
    supplier_name TEXT NOT NULL,
    supplier_gstin TEXT,
    supplier_phone TEXT,
    supplier_email TEXT,
    supplier_address TEXT,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    cgst_amount NUMERIC(15,2) DEFAULT 0,
    sgst_amount NUMERIC(15,2) DEFAULT 0,
    igst_amount NUMERIC(15,2) DEFAULT 0,
    cess_amount NUMERIC(15,2) DEFAULT 0,
    total_tax NUMERIC(15,2) DEFAULT 0,
    grand_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(15,2) DEFAULT 0,
    balance_due NUMERIC(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    hsn_code TEXT,
    quantity NUMERIC(15,2) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'PCS',
    rate NUMERIC(15,2) NOT NULL DEFAULT 0,
    taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    gst_rate NUMERIC(5,2) DEFAULT 18,
    cgst_amount NUMERIC(15,2) DEFAULT 0,
    sgst_amount NUMERIC(15,2) DEFAULT 0,
    igst_amount NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) NOT NULL DEFAULT 0
);

-- --------------------------------------------------------------------
-- 14. RETURNS & CREDIT/DEBIT NOTES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    return_number TEXT NOT NULL,
    return_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    return_number TEXT NOT NULL,
    return_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    note_number TEXT NOT NULL,
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debit_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
    note_number TEXT NOT NULL,
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 15. NOTIFICATIONS & AUDIT LOGS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'invoice', 'payment', 'stock')),
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 16. PERFORMANCE INDEXES
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_business ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_parties_business ON parties(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_party ON invoices(party_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_quotations_business ON quotations(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_business ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_purchases_business ON purchases(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_business ON notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business ON audit_logs(business_id);

-- --------------------------------------------------------------------
-- 17. AUTOMATIC AUTH TRIGGER (Syncs auth.users to public.profiles)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync existing users from auth.users into profiles immediately
INSERT INTO public.profiles (id, email, full_name, avatar_url, phone)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
    raw_user_meta_data->>'avatar_url',
    raw_user_meta_data->>'phone'
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET 
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
