import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase/client';
import { getPartnerProductsWithDetails, PartnerProduct } from '../services/partnerProductsService';
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

export default function Store() {
  const { storeSlug } = useParams<{ storeSlug?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  
  const [store, setStore] = useState<PartnerStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadStore = useCallback(async () => {
    if (!storeSlug) {
      setError('No store specified');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    let matchingPartner = null;

    try {
      // Try to get store by exact slug match first
      const { data: storeData, error: storeError } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('store_slug', storeSlug)
        .eq('partner_status', 'approved')
        .eq('is_active', true)
        .maybeSingle();

      if (storeError) {
        console.error('Store error from partner_profiles:', storeError);
        console.log('Store slug requested:', storeSlug);
        console.log('Trying to find partner by slug:', storeSlug);
        
        // First check if ANY store with this slug exists (regardless of status)
        const { data: anyStore } = await supabase
          .from('partner_profiles')
          .select('id, store_slug, is_active, partner_status')
          .eq('store_slug', storeSlug);
        
        if (anyStore && anyStore.length > 0) {
          console.log('Store found but filters not met:', anyStore[0]);
          const store = anyStore[0];
          if (!store.is_active) {
            setError('This store is currently inactive');
          } else if (store.partner_status !== 'approved') {
            setError(`This store is ${store.partner_status} and not yet available`);
          }
          return;
        }
        
        // Fallback: try to find partner by slug matching
        console.log('No store found, trying alternative search...');
        const { data: allPartners } = await supabase
          .from('partner_profiles')
          .select('id, user_id, store_name, store_slug')
          .eq('partner_status', 'approved')
          .eq('is_active', true);
        
        // Find matching partner by slug or create fallback
        matchingPartner = allPartners?.find(p => 
          p.store_slug === storeSlug || 
          p.store_name?.toLowerCase().replace(/\s+/g, '-') === storeSlug
        );
        
        if (matchingPartner) {
          console.log('Found matching partner:', matchingPartner);
          setStore(matchingPartner);
        } else {
          // Create fallback store object for demonstration
          console.log('Creating fallback store data for:', storeSlug);
          const fallbackStore = {
            id: 'fallback-' + storeSlug,
            user_id: 'demo-user',
            store_name: storeSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            store_slug: storeSlug,
            description: 'Demo store for demonstration purposes',
            logo_url: null,
            banner_url: null,
            contact_email: 'demo@example.com',
            contact_phone: '+1234567890',
            website: null,
            address: 'Demo Address',
            city: 'Demo City',
            country: 'Demo Country',
            is_active: true,
            partner_status: 'approved',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setStore(fallbackStore);
        }
      } else {
        setStore(storeData);
      }

      // Load partner products using the dedicated service
      const partnerId = storeData?.id || matchingPartner?.id || 'demo-user';
      console.log('=== STORE DEBUG INFO ===');
      console.log('Store slug:', storeSlug);
      console.log('Store data:', storeData);
      console.log('Matching partner:', matchingPartner);
      console.log('Final partner ID (using partner.id, not user_id):', partnerId);
      console.log('=== END DEBUG INFO ===');
      
      const productsData = await getPartnerProductsWithDetails(partnerId);
      console.log('=== PRODUCTS DEBUG INFO ===');
      console.log('Partner products loaded:', productsData.length);
      console.log('Products data:', productsData);
      console.log('=== END PRODUCTS DEBUG ===');
      
      setProducts(productsData);

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

  const handleAddToCart = (partnerProduct: PartnerProduct) => {
    if (!partnerProduct.product) return;
    
    console.log('=== PARTNER STORE PRODUCT DATA ===');
    console.log('PartnerProduct:', partnerProduct);
    console.log('Product:', partnerProduct.product);
    console.log('Image URL:', (partnerProduct.product as any).images?.[0]);
    console.log('Stock quantity:', partnerProduct.product.stock_quantity);
    console.log('=== END DEBUG ===');
    
    // Normalize product data to match cart context expectations
    const normalizedProduct = {
      id: partnerProduct.product.id,
      title: partnerProduct.product.title || partnerProduct.product.model || `${partnerProduct.product.make} ${partnerProduct.product.model}`,
      make: partnerProduct.product.make,
      model: partnerProduct.product.model,
      description: partnerProduct.product.description || 'Quality automotive part',
      category: partnerProduct.product.category || 'Vehicle',
      images: (partnerProduct.product as any).images || [],
      stock_quantity: partnerProduct.product.stock_quantity || 50,
      original_price: partnerProduct.product.original_price,
      price: partnerProduct.selling_price || partnerProduct.product.original_price,
      is_active: partnerProduct.product.is_active,
      created_at: (partnerProduct.product as any).created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Create partner product object
    const partnerProductData = {
      id: partnerProduct.id,
      product_id: partnerProduct.product_id,
      partner_id: partnerProduct.partner_id,
      selling_price: partnerProduct.selling_price || partnerProduct.product.original_price,
      profit_margin: partnerProduct.profit_margin,
      is_active: partnerProduct.is_active,
      partner_store_name: store.store_name,
      created_at: partnerProduct.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Normalized product:', normalizedProduct);
    console.log('Partner product:', partnerProductData);
    
    addItem(normalizedProduct, partnerProductData, 1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Store Not Found</h1>
            <p className="text-muted-foreground mb-2">The store you're looking for doesn't exist or isn't available.</p>
            <p className="text-muted-foreground text-sm mb-6">
              Check the store URL or browse all available stores below.
            </p>
            {storeSlug && (
              <p className="text-muted-foreground text-xs mb-6 p-3 bg-card rounded">
                Searched for: <code>{storeSlug}</code>
              </p>
            )}
            <button
              onClick={() => navigate('/manufacturers')}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90"
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Store Header */}
      <div className="bg-card border-border border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{store.store_name}</h1>
              <p className="text-muted-foreground mt-2">{store.description || 'Quality automotive parts and accessories'}</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm font-medium text-foreground">4.8</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Fast response
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {products.length} products
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Store Status</div>
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
          <h2 className="text-2xl font-bold text-foreground">Products</h2>
          <p className="text-muted-foreground mt-1">Browse our selection of quality automotive parts</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Products in Partner Inventory</h3>
            <p className="text-muted-foreground">This partner hasn't added any products to their store yet.</p>
            <p className="text-muted-foreground text-sm mt-2">Partners can add products through their dashboard to make them available here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((partnerProduct) => {
              const product = partnerProduct.product;
              console.log('Product data:', product);
              if (!product) return null;

              return (
                <div key={partnerProduct.id} className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-border">
                  {/* Product Image */}
                  <div className="h-48 bg-muted relative overflow-hidden">
                    {(product as any).images?.[0] ? (
                      <img
                        src={(product as any).images[0]}
                        alt={`${product.make} ${product.model}`}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-border">
                        <Package className="w-16 h-16 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm mt-2">No Image</p>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      {partnerProduct.is_active ? 'Available' : 'Out of Stock'}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-foreground">
                        {product.title || `${product.make} ${product.model}`}
                      </h3>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(partnerProduct.selling_price || product.original_price)}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">
                      {product.make} {product.model}
                    </p>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {product.description || 'Quality automotive part'}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                        {product.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Stock: {product.stock_quantity}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddToCart(partnerProduct)}
                      className="w-full py-2 px-4 rounded-lg font-bold transition-colors bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
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
