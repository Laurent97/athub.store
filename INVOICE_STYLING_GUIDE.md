# Invoice Feature - Styling & Customization Guide

## Invoice Template Styling

### Color Scheme

#### Status Badge Colors:
```
Completed:          #10B981 (Green)   - bg-green-100, text-green-800
Pending:            #FBBF24 (Yellow)  - bg-yellow-100, text-yellow-800
Processing:         #8B5CF6 (Purple)  - bg-purple-100, text-purple-800
Shipped:            #3B82F6 (Blue)    - bg-blue-100, text-blue-800
Cancelled:          #6B7280 (Gray)    - bg-gray-100, text-gray-800
```

#### Primary Brand Colors:
```
Primary Blue:       #2563EB (bg-blue-600)
Dark Background:    #1F2937 (text-gray-900)
Light Background:   #F9FAFB (bg-gray-50)
Border Color:       #E5E7EB (border-gray-200)
```

### Typography

#### Font Family:
```css
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
line-height: 1.6;
```

#### Font Sizes:
```
Company Name:       3xl (30px) - bold
Section Headers:    lg (18px) - semibold
Body Text:          sm/base - normal
Footer:             xs (12px) - muted
```

### Spacing

```
Padding:            Standard: 1.5rem (24px)
                    Compact: 1rem (16px)
                    
Margin:             Section gap: 2rem (32px)
                    Item gap: 1rem (16px)
                    
Border Radius:      Standard: 0.375rem (6px)
                    Large: 0.5rem (8px)
```

## Component Customization

### 1. Changing the Company Name/Logo

**File:** `src/components/Invoice/InvoiceTemplate.tsx` (Line ~46)

```typescript
// Change this:
<div className="text-3xl font-bold text-blue-600 mb-1">AUTO TRADE HUB</div>
<div className="text-sm text-gray-600">athub.store</div>

// To your company name:
<div className="text-3xl font-bold text-blue-600 mb-1">YOUR COMPANY NAME</div>
<div className="text-sm text-gray-600">your-website.com</div>
```

### 2. Changing Primary Colors

To change the blue theme color throughout:

**Before:**
```typescript
className="text-blue-600"  // Text color
className="bg-blue-600"    // Background
className="border-blue-600" // Border
```

**After:** (Change to preferred color, e.g., emerald)
```typescript
className="text-emerald-600"  // Text color
className="bg-emerald-600"    // Background
className="border-emerald-600" // Border
```

### 3. Customizing Invoice Header

**Current Layout:**
```
Left side:  Company name & website
Right side: "INVOICE" label & order number
```

**To add logo:**
```typescript
<img src="/logo.png" alt="Logo" className="h-12 mr-4" />
<div>
  <div className="text-3xl font-bold text-blue-600 mb-1">AUTO TRADE HUB</div>
  <div className="text-sm text-gray-600">athub.store</div>
</div>
```

### 4. Modifying Status Badge Colors

**File:** `src/components/Invoice/InvoiceTemplate.tsx` (Line ~82)

```typescript
// Current status colors:
const statusColors = {
  'completed': 'bg-green-100 text-green-800',
  'pending': 'bg-yellow-100 text-yellow-800',
  'processing': 'bg-purple-100 text-purple-800',
  'shipped': 'bg-blue-100 text-blue-800'
};

// Customize as needed:
const statusColors = {
  'completed': 'bg-emerald-100 text-emerald-800',
  'pending': 'bg-orange-100 text-orange-800',
  'processing': 'bg-indigo-100 text-indigo-800',
  'shipped': 'bg-cyan-100 text-cyan-800'
};
```

## Modal Styling

### Order Details Modal

**File:** `src/pages/OrderDetails.tsx` (Line ~710)

```typescript
<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
    // ... modal content
  </div>
</div>
```

**Customizable Properties:**
- `bg-opacity-50`: Backdrop darkness (0-100)
- `max-w-4xl`: Modal max width
- `shadow-xl`: Shadow intensity
- `rounded-lg`: Border radius

### My Orders Modal

**File:** `src/pages/MyOrders.tsx` (Line ~350)

Same structure as Order Details modal - customize in the same way.

## Button Styling

### Invoice Display Button

```typescript
// Current styling:
className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"

// To change:
// - Color: bg-emerald-600 → bg-blue-600 (or any Tailwind color)
// - Size: px-4 py-2 → px-6 py-3 (larger)
// - Icon: <FileText /> → <DollarSign /> (different icon)
```

### Download PDF Button

```typescript
// Current styling:
className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"

// Key properties:
// - w-full: Full width
// - bg-blue-600: Background color
// - disabled:opacity-50: Disabled state styling
// - transition-colors: Smooth color transitions
```

