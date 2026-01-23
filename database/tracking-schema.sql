-- Order Tracking Database Schema
-- Run these SQL commands in your Supabase SQL Editor

-- Create order_tracking table
CREATE TABLE IF NOT EXISTS order_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    tracking_number VARCHAR(100) UNIQUE,
    shipping_method VARCHAR(50),
    carrier VARCHAR(100),
    status VARCHAR(50) DEFAULT 'shipped' CHECK (status IN ('shipped', 'in_transit', 'out_for_delivery', 'delivered')),
    admin_id UUID REFERENCES auth.users(id),
    partner_id UUID REFERENCES partner_profiles(id),
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tracking_updates table
CREATE TABLE IF NOT EXISTS tracking_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracking_id UUID REFERENCES order_tracking(id) ON DELETE CASCADE,
    location VARCHAR(255),
    status VARCHAR(100),
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Add tracking_id reference to orders table (if not exists)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_id UUID REFERENCES order_tracking(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_tracking_number ON order_tracking(tracking_number);
CREATE INDEX IF NOT EXISTS idx_order_tracking_partner_id ON order_tracking(partner_id);
CREATE INDEX IF NOT EXISTS idx_tracking_updates_tracking_id ON tracking_updates(tracking_id);

-- Enable Row Level Security
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_tracking
-- Admins can read all tracking info
CREATE POLICY "Admins can view all tracking" ON order_tracking
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Partners can only view tracking for their orders
CREATE POLICY "Partners can view their tracking" ON order_tracking
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'partner' AND partner_id = auth.uid()
    );

-- Users can view tracking by tracking number
CREATE POLICY "Users can view tracking by number" ON order_tracking
    FOR SELECT USING (
        tracking_number IS NOT NULL
    );

-- Admins can insert tracking
CREATE POLICY "Admins can insert tracking" ON order_tracking
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Admins can update tracking
CREATE POLICY "Admins can update tracking" ON order_tracking
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- RLS Policies for tracking_updates
-- Admins can read all updates
CREATE POLICY "Admins can view all updates" ON tracking_updates
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Partners can view updates for their tracking
CREATE POLICY "Partners can view their updates" ON tracking_updates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM order_tracking ot 
            WHERE ot.id = tracking_id 
            AND ot.partner_id = auth.uid()
        )
    );

-- Users can view updates by tracking number
CREATE POLICY "Users can view updates by tracking number" ON tracking_updates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM order_tracking ot 
            WHERE ot.id = tracking_id 
            AND ot.tracking_number IS NOT NULL
        )
    );

-- Admins can insert updates
CREATE POLICY "Admins can insert updates" ON tracking_updates
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_order_tracking_updated_at 
    BEFORE UPDATE ON order_tracking 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to create initial tracking update
CREATE OR REPLACE FUNCTION create_initial_tracking_update()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tracking_updates (tracking_id, status, description, updated_by)
    VALUES (
        NEW.id,
        'shipped',
        'Package shipped with tracking number ' || COALESCE(NEW.tracking_number, 'pending'),
        NEW.admin_id
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to create initial tracking update
CREATE TRIGGER create_initial_tracking_update_trigger
    AFTER INSERT ON order_tracking
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_tracking_update();

-- Grant necessary permissions
GRANT ALL ON order_tracking TO authenticated;
GRANT ALL ON tracking_updates TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
