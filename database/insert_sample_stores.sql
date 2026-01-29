-- Script to insert sample stores with valid user IDs
-- Run this after creating the stores table and after you have valid users

-- First, check what users exist in the auth.users table
SELECT 'Available users in auth.users:' as info;
SELECT id, email, created_at FROM auth.users LIMIT 5;

-- Check what users exist in the public.users table (if it exists)
SELECT 'Available users in public.users:' as info;
SELECT id, email, user_type FROM public.users LIMIT 5;

-- Insert sample stores with a valid user ID
-- Replace 'VALID_USER_ID_HERE' with an actual user ID from the queries above

-- Example: If you have a user with ID '12345678-1234-1234-1234-123456789012'
-- Uncomment and update the following lines:

/*
INSERT INTO stores (name, slug, description, contact_email, is_active, rating, total_products, active_products, owner_id) VALUES
('Auto Parts Store', 'auto-parts-store', 'Your one-stop shop for quality auto parts and accessories', 'contact@autoparts.com', true, 4.5, 150, 120, 'VALID_USER_ID_HERE'),
('Electronics Hub', 'electronics-hub', 'Latest electronics and gadgets at competitive prices', 'info@electronicshub.com', true, 4.2, 200, 180, 'VALID_USER_ID_HERE'),
('Performance Motors', 'performance-motors', 'High-performance automotive parts and accessories', 'sales@performancemotors.com', true, 4.8, 100, 85, 'VALID_USER_ID_HERE');
*/

-- Verify the stores were created
SELECT 'Created stores:' as info;
SELECT id, name, slug, owner_id, is_active, created_at FROM stores ORDER BY created_at DESC;
