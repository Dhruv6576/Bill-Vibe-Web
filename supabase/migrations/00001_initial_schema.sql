-- ====================================================================
-- BILLING & INVOICING PLATFORM - COMPREHENSIVE SUPABASE DATABASE SCHEMA
-- Multi-Tenant PostgreSQL Schema with Row Level Security (RLS)
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
-- 2. BUSINESSES (Multi-Tenancy)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    business_type TEXT NOT NULL DEFAULT 'Retail', -- Retail, Wholesale, Services, Freelancer, Manufacturing, Restaurant, Other
    tagline TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    state_code TEXT, -- 2-digit Indian GST State Code (e.g. 27 for Maharashtra)
    pincode TEXT,
    country TEXT DEFAULT 'India',
    logo_url TEXT,
    signature_url TEXT,
    
    -- Tax details
    is_gst_registered BOOLEAN DEFAULT false,
    gstin TEXT,
    pan TEXT,
    tax_preference TEXT DEFAULT 'exclusive', -- inclusive, exclusive
    
    -- Invoice settings & Defaults
    currency TEXT DEFAULT 'INR',
    currency_symbol TEXT DEFAULT '₹',
    invoice_prefix TEXT DEFAULT 'INV',
    starting_invoice_number INT DEFAULT 1,
    current_invoice_sequence INT DEFAULT 0,
    quotation_prefix TEXT DEFAULT 'QTN',
    purchase_prefix TEXT DEFAULT 'PUR',
    default_payment_terms TEXT DEFAULT 'Due on Receipt',
    default_notes TEXT DEFAULT 'Thank you for your business!',
    default_terms_conditions TEXT DEFAULT '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is not made within the due date.\n3. Subject to local jurisdiction.',
    
    -- Banking & UPI
    bank_name TEXT,
    account_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    branch_name TEXT,
    upi_id TEXT,
    upi_qr_enabled BOOLEAN DEFAULT true,
    
    -- Active Invoice Template
    active_template_id TEXT DEFAULT 'modern', -- modern, classic, minimal, professional, compact
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. BUSINESS MEMBERS (Roles & Permissions)
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
    type TEXT NOT NULL DEFAULT 'customer' CHECK (type IN ('customer', 'supplier', 'both')),
    name TEXT NOT NULL,
    business_name TEXT,
    email TEXT,
    phone TEXT,
    gstin TEXT,
    pan TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    state_code TEXT,
    pincode TEXT,
    country TEXT DEFAULT 'India',
    credit_limit NUMERIC(15, 2) DEFAULT 0,
    opening_balance NUMERIC(15, 2) DEFAULT 0,
    opening_balance_type TEXT DEFAULT 'receive' CHECK (opening_balance_type IN ('receive', 'pay')),
    current_balance NUMERIC(15, 2) DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 5. PRODUCT CATEGORIES & PRODUCTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    sku TEXT,
    hsn_code TEXT,
    description TEXT,
    unit TEXT DEFAULT 'PCS', -- PCS, BOX, KG, MTR, LTR, PKT, SET, SQFT, NOS
    selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    purchase_price NUMERIC(15, 2) DEFAULT 0,
    gst_rate NUMERIC(5, 2) DEFAULT 18.00, -- 0, 5, 12, 18, 28
    tax_type TEXT DEFAULT 'exclusive' CHECK (tax_type IN ('exclusive', 'inclusive')),
    cess_rate NUMERIC(5, 2) DEFAULT 0.00,
    opening_stock NUMERIC(15, 2) DEFAULT 0,
    current_stock NUMERIC(15, 2) DEFAULT 0,
    low_stock_threshold NUMERIC(15, 2) DEFAULT 10,
    barcode TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 6. INVENTORY TRANSACTIONS (Stock Ledger)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'sales_return', 'purchase_return', 'adjustment_in', 'adjustment_out', 'manual_update')),
    quantity NUMERIC(15, 2) NOT NULL,
    unit_price NUMERIC(15, 2) DEFAULT 0,
    reference_type TEXT, -- invoice, quotation, purchase_bill, return_note
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 7. INVOICES & INVOICE ITEMS (Snapshots & GST Breakdown)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled')),
    
    -- Party snapshot for historical auditability
    party_name TEXT NOT NULL,
    party_business_name TEXT,
    party_gstin TEXT,
    party_phone TEXT,
    party_email TEXT,
    party_address TEXT,
    party_state TEXT,
    party_state_code TEXT,
    
    -- Place of supply
    place_of_supply TEXT,
    is_interstate BOOLEAN DEFAULT false,
    
    -- Financial Totals
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(15, 2) DEFAULT 0,
    discount_amount NUMERIC(15, 2) DEFAULT 0,
    taxable_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    
    -- Tax Breakdown
    cgst_amount NUMERIC(15, 2) DEFAULT 0,
    sgst_amount NUMERIC(15, 2) DEFAULT 0,
    igst_amount NUMERIC(15, 2) DEFAULT 0,
    cess_amount NUMERIC(15, 2) DEFAULT 0,
    total_tax NUMERIC(15, 2) DEFAULT 0,
    
    shipping_charges NUMERIC(15, 2) DEFAULT 0,
    round_off NUMERIC(15, 2) DEFAULT 0,
    grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(15, 2) DEFAULT 0,
    balance_due NUMERIC(15, 2) NOT NULL DEFAULT 0,
    
    -- Notes & Formatting
    notes TEXT,
    terms_conditions TEXT,
    template_id TEXT DEFAULT 'modern',
    qr_code_data TEXT,
    
    -- Reference
    quotation_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    hsn_code TEXT,
    quantity NUMERIC(15, 2) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'PCS',
    rate NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5, 2) DEFAULT 0,
    taxable_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    gst_rate NUMERIC(5, 2) DEFAULT 18.00,
    cgst_amount NUMERIC(15, 2) DEFAULT 0,
    sgst_amount NUMERIC(15, 2) DEFAULT 0,
    igst_amount NUMERIC(15, 2) DEFAULT 0,
    cess_amount NUMERIC(15, 2) DEFAULT 0,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0
);

