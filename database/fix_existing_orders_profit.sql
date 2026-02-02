-- Fix existing orders where total_amount equals base_cost_total
-- This script updates orders to have the correct selling price

-- First, let's see how many orders are affected
SELECT 
  COUNT(*) as affected_orders,
  SUM(total_amount) as current_total,
  SUM(base_cost_total) as current_base_cost,
  AVG(total_amount - base_cost_total) as avg_profit
FROM orders 
WHERE partner_id IS NOT NULL 
  AND total_amount = base_cost_total 
  AND base_cost_total > 0;

-- Update orders where total_amount equals base_cost_total
-- We'll calculate a reasonable selling price (base_cost + 25% markup)
UPDATE orders 
SET 
  total_amount = base_cost_total * 1.25,
  updated_at = NOW()
WHERE partner_id IS NOT NULL 
  AND total_amount = base_cost_total 
  AND base_cost_total > 0;

-- Verify the updates
SELECT 
  COUNT(*) as updated_orders,
  SUM(total_amount) as new_total,
  SUM(base_cost_total) as base_cost,
  SUM(total_amount - base_cost_total) as total_profit,
  AVG(total_amount - base_cost_total) as avg_profit
FROM orders 
WHERE partner_id IS NOT NULL 
  AND base_cost_total > 0;

-- Show sample of updated orders
SELECT 
  order_number,
  total_amount,
  base_cost_total,
  total_amount - base_cost_total as profit,
  updated_at
FROM orders 
WHERE partner_id IS NOT NULL 
  AND base_cost_total > 0
ORDER BY updated_at DESC
LIMIT 10;
