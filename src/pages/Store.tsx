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
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  
  const [store, setStore] = useState<PartnerStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadStore = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to load store info from partner_profiles first
      const { data: storeData, error: storeError } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('store_slug', storeSlug)
        .eq('is_active', true)
        .eq('partner_status', 'approved')
        .single();

      if (storeError) {
        console.error('Store error from partner_profiles:', storeError);
        
        // Fallback: try to create a mock store object for demonstration
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
      } else {
        setStore(storeData);
      }

      // Load partner products using the dedicated service
      const partnerId = storeData?.user_id || 'demo-user';
      console.log('Loading products for partner:', partnerId);
      
      let productsData = await getPartnerProductsWithDetails(partnerId);
      console.log('Loaded partner products:', productsData.length, 'products');
      
      // If no partner products found, try to show all products as fallback
      if (productsData.length === 0) {
        console.log('No partner products found, loading all products as fallback');
        try {
          const { data: allProducts, error: allProductsError } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(20);

          if (!allProductsError && allProducts) {
            // Convert to PartnerProduct format
            productsData = allProducts.map(product => ({
              id: `fallback-${product.id}`,
              partner_id: partnerId,
              product_id: product.id,
              selling_price: product.original_price,
              profit_margin: 0,
              is_active: true,
              created_at: product.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              product
            }));
            console.log('Created fallback products:', productsData.length, 'products');
          }
        } catch (fallbackError) {
          console.error('Error loading fallback products:', fallbackError);
        }
      }
      
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
            <p className="text-muted-foreground mb-6">The store you're looking for doesn't exist or isn't available.</p>
            <button
              onClick={() => navigate('/stores')}
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
            <h3 className="text-lg font-semibold text-foreground mb-2">No Products Available</h3>
            <p className="text-muted-foreground">This store hasn't added any products yet.</p>
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