-- --------------------------------------------------------------------
-- 8. QUOTATIONS / ESTIMATES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    quotation_number TEXT NOT NULL,
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days')::DATE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
    
    party_name TEXT NOT NULL,
    party_business_name TEXT,
    party_gstin TEXT,
    party_phone TEXT,
    party_email TEXT,
    party_address TEXT,
    party_state TEXT,
    party_state_code TEXT,
    
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15, 2) DEFAULT 0,
    taxable_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    cgst_amount NUMERIC(15, 2) DEFAULT 0,
    sgst_amount NUMERIC(15, 2) DEFAULT 0,
    igst_amount NUMERIC(15, 2) DEFAULT 0,
    cess_amount NUMERIC(15, 2) DEFAULT 0,
    total_tax NUMERIC(15, 2) DEFAULT 0,
    grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    
    notes TEXT,
    terms_conditions TEXT,
    converted_to_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, quotation_number)
);

CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    hsn_code TEXT,
    quantity NUMERIC(15, 2) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'PCS',
    rate NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5, 2) DEFAULT 0,
    taxable_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    gst_rate NUMERIC(5, 2) DEFAULT 18.00,
    cgst_amount NUMERIC(15, 2) DEFAULT 0,
    sgst_amount NUMERIC(15, 2) DEFAULT 0,
    igst_amount NUMERIC(15, 2) DEFAULT 0,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0
);

-- --------------------------------------------------------------------
-- 9. PAYMENTS & ALLOCATIONS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    payment_number TEXT,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'upi' CHECK (payment_method IN ('cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other')),
    reference_number TEXT,
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 10. EXPENSES & EXPENSE CATEGORIES
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
    amount NUMERIC(15, 2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other')),
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    reference_number TEXT,
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 11. PURCHASES & PURCHASE ITEMS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    bill_number TEXT NOT NULL,
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('draft', 'ordered', 'received', 'paid', 'partially_paid', 'cancelled')),
    
    supplier_name TEXT NOT NULL,
    supplier_gstin TEXT,
    
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_tax NUMERIC(15, 2) DEFAULT 0,
    grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(15, 2) DEFAULT 0,
    balance_due NUMERIC(15, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    hsn_code TEXT,
    quantity NUMERIC(15, 2) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'PCS',
    purchase_rate NUMERIC(15, 2) NOT NULL DEFAULT 0,
    gst_rate NUMERIC(5, 2) DEFAULT 18.00,
    tax_amount NUMERIC(15, 2) DEFAULT 0,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0
);

