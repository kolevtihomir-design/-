-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    rating FLOAT DEFAULT 0.0,
    contact_email VARCHAR(255),
    verification_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id),
    supplier_id INT REFERENCES suppliers(id),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    description TEXT,
    unit_price FLOAT NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    moq INT DEFAULT 1,
    lead_time_days INT,
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers table
CREATE TABLE offers (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    supplier_id INT REFERENCES suppliers(id),
    quantity INT,
    unit_price FLOAT,
    currency VARCHAR(3) DEFAULT 'EUR',
    shipping_cost FLOAT DEFAULT 0,
    delivery_days INT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price signals table
CREATE TABLE price_signals (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    source VARCHAR(100),
    price FLOAT,
    currency VARCHAR(3),
    confidence FLOAT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Landed cost records
CREATE TABLE landed_cost_records (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    quantity INT,
    unit_price FLOAT,
    shipping FLOAT DEFAULT 0,
    duties FLOAT DEFAULT 0,
    import_fee FLOAT DEFAULT 0,
    insurance FLOAT DEFAULT 0,
    handling FLOAT DEFAULT 0,
    landed_cost_per_unit FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Score history
CREATE TABLE score_history (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    landed_cost_component FLOAT,
    delivery_component FLOAT,
    moq_component FLOAT,
    trust_component FLOAT,
    final_score FLOAT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (auth)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'buyer',
    totp_secret VARCHAR(32),
    totp_enabled BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password resets
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Negotiation deals
CREATE TABLE negotiation_deals (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    supplier_id INT REFERENCES suppliers(id),
    buyer_id INT REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    initial_unit_price FLOAT,
    proposed_unit_price FLOAT,
    final_unit_price FLOAT,
    quantity INT,
    success_probability FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Negotiation rounds
CREATE TABLE negotiation_rounds (
    id SERIAL PRIMARY KEY,
    deal_id INT REFERENCES negotiation_deals(id),
    round_number INT,
    initiator VARCHAR(50),
    proposed_price FLOAT,
    response_message TEXT,
    status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    plan VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage logs
CREATE TABLE usage_log (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    metric VARCHAR(100),
    value FLOAT,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- Payment events
CREATE TABLE payment_events (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    stripe_event_id VARCHAR(255) UNIQUE,
    type VARCHAR(100),
    amount FLOAT,
    currency VARCHAR(3),
    status VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ML model metadata
CREATE TABLE ml_model_metadata (
    id SERIAL PRIMARY KEY,
    model_type VARCHAR(100) NOT NULL,
    version VARCHAR(20),
    training_samples INT,
    accuracy FLOAT,
    last_retrained_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'active',
    model_bytes VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_offers_product_id ON offers(product_id);
CREATE INDEX idx_offers_supplier_id ON offers(supplier_id);
CREATE INDEX idx_price_signals_product_id ON price_signals(product_id);
CREATE INDEX idx_negotiation_deals_buyer_id ON negotiation_deals(buyer_id);
CREATE INDEX idx_negotiation_deals_supplier_id ON negotiation_deals(supplier_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_token ON password_resets(token);
