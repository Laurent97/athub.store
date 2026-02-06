// Install Hook for Partner Products
// This hook handles product installation and management for partners

import { useState } from 'react';

interface InstallHookOptions {
  partnerId: string;
  productId?: string;
  customPrice?: number;
  profitMargin?: number;
}

export const useInstallHook = (options: InstallHookOptions) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const installProduct = async () => {
    if (!options.partnerId || !options.productId) {
      setError('Partner ID and Product ID are required');
      return { success: false, error: 'Missing required fields' };
    }

    setIsInstalling(true);
    setError(null);

    try {
      console.log('🔄 Installing product for partner:', options.partnerId);
      
      // Call your product installation API here
      const response = await fetch('/api/install-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          partnerId: options.partnerId,
          productId: options.productId,
          customPrice: options.customPrice,
          profitMargin: options.profitMargin
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsInstalled(true);
        console.log('✅ Product installed successfully');
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Installation failed');
        return { success: false, error: result.error || 'Installation failed' };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsInstalling(false);
    }
  };

  const uninstallProduct = async () => {
    if (!options.partnerId || !options.productId) {
      setError('Partner ID and Product ID are required');
      return { success: false, error: 'Missing required fields' };
    }

    try {
      console.log('🗑️ Uninstalling product for partner:', options.partnerId);
      
      // Call your product uninstallation API here
      const response = await fetch('/api/uninstall-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          partnerId: options.partnerId,
          productId: options.productId
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsInstalled(false);
        console.log('✅ Product uninstalled successfully');
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Uninstallation failed');
        return { success: false, error: result.error || 'Uninstallation failed' };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsInstalling(false);
    }
  };

  return {
    isInstalled,
    isInstalling,
    error,
    installProduct,
    uninstallProduct
  };
};
