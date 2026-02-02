import React from 'react';
import { format } from 'date-fns';

interface InvoiceItem {
  id?: string;
  product_id?: string;
  product?: {
    id: string;
    title: string;
    make?: string;
    model?: string;
    year?: number;
    price: number;
    image?: string;
  };
  quantity: number;
  unit_price: number;
  total_price?: number;
}

interface ShippingAddress {
  full_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
}

interface OrderData {
  id: string;
  order_number: string;
  customer?: {
    email?: string;
    full_name?: string;
  };
  customer_email?: string;
  customer_name?: string;
  total_amount: number;
  subtotal?: number;
  shipping_cost?: number;
  tax_amount?: number;
  discount_amount?: number;
  status: string;
  payment_method?: string;
  created_at: string;
  shipping_address?: ShippingAddress;
  order_items?: InvoiceItem[];
  notes?: string;
}

interface InvoiceTemplateProps {
  order: OrderData;
  forPrint?: boolean;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ 
  order, 
  forPrint = false 
}) => {
  const items = order.order_items || [];
  const subtotal = order.subtotal || items.reduce((sum, item) => sum + (item.total_price || item.unit_price * item.quantity), 0);
  const tax = order.tax_amount || 0;
  const shipping = order.shipping_cost || 0;
  const discount = order.discount_amount || 0;
  
  const customerName = order.customer?.full_name || order.customer_name || 'Customer';
  const customerEmail = order.customer?.email || order.customer_email || '';
  
  const shippingAddress = order.shipping_address || {};

  return (
    <div 
      id="invoice-template"
      className={`${forPrint ? 'p-0' : 'p-8'} bg-white text-gray-900`}
      style={{
        maxWidth: forPrint ? '100%' : '900px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        lineHeight: '1.6',
        color: '#1f2937'
      }}
    >
      {/* Header Section */}
      <div className="border-b-4 border-blue-600 pb-6 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-1">AUTO TRADE HUB</div>
            <div className="text-sm text-gray-600">athub.store</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-800">INVOICE</div>
            <div className="text-sm text-gray-600 mt-1">
              Order #{order.order_number}
            </div>
          </div>
        </div>
      </div>

      {/* Date and Status Section */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Invoice Date</div>
          <div className="text-sm font-medium text-gray-900">
            {format(new Date(order.created_at), 'MMM dd, yyyy')}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Order Status</div>
          <div className="text-sm font-medium">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              order.status === 'completed' ? 'bg-green-100 text-green-800' :
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
              order.status === 'processing' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
            </span>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Payment Method</div>
          <div className="text-sm font-medium text-gray-900">
            {order.payment_method ? order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1) : 'Not specified'}
          </div>
        </div>
      </div>

      {/* Customer and Shipping Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Bill To */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bill To</div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="font-semibold text-gray-900 mb-1">{customerName}</div>
            <div className="text-sm text-gray-600 mb-1">{customerEmail}</div>
          </div>
        </div>

        {/* Ship To */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ship To</div>
          <div className="bg-gray-50 p-4 rounded text-sm text-gray-700 space-y-1">
            <div className="font-semibold text-gray-900">{shippingAddress.full_name || customerName}</div>
            <div>{shippingAddress.address_line1}</div>
            {shippingAddress.address_line2 && <div>{shippingAddress.address_line2}</div>}
            <div>
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}
            </div>
            <div>{shippingAddress.country}</div>
            {shippingAddress.phone && <div className="text-gray-600 text-xs mt-2">Phone: {shippingAddress.phone}</div>}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="px-4 py-3 text-left font-semibold">Description</th>
              <th className="px-4 py-3 text-center font-semibold">Qty</th>
              <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
              <th className="px-4 py-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const itemTotal = item.total_price || (item.unit_price * item.quantity);
              const product = item.product;
              const description = product 
                ? `${product.title}${product.year ? ` (${product.year})` : ''}${product.make ? ` - ${product.make}` : ''}${product.model ? ` ${product.model}` : ''}`
                : 'Product';
              
              return (
                <tr key={item.id || index} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-4 py-3 text-gray-900">{description}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-700">${item.unit_price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">${itemTotal.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-8">
        <div className="w-full max-w-xs">
          <div className="bg-white border border-gray-200 rounded">
            <div className="space-y-3 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900 font-medium">${subtotal.toFixed(2)}</span>
              </div>
              
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="text-gray-900 font-medium">${tax.toFixed(2)}</span>
                </div>
              )}
              
              {shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="text-gray-900 font-medium">${shipping.toFixed(2)}</span>
                </div>
              )}
              
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Discount:</span>
                  <span className="text-green-600 font-medium">-${discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-lg text-blue-600">${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2">Notes</div>
          <div className="text-sm text-blue-900">{order.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-200 pt-6 text-center text-xs text-gray-500 space-y-2">
        <div>Thank you for your business!</div>
        <div className="text-gray-400">
          Auto Trade Hub • athub.store • support@athub.store
        </div>
        <div className="text-gray-400">
          Invoice #{order.order_number} • Generated on {format(new Date(), 'MMM dd, yyyy HH:mm')}
        </div>
      </div>
    </div>
  );
};
