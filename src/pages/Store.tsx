import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/CustomerService/WhatsAppButton';
import { Package, Star, MessageCircle, TrendingUp, DollarSign } from 'lucide-react';

interface PartnerStore {
  id: string;
  user_id: string;
  store_name: string;
  store_slug: string;
  description?: string;
  partner_status: string;
  is_active: boolean;
  created_at: string;
}

interface StoreProduct {
  id: string;
  product_id: string;
  partner_id: string;
  profit_margin: number;
  selling_price: number;
  is_active: boolean;
  created_at: string;
  product?: {
    id: string;
    make: string;
    model: string;
    description?: string;
    category: string;
    images: string[];
    created_at: string;
    title?: string;
    is_active?: boolean;
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
  const [error, setError] = useState<string | null>(null);

  const loadStore = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load store info
      const { data: storeData, error: storeError } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('store_slug', storeSlug)
        .eq('is_active', true)
        .eq('partner_status', 'approved')
        .single();

      if (storeError) {
        console.error('Store error:', storeError);
        setError('Store not found or temporarily unavailable');
        return;
      }

      setStore(storeData);

      // Load store products
      const { data: productsData, error: productsError } = await supabase
        .from('partner_products')
        .select(`
          *,
          product:products(id, make, model, description, category, created_at, images)
        `)
        .eq('partner_id', storeData.user_id)
        .eq('is_active', true);

      if (productsError) {
        console.error('Products error:', productsError);
        // Don't fail completely if products don't load
        setProducts([]);
      } else {
        setProducts(productsData || []);
        console.log('Loaded products:', productsData?.length, 'products');
      }

    } catch (error) {
      console.error('Error loading store:', error);
      setError('Failed to load store');
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    if (storeSlug) {
      loadStore();
    }
  }, [storeSlug, loadStore]);

  const handleAddToCart = (storeProduct: StoreProduct) => {
    if (!storeProduct.product) return;
    
    addItem({
      id: storeProduct.product.id,
      name: storeProduct.product?.title || `${storeProduct.product.make} ${storeProduct.product.model}`,
      price: storeProduct.selling_price,
      quantity: 1,
      image: storeProduct.product?.images?.[0] || '',
      partner_id: storeProduct.partner_id,
      product_id: storeProduct.product_id,
      title: storeProduct.product?.title || `${storeProduct.product.make} ${storeProduct.product.model}`
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
            <p className="text-gray-600 mb-6">The store you're looking for doesn't exist or isn't available.</p>
            <button
              onClick={() => navigate('/stores')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Browse All Stores
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Store Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{store.store_name}</h1>
              <p className="text-gray-600 mt-2">{store.description || 'Quality automotive parts and accessories'}</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm font-medium">4.8</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Fast response
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {products.length} products
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Store Status</div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-600 mt-1">Browse our selection of quality automotive parts</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Available</h3>
            <p className="text-gray-600">This store hasn't added any products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((storeProduct) => {
              const product = storeProduct.product;
              console.log('Product data:', product);
              if (!product) return null;

              return (
                <div key={storeProduct.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Product Image */}
                  <div className="h-48 bg-gray-100 relative overflow-hidden">
                    {product?.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={`${product.make} ${product.model}`}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <Package className="w-16 h-16 text-gray-400" />
                        <p className="text-gray-500 text-sm mt-2">No Image</p>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      {storeProduct.is_active ? 'Available' : 'Out of Stock'}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {product.make} {product.model}
                      </h3>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(storeProduct.selling_price)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description || 'Quality automotive part'}
                    </p>
                    <button
                      onClick={() => handleAddToCart(storeProduct)}
                      className="w-full py-2 px-4 rounded-lg font-bold transition-colors bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                      style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <WhatsAppButton />
      <Footer />
    </div>
  );
}
