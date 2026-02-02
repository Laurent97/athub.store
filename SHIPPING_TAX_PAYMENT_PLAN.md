# Shipping & Tax Payment System - Implementation Plan

## Overview
After customers complete their initial order payment, they will pay separately for **shipping fees** and **taxes** once the admin starts the shipment process.

---

## Database Schema Changes Needed

### 1. Extend `orders` Table
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tax_payment_status TEXT DEFAULT 'pending' 
  CHECK (shipping_tax_payment_status IN ('pending', 'pending_confirmation', 'verified', 'rejected', 'paid'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tax_paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tax_amount DECIMAL(10,2) GENERATED ALWAYS AS (shipping_fee + tax_fee) STORED;
```

### 2. Create `shipping_tax_payments` Table
```sql
CREATE TABLE IF NOT EXISTS shipping_tax_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    
    -- Fee breakdown
    shipping_fee DECIMAL(10,2) NOT NULL,
    tax_fee DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (shipping_fee + tax_fee) STORED,
    
    -- Payment details (reuse pending_payments structure)
    payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'crypto', 'wallet', 'bank')),
    
    -- Payment method specific fields
    stripe_payment_intent_id TEXT,
    paypal_transaction_id TEXT,
    crypto_transaction_id TEXT,
    bank_transaction_reference TEXT,
    wallet_transaction_id TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_confirmation', 'verified', 'rejected', 'paid')),
    
    -- Admin confirmation
    confirmed_by UUID,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shipping_tax_payments_order_id ON shipping_tax_payments(order_id);
CREATE INDEX idx_shipping_tax_payments_customer_id ON shipping_tax_payments(customer_id);
CREATE INDEX idx_shipping_tax_payments_status ON shipping_tax_payments(status);
CREATE INDEX idx_shipping_tax_payments_created_at ON shipping_tax_payments(created_at DESC);
```

---

## Workflow & Status Transitions

### Current Order Status Flow
```
pending → confirmed → processing → shipped → delivered
```

### New Shipping & Tax Payment Flow
```
1. ORDER PLACED
   - Status: pending
   - shipping_tax_payment_status: pending (initial)

2. ADMIN STARTS SHIPPING
   - Admin adds tracking info
   - Admin calculates shipping_fee + tax_fee
   - shipping_tax_payment_status: CHANGES TO "pending"
   - Customer notification sent

3. CUSTOMER SEES PAYMENT PROMPT
   - On /orders/:orderId page
   - New section: "Complete Shipping & Tax Payment"
   - Shows breakdown: shipping + tax + total

4. CUSTOMER INITIATES PAYMENT
   - Clicks "Pay Shipping & Tax"
   - Redirected to payment form (similar to order payment)
   - shipping_tax_payment_status: "pending_confirmation" (for PayPal/Crypto)
   - shipping_tax_payment_status: "verified" (for Stripe/Wallet - immediate)

5. ADMIN CONFIRMS (if PayPal/Crypto/Bank)
   - Reviews in /admin/payments dashboard
   - Confirms or rejects payment
   - shipping_tax_payment_status: "verified" OR "rejected"

6. PAYMENT CONFIRMED
   - shipping_tax_payment_status: "paid"
   - shipping_tax_paid_at: timestamp
   - Orders status remains "processing"
   - **Customer gains access to:**
     - ✅ Tracking information
     - ✅ Invoice
     - ✅ Delivery updates

7. ORDER SHIPPED & BEYOND
   - Normal tracking updates
   - Order delivery continues
```

---

## Frontend Components Needed

### 1. OrderDetails.tsx - New Section
```
Current sections:
- Order Summary ✓
- Items ✓
- Shipping Address ✓
- Actions ✓

NEW SECTION:
═══════════════════════════════════
📦 Shipping & Tax Payment
═══════════════════════════════════
Status: Pending Payment

Breakdown:
  Shipping Fee: $25.00
  Tax (10%):   $10.00
  ─────────────────────
  Total:       $35.00

[Pay Now] Button
═══════════════════════════════════
```

### 2. ShippingTaxPaymentModal.tsx
- Similar to existing payment modal
- Shows fee breakdown
- Integrates with existing payment methods (Stripe, PayPal, Crypto, Bank, Wallet)

### 3. Admin: Orders.tsx Updates
- Add "Set Shipping Fee & Tax" field next to tracking
- Auto-calculate tax based on shipping fee or custom % 
- Trigger button: "Send Payment Invoice to Customer"

### 4. Admin: Payments Dashboard Updates
- New tab: "Shipping & Tax Payments"
- Review pending shipping/tax payments
- Approve/Reject mechanism

---

## API/Service Functions Needed

### 1. orderService.ts - New Functions
```typescript
// Get shipping & tax payment details for an order
getShippingTaxPayment(orderId: string): Promise<ShippingTaxPayment>

// Check if customer can view tracking (payment completed)
canViewTracking(orderId: string): Promise<boolean>

// Check if customer can view invoice (payment completed)
canViewInvoice(orderId: string): Promise<boolean>
```

### 2. adminService.ts - New Functions
```typescript
// Admin sets shipping & tax fees for an order
setShippingTaxFees(orderId: string, shippingFee: number, taxFee: number): Promise<void>

