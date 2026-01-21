import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product, PartnerProduct } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, partnerProduct?: PartnerProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getPartnerCartItems: (partnerId: string) => CartItem[];
  clearPartnerCart: (partnerId: string) => void;
}

const CART_STORAGE_KEY = 'auto_vault_cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load from localStorage
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = async (product: Product, partnerProduct?: PartnerProduct, quantity = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      const price = partnerProduct?.custom_price || partnerProduct?.original_price || product.original_price;

      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * price,
              }
            : item
        );
      }

      return [
        ...prevItems,
        {
          product,
          partner_product: partnerProduct,
          quantity,
          unit_price: price,
          subtotal: quantity * price,
          name: product?.title || `${product.make} ${product.model}`,
          title: product?.title || `${product.make} ${product.model}`,
          partner_store_name: partnerProduct?.partner_store_name || 'Partner Store',
        },
      ];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unit_price,
            }
            : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((total, item) => total + item.subtotal, 0);
  };

  const getItemCount = () => {
    return items.length;
  };

  // Function to get partner store name
  const getPartnerStoreName = async (partnerId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('partner_profiles')
        .select('store_name')
        .eq('user_id', partnerId)
        .single();

      if (error) {
        console.error('Error fetching partner store name:', error);
        return 'Partner Store';
      }

      return data?.store_name || 'Partner Store';
    } catch (error) {
      console.error('Error in getPartnerStoreName:', error);
      return 'Partner Store';
    }
  };

  const getPartnerCartItems = async (partnerId: string): Promise<CartItem[]> => {
    try {
      const { data, error } = await supabase
        .from('partner_products')
        .select(`
          *,
          product:products(id, title, description, images, stock_quantity, original_price),
          partner:partner_profiles!inner(
            partner_profiles!inner(
              user_id,
              store_name
            )
          )
        `)
        .eq('partner_profiles.user_id', partnerId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching partner cart items:', error);
        return [];
      }

      const cartItems: CartItem[] = (data || []).map((pp: any) => {
        const product = pp.product;
        if (!product) return null;

        return {
          product,
          partner_product: pp,
          quantity: pp.quantity || 1,
          unit_price: pp.selling_price || product.original_price,
          subtotal: (pp.quantity || 1) * (pp.selling_price || product.original_price),
          name: product?.title || `${product.make} ${product.model}`,
          title: product?.title || `${product.make} ${product.model}`,
          partner_store_name: pp.partner?.store_name || 'Partner Store',
        };
      });

      return cartItems;
    } catch (error) {
      console.error('Error in getPartnerCartItems:', error);
      return [];
    }
  };

  const clearPartnerCart = (partnerId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.partner_product.partner_id !== partnerId));
  };

  const contextValue: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
    getPartnerCartItems,
    getPartnerStoreName,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