## Dark Mode Support

The invoice template includes full dark mode support using Tailwind's `dark:` prefix.

**Current dark mode colors:**
```
Dark Text:       dark:text-white
Dark Background: dark:bg-gray-800
Dark Border:     dark:border-gray-700
Dark Muted:      dark:text-gray-400
```

### To enhance dark mode:

```typescript
// Add dark mode class to parent container:
<div className="dark">
  <InvoiceTemplate order={order} />
</div>

// Or update individual elements:
<div className="bg-white dark:bg-gray-900">
  {/* Content */}
</div>
```

## Responsive Design

### Current Breakpoints

```
Mobile:    < 640px (sm:)
Tablet:    640px-1024px (md:)
Desktop:   > 1024px (lg:)
```

### Invoice Grid Layout

**Current responsive layout:**
```typescript
<div className="grid grid-cols-2 gap-8 mb-8">  // 2 columns on desktop
  {/* Bill To */}
  {/* Ship To */}
</div>
```

**For smaller screens:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">  // 1 col mobile, 2 col desktop
  {/* Bill To */}
  {/* Ship To */}
</div>
```

## Print Styling

### Print Optimization

The invoice is automatically optimized for printing with:
- White background (`bg-white`)
- High contrast text
- Appropriate padding (`p-8` when not printing)
- Color-safe design

### Customizing for Print

```css
@media print {
  #invoice-template {
    max-width: 100%;
    padding: 0;
    margin: 0;
  }
  
  .no-print {
    display: none;
  }
}
```

## Table Styling

### Line Items Table

```typescript
<table className="w-full text-sm">
  <thead>
    <tr className="bg-blue-600 text-white">  // Change bg-blue-600 for header color
      {/* Headers */}
    </tr>
  </thead>
  <tbody>
    {items.map((item, index) => (
      <tr className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
        {/* Rows */}
      </tr>
    ))}
  </tbody>
</table>
```

**Customizable:**
- Header background: `bg-blue-600`
- Row striping: `bg-white` / `bg-gray-50`
- Border color: `border-gray-200`

## Totals Section Styling

### Summary Box

```typescript
<div className="w-full max-w-xs">
  <div className="bg-white border border-gray-200 rounded">  // Customize border
    {/* Totals */}
  </div>
</div>
```

**Color customization:**
```
Tax row:      text-gray-600 (muted)
Discount row: text-green-600 (positive)
Total row:    text-blue-600 (highlight)
```

## Font Customization

### To change font family globally

**Option 1: Update InvoiceTemplate.tsx**
```typescript
style={{
  fontFamily: "'Your Font', sans-serif",
  lineHeight: '1.6',
  color: '#1f2937'
}}
```

**Option 2: Update in tailwind.config.ts**
```typescript
theme: {
  fontFamily: {
    sans: ['Your Font', 'sans-serif'],
  }
}
```

## Icons Used

Currently using Lucide React icons:
```typescript
<FileText />    // Invoice icon
<Download />    // Download icon
<DollarSign />  // Money icon
<Package />     // Package icon
<MapPin />      // Location icon
<Truck />       // Shipping icon
```

### To replace icons:
```typescript
// Import from lucide-react
import { DifferentIcon } from 'lucide-react';

// Replace in component
<DifferentIcon className="w-4 h-4" />
```

## Export Format Customization

### Current PDF filename format:
```
Invoice_ORD-[ORDER_NUMBER]_[DATE].pdf
```

### To customize (in `pdf-generator.ts`):
```typescript
// Change line:
const filename = `Invoice_${orderNumber}_${new Date().toISOString().split('T')[0]}.pdf`;

// To:
const filename = `Invoice-${orderNumber}-${new Date().getTime()}.pdf`;
```

## Testing Customizations

After making styling changes:

1. **Local Testing:**
   ```bash
   npm run dev
   ```

2. **Build Testing:**
   ```bash
   npm run build
   ```

3. **Visual Testing:**
   - Navigate to Orders page
   - Click "Invoice" button
   - Verify styling appears as expected
   - Test PDF download

## Common Customizations Checklist

- [ ] Company name/logo
- [ ] Primary color scheme
- [ ] Status badge colors
- [ ] Font family
- [ ] Spacing/padding
- [ ] Button styling
- [ ] Dark mode colors
- [ ] Print optimization
- [ ] Footer text/contact info
- [ ] Header layout

## Support

For questions or additional customization needs, refer to:
- Tailwind CSS Documentation: https://tailwindcss.com
- Lucide Icons: https://lucide.dev
- React Documentation: https://react.dev