// Get pending shipping/tax payments for admin review
getPendingShippingTaxPayments(status: string): Promise<ShippingTaxPayment[]>

// Admin confirms shipping/tax payment
confirmShippingTaxPayment(paymentId: string): Promise<void>

// Admin rejects shipping/tax payment
rejectShippingTaxPayment(paymentId: string, reason: string): Promise<void>
```

### 3. paymentService.ts - New Function
```typescript
// Process shipping & tax payment through existing payment system
processShippingTaxPayment(orderData: {
  orderId: string,
  customerId: string,
  amount: number,
  paymentMethod: string,
  // ... other payment details
}): Promise<PaymentResult>
```

---

## Access Control Rules

### Customer Access
```typescript
// Can see shipping address & total amount: YES (always)
// Can see tracking info: YES (only if shipping_tax_payment_status === 'paid')
// Can see invoice: YES (only if shipping_tax_payment_status === 'paid')
// Can make shipping/tax payment: YES (only if status === 'pending')
```

### Partner Access
```typescript
// Shipping is FREE for partners
// No shipping/tax payment required
// Partners see orders as usual
```

### Admin Access
```typescript
// Can set shipping & tax fees: YES
// Can view all pending shipping/tax payments: YES
// Can confirm/reject payments: YES
// Can send payment invoice to customer: YES
```

---

## Status Display Logic

### Customer's Order Detail Page
```
IF shipping_tax_payment_status === 'pending' AND order.status === 'processing'
  ├─ Show: "Payment Required"
  ├─ Show: Shipping & Tax breakdown
  ├─ Show: [Pay Now] button
  └─ Show: "Complete this payment to view tracking info"

ELSE IF shipping_tax_payment_status === 'pending_confirmation'
  ├─ Show: "Payment Pending Admin Confirmation"
  └─ Show: "We will notify you when payment is confirmed"

ELSE IF shipping_tax_payment_status === 'verified' OR 'paid'
  ├─ Show: Tracking information ✓
  ├─ Show: Invoice ✓
  └─ Show: All delivery updates ✓

ELSE IF shipping_tax_payment_status === 'rejected'
  ├─ Show: "Payment Rejected"
  ├─ Show: Rejection reason
  └─ Show: [Retry Payment] button
```

---

## Implementation Phases

### Phase 1: Database Setup (Done)
- [x] Create migration scripts
- [x] Add columns to orders table
- [x] Create shipping_tax_payments table
- [x] Add indexes and RLS policies

### Phase 2: Admin Interface (In Progress)
- [ ] Update Orders.tsx to show "Set Shipping & Tax" UI
- [ ] Add admin dashboard for pending payments
- [ ] Create confirm/reject UI

### Phase 3: Customer UI
- [ ] Update OrderDetails.tsx to show payment section
- [ ] Create ShippingTaxPaymentModal component
- [ ] Add logic to hide tracking until payment confirmed

### Phase 4: Payment Processing
- [ ] Integrate with existing payment system
- [ ] Handle all payment methods (Stripe, PayPal, Crypto, Bank, Wallet)
- [ ] Add notifications for payment updates

### Phase 5: Access Control
- [ ] Implement RLS policies
- [ ] Add authorization checks
- [ ] Test partner exemption logic

### Phase 6: Testing & Deployment
- [ ] Unit tests for payment logic
- [ ] Integration tests for workflows
- [ ] Production deployment

---

## Key Business Rules

1. **Partners**: Shipping is ALWAYS free (no shipping/tax payment required)
2. **Customers**: Must pay shipping + tax AFTER order is placed, BEFORE viewing tracking
3. **Admin**: Sets fees ONCE per order (when starting shipment)
4. **Payment Methods**: Use existing system (Stripe, PayPal, Crypto, Bank, Wallet)
5. **Tracking Release**: Only visible after shipping_tax_payment_status === 'paid'

---

## Files to Modify/Create

### Database
- [ ] migrations/add_shipping_tax_payments_table.sql
- [ ] migrations/extend_orders_table.sql

### Frontend Components
- [ ] src/components/ShippingTaxPaymentModal.tsx (NEW)
- [ ] src/components/ShippingTaxPaymentBreakdown.tsx (NEW)
- [ ] src/pages/OrderDetails.tsx (UPDATE)
- [ ] src/pages/admin/Orders.tsx (UPDATE)
- [ ] src/pages/admin/Payments.tsx (UPDATE)

### Services & Utilities
- [ ] src/lib/supabase/order-service.ts (UPDATE)
- [ ] src/lib/supabase/admin-service.ts (UPDATE)
- [ ] src/services/payment-service.ts (UPDATE)

### Types
- [ ] src/lib/types/database.ts (UPDATE - add ShippingTaxPayment type)

---

## Next Steps
1. Create database migration scripts
2. Run migrations on Supabase
3. Begin Phase 2: Admin interface implementation
4. Implement ShippingTaxPaymentModal component
5. Add access control logic to OrderDetails.tsx
6. Integrate with existing payment system
7. Test complete workflow
8. Deploy to production
