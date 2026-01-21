import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product, PartnerProduct } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, partnerProduct?: PartnerProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  getPartnerCartItems: (partnerId: string) => CartItem[];
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  clearPartnerCart: (partnerId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'auto_vault_cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Fetch cart from partner shopping cart database
  useEffect(() => {
    const fetchCartFromDatabase = async () => {
      try {
        const { data: cartItems, error } = await supabase
          .from('partner_shopping_cart_items')
          .select(`
            *,
            products!inner(
              id,
              title,
              make,
              model,
              images,
              description,
              stock_quantity,
              original_price
            ),
            partner_products!inner(
              id,
              selling_price,
              partner_id
            )
          `);

        if (error) {
          console.error('Error fetching cart from database:', error);
          return;
        }

        if (cartItems) {
          const transformedItems: CartItem[] = cartItems.map((item: any) => ({
            product: item.products,
            partner_product: item.partner_products,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
            name: item.products?.title || `${item.products.make} ${item.products.model}`,
            title: item.products?.title || `${item.products.make} ${item.products.model}`,
            partner_store_name: 'Partner Store', // Default since we removed the join
            partner_id: item.partner_products?.partner_id || '',
          }));

          setItems(transformedItems);
        }
      } catch (error) {
        console.error('Error in fetchCartFromDatabase:', error);
      }
    };

    fetchCartFromDatabase();
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, partnerProduct?: PartnerProduct, quantity = 1) => {
    setItems((prevItems) => {
      // Debug logging
      console.log('Adding to cart:', {
        productId: product.id,
        productTitle: product.title,
        productOriginalPrice: product.original_price,
        partnerProductId: partnerProduct?.id,
        partnerSellingPrice: partnerProduct?.selling_price,
        hasImages: product.images?.length > 0,
        imageUrl: product.images?.[0]
      });

      // Use partnerProduct?.selling_price if available, otherwise use product.price OR product.original_price
      const basePrice = product.price || product.original_price || 0;
      const price = partnerProduct?.selling_price || basePrice;
      
      // Ensure we have a valid price
      if (!price || price <= 0) {
        console.error('Invalid price for product:', product.id, price);
        console.log('Product:', product);
        console.log('Partner Product:', partnerProduct);
        return prevItems;
      }

      const existingItemIndex = prevItems.findIndex(
        (item) => item.product.id === product.id && 
                  item.partner_product?.partner_id === partnerProduct?.partner_id
      );

      // If item already exists with same product and same partner
      if (existingItemIndex !== -1) {
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + quantity,
          subtotal: (existingItem.quantity + quantity) * price,
        };
        
        return updatedItems;
      }

      // Create new cart item
      const newItem: CartItem = {
        product,
        partner_product: partnerProduct,
        quantity,
        unit_price: price,
        subtotal: quantity * price,
        name: product?.title || `${product.make} ${product.model}`,
        title: product?.title || `${product.make} ${product.model}`,
        partner_store_name: partnerProduct?.partner_store_name || 'Partner Store',
        partner_id: partnerProduct?.partner_id || '',
      };

      return [...prevItems, newItem];
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
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getPartnerCartItems = (partnerId: string) => {
    return items.filter(item => item.partner_id === partnerId);
  };

  const getPartnerStoreName = (partnerId: string) => {
    const partnerProduct = items.find(item => item.partner_id === partnerId)?.partner_product;
    return partnerProduct?.partner_store_name || 'Partner Store';
  };

  const clearPartnerCart = (partnerId: string) => {
    setItems(items.filter(item => item.partner_id !== partnerId));
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
    clearPartnerCart,
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
