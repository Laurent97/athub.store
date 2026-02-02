import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';

interface ShippingTaxBreakdownProps {
  shippingFee: number;
  taxFee: number;
  orderTotal: number;
  className?: string;
}

export const ShippingTaxBreakdown: React.FC<ShippingTaxBreakdownProps> = ({
  shippingFee = 0,
  taxFee = 0,
  orderTotal = 0,
  className = ''
}) => {
  const totalFees = shippingFee + taxFee;
  const grandTotal = orderTotal + totalFees;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Shipping & Tax Breakdown</h3>
      </div>

      <div className="space-y-3">
        {/* Order Total */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-700 dark:text-gray-300">Order Total:</span>
          <span className="font-medium text-gray-900 dark:text-white">${orderTotal.toFixed(2)}</span>
        </div>

        {/* Shipping Fee */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">Shipping:</span>
          </div>
          <span className="font-medium text-gray-900 dark:text-white">
            ${shippingFee.toFixed(2)}
          </span>
        </div>

        {/* Tax Fee */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">Tax:</span>
          </div>
          <span className="font-medium text-gray-900 dark:text-white">
            ${taxFee.toFixed(2)}
          </span>
        </div>

        {/* Grand Total */}
        <div className="mt-4 pt-3 border-t-2 border-blue-500 dark:border-blue-400">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900 dark:text-white">Grand Total:</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ${grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Info Message */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          ℹ️ Shipping and tax fees must be paid before you can view tracking information and invoice.
        </p>
      </div>
    </div>
  );
};

export default ShippingTaxBreakdown;
