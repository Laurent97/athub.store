import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase/client';
import { ProductCategory, Condition } from '../lib/types/database';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/CustomerService/WhatsAppButton';
import StoreProducts from '../components/Partner/StoreProducts';

interface PartnerStore {
  id: string;
  user_id: string;
  store_name: string;
  store_slug: string;
  description: string;
  logo_url: string;
  banner_url: string;
  contact_email: string;
  contact_phone: string;
  country: string;
  city: string;
  total_earnings: number;
  store_visits: number;
  conversion_rate: number;
  is_active: boolean;
  partner_status: string;
  created_at: string;
}

interface StoreProduct {
  id: string;
  product_id: string;
  partner_id: string;
  selling_price: number;
  is_available: boolean;
  created_at: string;
  products: {
    id: string;
    sku: string;
    title: string;
    description?: string;
    images: string[];
    category: ProductCategory;
    make?: string;
    model?: string;
    year?: number;
    mileage?: number;
    condition?: Condition;
    specifications?: Record<string, unknown>;
    original_price: number;
    quantity_available: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export default function Store() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  
  const [store, setStore] = useState<PartnerStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    avgRating: 0,
    responseTime: '1-2 hours'
  });

  const loadStore = useCallback(async () => {
    setLoading(true);
    try {
      // Load store info
      const { data: storeData, error: storeError } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('store_slug', storeSlug)
        .eq('is_active', true)
        .eq('partner_status', 'approved')
        .single();

      if (storeError || !storeData) {
        navigate('/not-found');
        return;
      }

      setStore(storeData);

      // Load store products
      const { data: productsData } = await supabase
        .from('partner_products')
        .select(`
          *,
          products (*)
        `)
        .eq('partner_id', storeData.id)
        .eq('is_available', true);

      setProducts(productsData || []);

      // Calculate stats
      const totalProducts = productsData?.length || 0;
      const totalSales = storeData.total_earnings || 0;

      setStats({
        totalProducts,
        totalSales,
        avgRating: 4.8, // Would come from reviews table
        responseTime: '1-2 hours'
      });

    } catch (error) {
      console.error('Error loading store:', error);
      navigate('/not-found');
    } finally {
      setLoading(false);
    }
  }, [storeSlug, navigate]);

  const trackStoreVisit = useCallback(async () => {
    if (!storeSlug || !store) return;
    
    try {
      // Record store visit
      await supabase
        .from('store_visits')
        .insert({
          partner_id: store.id,
          page_visited: `store/${storeSlug}`,
          visitor_id: user?.id || 'anonymous'
        });

      // Increment store visit count
      await supabase
        .from('partner_profiles')
        .update({
          store_visits: (store.store_visits || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', store.id);
    } catch (error) {
      console.error('Error tracking store visit:', error);
    }
  }, [storeSlug, store, user]);

  useEffect(() => {
    if (storeSlug) {
      loadStore();
    }
  }, [storeSlug, loadStore]);

  useEffect(() => {
    if (storeSlug && store) {
      trackStoreVisit();
    }
  }, [storeSlug, store, trackStoreVisit]);

  const handleAddToCart = async (product: StoreProduct) => {
    if (!product.products) return;
    
    // Convert StoreProduct to PartnerProduct format for cart
    const partnerProduct = {
      id: product.id,
      partner_id: store?.id || '',
      product_id: product.product_id,
      selling_price: product.selling_price, // ✅ Fixed: Use selling_price instead of custom_price
      is_available: product.is_available,
      created_at: new Date().toISOString()
    };
    
    addItem(product.products, partnerProduct, 1);
  };

  const handleDirectOrder = async (product: StoreProduct) => {
    if (!user) {
      navigate('/login', { state: { from: `/store/${storeSlug}` } });
      return;
    }

    // Create direct order
    try {
      // Check if user has enough balance
      const { data: wallet } = await supabase
        .from('wallet_balances')
        .select('available_balance')
        .eq('user_id', user.id)
        .single();

      if (!wallet || wallet.available_balance < product.custom_price) {
        alert('Insufficient balance. Please add funds to your wallet.');
        navigate('/payment/crypto-deposit');
        return;
      }

      // Create order
      const orderNumber = `STORE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: user.id,
          partner_id: store?.id,
          total_amount: product.custom_price,
          status: 'pending',
          payment_status: 'paid', // Since using wallet balance
          shipping_address: {}, // Would get from user profile
          payment_method: 'wallet'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Add order item
      await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product.product_id,
          partner_product_id: product.id,
          quantity: 1,
          selling_price: product.selling_price, 
        });

      // Deduct from wallet
      await supabase
        .from('wallet_balances')
        .update({
          available_balance: wallet.available_balance - product.custom_price,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', user.id);

      // Create payment record
      await supabase
        .from('order_payments')
        .insert({
          order_id: order.id,
          payment_type: 'wallet',
          amount: product.custom_price,
          status: 'completed',
          paid_at: new Date().toISOString()
        });

      // Calculate partner earnings
      const { data: partnerProfile } = await supabase
        .from('partner_profiles')
        .select('commission_rate')
        .eq('id', store?.id)
        .single();

      const commissionRate = partnerProfile?.commission_rate || 15;
      const commission = (product.custom_price * commissionRate) / 100;
      const partnerShare = product.custom_price - commission;

      // Create earnings record
      await supabase
        .from('partner_earnings')
        .insert({
          partner_id: store?.id,
          order_id: order.id,
          product_id: product.product_id,
          sale_amount: product.custom_price,
          commission: commission,
          status: 'pending'
        });

      // Update partner pending balance
      const { data: partnerWallet } = await supabase
        .from('wallet_balances')
        .select('pending_balance')
        .eq('user_id', store?.user_id)
        .single();

      await supabase
        .from('wallet_balances')
        .upsert({
          user_id: store?.user_id,
          pending_balance: (partnerWallet?.pending_balance || 0) + partnerShare,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      // Update store total earnings
      await supabase
        .from('partner_profiles')
        .update({
          total_earnings: (store?.total_earnings || 0) + product.custom_price,
          updated_at: new Date().toISOString()
        })
        .eq('id', store?.id);

      alert(`Order placed successfully! Order #: ${orderNumber}`);
      navigate(`/order-success/${order.id}`);

    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Store not found</h2>
            <button
              onClick={() => navigate('/manufacturers')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Stores
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Store Header */}
      <div className="relative">
        {store.banner_url ? (
          <img
            src={store.banner_url}
            alt={store.store_name}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-32"></div>
        
        <div className="container mx-auto px-4 relative -mt-16">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center">
              <div className="flex items-center mb-4 md:mb-0 md:mr-6">
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.store_name}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-blue-100 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-3xl">
                      {store.store_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-grow">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {store.store_name}
                    </h1>
                    <div className="flex items-center mt-2 space-x-4">
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {store.city}, {store.country}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Member since {new Date(store.created_at).getFullYear()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(`https://wa.me/${store.contact_phone}`, '_blank')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                        </svg>
                        Chat with Store
                      </button>
                      <button
                        onClick={() => window.location.href = `mailto:${store.contact_email}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Email Store
                      </button>
                    </div>
                  </div>
                </div>
                
                <p className="mt-4 text-gray-600">{store.description}</p>
              </div>
            </div>
            
            {/* Store Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
                <div className="text-sm text-gray-500">Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${stats.totalSales.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Sales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.avgRating} ★</div>
                <div className="text-sm text-gray-500">Avg Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.responseTime}</div>
                <div className="text-sm text-gray-500">Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Products */}
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <StoreProducts
            store={store}
            products={products}
            onAddToCart={handleAddToCart}
            onDirectOrder={handleDirectOrder}
          />
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