-- --------------------------------------------------------------------
-- 12. RETURNS & CREDIT/DEBIT NOTES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    return_number TEXT NOT NULL,
    return_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_refund_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    return_number TEXT NOT NULL,
    return_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    note_number TEXT NOT NULL,
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15, 2) NOT NULL,
    tax_amount NUMERIC(15, 2) DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debit_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
    note_number TEXT NOT NULL,
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15, 2) NOT NULL,
    tax_amount NUMERIC(15, 2) DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 13. NOTIFICATIONS & AUDIT LOGS
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
    action TEXT NOT NULL, -- create_invoice, update_invoice, cancel_invoice, record_payment, etc.
    entity_type TEXT NOT NULL, -- invoice, party, product, payment, settings
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 14. PERFORMANCE INDEXES
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
-- 15. STORED FUNCTIONS & SEQUENCE GENERATOR
-- --------------------------------------------------------------------

-- Function: Atomic next invoice number generator
CREATE OR REPLACE FUNCTION generate_next_invoice_number(p_business_id UUID, p_prefix TEXT)
RETURNS TEXT AS $$
DECLARE
    next_seq INT;
    formatted_num TEXT;
BEGIN
    UPDATE businesses
    SET current_invoice_sequence = current_invoice_sequence + 1
    WHERE id = p_business_id
    RETURNING current_invoice_sequence INTO next_seq;
    
    formatted_num := p_prefix || '-' || LPAD(next_seq::TEXT, 5, '0');
    RETURN formatted_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE debit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user belongs to business
CREATE OR REPLACE FUNCTION is_business_member(b_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM business_members
        WHERE business_id = b_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can read/write their own profile
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Businesses: Users can access businesses they are member of
CREATE POLICY "Members can view business" ON businesses FOR SELECT USING (is_business_member(id) OR owner_id = auth.uid());
CREATE POLICY "Owners can update business" ON businesses FOR UPDATE USING (is_business_member(id));
CREATE POLICY "Users can create business" ON businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Business Members:
CREATE POLICY "Members can view membership" ON business_members FOR SELECT USING (is_business_member(business_id) OR user_id = auth.uid());
CREATE POLICY "Owners can manage membership" ON business_members FOR ALL USING (is_business_member(business_id));

-- Core Business Entities: Enforce tenant isolation via is_business_member(business_id)
CREATE POLICY "Party tenant isolation" ON parties FOR ALL USING (is_business_member(business_id));
CREATE POLICY "Category tenant isolation" ON product_categories FOR ALL USING (is_business_member(business_id));
CREATE POLICY "Product tenant isolation" ON products FOR ALL USING (is_business_member(business_id));
CREATE POLICY "Inventory tx tenant isolation" ON inventory_transactions FOR ALL USING (is_business_member(business_id));
CREATE POLICY "Invoice tenant isolation" ON invoices FOR ALL USING (is_business_member(business_id));
CREATE POLICY "Invoice items tenant isolation" ON invoice_items FOR ALL USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND is_business_member(invoices.business_id))
);
CREATE POLICY "Quotations tenant isolation" ON quotations FOR ALL USING (is_business_member(business_id));
CREATE POLICY "Quotation items tenant isolation" ON quotation_items FOR ALL USING (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND is_business_member(quotations.business_id))
);
CREATE POLICY "Payments tenant isolation" ON payments FOR ALL USING (is_business_member(business_id));
CREATE POLICY "Expense categories tenant isolation" ON expense_categories FOR ALL USING (is_business_member(business_id));
CREATE POLICY "Expenses tenant isolation" ON expenses FOR ALL USING (is_business_member(business_id));
CREATE POLICY "Purchases tenant isolation" ON purchases FOR ALL USING (is_business_member(business_id));
CREATE POLICY "Purchase items tenant isolation" ON purchase_items FOR ALL USING (
    EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND is_business_member(purchases.business_id))
);
CREATE POLICY "Sales return tenant isolation" ON sales_returns FOR ALL USING (is_business_member(business_id));
CREATE POLICY "Purchase return tenant isolation" ON purchase_returns FOR ALL USING (is_business_member(business_id));
CREATE POLICY "Credit note tenant isolation" ON credit_notes FOR ALL USING (is_business_member(business_id));
CREATE POLICY "Debit note tenant isolation" ON debit_notes FOR ALL USING (is_business_member(business_id));
CREATE POLICY "Notifications tenant isolation" ON notifications FOR ALL USING (is_business_member(business_id));
CREATE POLICY "Audit logs tenant isolation" ON audit_logs FOR ALL USING (is_business_member(business_id));
