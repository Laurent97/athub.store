-- Fix Crypto Table Script
-- This script creates the crypto_addresses table and inserts the data
-- Run this if the crypto_addresses table doesn't exist or has no data

-- Drop and recreate the table to ensure clean state
DROP TABLE IF EXISTS crypto_addresses CASCADE;

-- Create the crypto_addresses table
CREATE TABLE crypto_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    crypto_type VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    network VARCHAR(50) DEFAULT 'mainnet',
    xrp_tag VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT crypto_addresses_crypto_type_key UNIQUE (crypto_type)
);

-- Insert the crypto addresses
INSERT INTO crypto_addresses (crypto_type, address, is_active, network, xrp_tag) 
VALUES 
    ('BTC', '1FTUbAx5QNTWbxyerMPpxRbwqH3XnvwKQb', true, 'mainnet', NULL),
    ('USDT', 'TYdFjAfhWL9DjaDBAe5LS7zUjBqpYGkRYB', true, 'TRON', NULL),
    ('ETH', '0xd5fffaa3740af39c265563aec8c14bd08c05e838', true, 'mainnet', NULL),
    ('XRP', 'rNxp4h8apvRis6mJf9Sh8C6iRxfrDWN7AV', true, 'mainnet', '476565842');

-- Verify the data was inserted
SELECT 
    crypto_type,
    address,
    is_active,
    network,
    xrp_tag,
    created_at
FROM crypto_addresses 
ORDER BY crypto_type;

-- Success message
SELECT 'Crypto addresses table created and populated successfully!' as status;
