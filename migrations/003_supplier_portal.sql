-- Supplier accounts
CREATE TABLE supplier_accounts (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id),
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    business_type VARCHAR(100),
    description TEXT,
    logo_url VARCHAR(512),
    website VARCHAR(255),
    phone VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2),
    verification_status VARCHAR(50) DEFAULT 'pending',
    document_urls JSONB DEFAULT '[]',
    bank_details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier products
CREATE TABLE supplier_products (
    id SERIAL PRIMARY KEY,
    supplier_account_id INT REFERENCES supplier_accounts(id),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    description TEXT,
    category VARCHAR(100),
    unit_price FLOAT NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    moq INT DEFAULT 1,
    lead_time_days INT DEFAULT 30,
    stock_quantity INT DEFAULT 0,
    tags JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    specifications JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier metrics (daily aggregation)
CREATE TABLE supplier_metrics (
    id SERIAL PRIMARY KEY,
    supplier_account_id INT REFERENCES supplier_accounts(id),
    total_negotiations INT DEFAULT 0,
    successful_negotiations INT DEFAULT 0,
    average_discount_pct FLOAT DEFAULT 0,
    total_revenue_usd FLOAT DEFAULT 0,
    total_margin_usd FLOAT DEFAULT 0,
    average_response_time_hours FLOAT DEFAULT 0,
    customer_rating FLOAT DEFAULT 0,
    repeat_customer_rate FLOAT DEFAULT 0,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier payouts
CREATE TABLE supplier_payouts (
    id SERIAL PRIMARY KEY,
    supplier_account_id INT REFERENCES supplier_accounts(id),
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    gross_revenue FLOAT,
    platform_fee_pct FLOAT DEFAULT 5,
    platform_fee_amount FLOAT,
    net_payout FLOAT,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_supplier_accounts_user_id ON supplier_accounts(user_id);
CREATE INDEX idx_supplier_accounts_status ON supplier_accounts(verification_status);
CREATE INDEX idx_supplier_products_account_id ON supplier_products(supplier_account_id);
CREATE INDEX idx_supplier_products_category ON supplier_products(category);
CREATE INDEX idx_supplier_products_active ON supplier_products(is_active);
CREATE INDEX idx_supplier_metrics_account_id ON supplier_metrics(supplier_account_id);
CREATE INDEX idx_supplier_payouts_account_id ON supplier_payouts(supplier_account_id);
CREATE INDEX idx_supplier_payouts_status ON supplier_payouts(status);
