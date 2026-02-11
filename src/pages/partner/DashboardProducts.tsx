import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Plus, Edit, Trash2, Package, DollarSign, TrendingUp } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  title: string;
  description?: string;
  category: string;
  make: string;
  model: string;
  year?: number;
  mileage?: number;
  condition?: string;
  original_price: number;
  stock_quantity: number;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PartnerProduct {
  id: string;
  product_id: string;
  partner_id: string;
  profit_margin: number;
  selling_price: number;
  is_active: boolean;
  created_at: string;
  product?: Product;
}

export default function DashboardProducts() {
  const { userProfile } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [partnerProducts, setPartnerProducts] = useState<PartnerProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [profitMargin, setProfitMargin] = useState(0);
  const [basePrice, setBasePrice] = useState(0); // Manual price input
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadAllProducts();
    loadPartnerProducts();
  }, [userProfile]);

  const loadAllProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllProducts(data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadPartnerProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      // Get the partner_profile ID from partner_profiles table
      const { data: partnerProfile, error: profileError } = await supabase
        .from('partner_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (profileError || !partnerProfile?.id) {
        console.warn('Partner profile not found');
        setPartnerProducts([]);
        return;
      }
      
      const partnerId = partnerProfile.id;

      const { data, error } = await supabase
        .from('partner_products')
        .select(`
          *,
          product:products(*)
        `)
        .eq('partner_id', partnerId);
      if (error) throw error;
      setPartnerProducts(data || []);
    } catch (err) {
      console.error('Failed to load partner products:', err);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProduct || !userProfile?.id || basePrice <= 0) {
      console.warn('Validation failed:', { selectedProduct: !!selectedProduct, userId: !!userProfile?.id, basePrice });
      return;
    }

    try {
      const sellingPrice = basePrice * (1 + profitMargin / 100);
      
      // Get the user ID from auth
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      if (!userId) {
        throw new Error('User authentication failed. Please log in again.');
      }
      
      // Get the partner_profile ID from partner_profiles table (foreign key references partner_profiles.id, not users.id)
      const { data: partnerProfile, error: profileError } = await supabase
        .from('partner_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (profileError || !partnerProfile?.id) {
        throw new Error('Partner profile not found. Please complete your partner registration to add products.');
      }
      
      const partnerId = partnerProfile.id;
      
      const payload = {
        product_id: selectedProduct.id,
        partner_id: partnerId,
        profit_margin: profitMargin,
        selling_price: sellingPrice,
        is_active: true
      };

      console.log('User ID:', userId);
      console.log('Partner Profile ID:', partnerId);
      console.log('Adding product with payload:', payload);

      const { data, error } = await supabase
        .from('partner_products')
        .insert([payload]);

      console.log('Insert response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        throw new Error(error.message || 'Failed to add product to database');
      }

      setShowAddModal(false);
      setSelectedProduct(null);
      setProfitMargin(0);
      setBasePrice(0);
      await loadPartnerProducts();
      alert('✅ Product added successfully! View it in "My Inventory" page.');
    } catch (err) {
      console.error('Failed to add product:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add product. Please try again.';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleUpdateProduct = async (partnerProductId: string, newMargin: number) => {
    if (!selectedProduct || !userProfile?.id) return;

    try {
      const partnerProduct = getPartnerProduct(selectedProduct.id);
      if (!partnerProduct) return;
      
      const sellingPrice = partnerProduct.selling_price / (1 + (partnerProduct.profit_margin / 100)) * (1 + newMargin / 100);
      
      const { error } = await supabase
        .from('partner_products')
        .update({
          profit_margin: newMargin,
          selling_price: sellingPrice
        })
        .eq('id', partnerProductId);

      if (error) throw error;

      loadPartnerProducts();
      alert('Product updated successfully!');
    } catch (err) {
      console.error('Failed to update product:', err);
      alert('Failed to update product. Please try again.');
    }
  };

  const handleRemoveProduct = async (partnerProductId: string) => {
    if (!confirm('Are you sure you want to remove this product from your store?')) return;

    try {
      const { error } = await supabase
        .from('partner_products')
        .delete()
        .eq('id', partnerProductId);

      if (error) throw error;

      loadPartnerProducts();
      alert('Product removed from your store!');
    } catch (err) {
      console.error('Failed to remove product:', err);
      alert('Failed to remove product. Please try again.');
    }
  };

  const isProductAdded = (productId: string) => {
    return partnerProducts.some(pp => pp.product_id === productId);
  };

  const getPartnerProduct = (productId: string) => {
    return partnerProducts.find(pp => pp.product_id === productId);
  };

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = (product.make?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (product.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(allProducts.map(p => p.category)))];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && allProducts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Add system products to your store with your profit margin</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Products</label>
            <input
              type="text"
              placeholder="Search by make, model, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              title="Filter by category"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadAllProducts}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const partnerProduct = getPartnerProduct(product.id);
          const isAdded = isProductAdded(product.id);

          return (
            <div key={product.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 ${isAdded ? 'ring-2 ring-green-500' : ''}`}>
              {/* Product Image */}
              <div className="h-48 bg-gray-200 dark:bg-gray-600 relative">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={`${product.make} ${product.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                {isAdded && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    Added
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{product.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{product.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Stock</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{product.stock_quantity}</p>
                  </div>
                </div>

                {/* Original Price Display */}
                <div className="flex items-center justify-between mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Base Price</p>
                    <p className="font-bold text-blue-900 dark:text-blue-300 text-lg">{formatCurrency(product.original_price)}</p>
                  </div>
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>

                {isAdded && partnerProduct && (
                  <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800 dark:text-green-300">Your Selling Price</span>
                      <span className="font-bold text-green-900 dark:text-green-200">{formatCurrency(partnerProduct.selling_price)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700 dark:text-green-400">Profit Margin</span>
                      <span className="font-semibold text-green-900 dark:text-green-200">{partnerProduct.profit_margin}%</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {!isAdded ? (
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowAddModal(true);
                        setProfitMargin(20); // Default 20% profit
                        setBasePrice(product.original_price); // Use product's original price as base
                      }}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Product
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setProfitMargin(partnerProduct?.profit_margin || 0);
                        }}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveProduct(partnerProduct!.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Products */}
      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No products found</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Product to Your Store</h2>
            
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{selectedProduct.make} {selectedProduct.model}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedProduct.description}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Base Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter base price"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profit Margin (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={profitMargin}
                onChange={(e) => setProfitMargin(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700 dark:text-blue-400">Your Selling Price:</span>
                  <span className="font-bold text-blue-900 dark:text-blue-300">
                    {formatCurrency(basePrice * (1 + profitMargin / 100))}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-blue-700 dark:text-blue-400">Your Profit:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {formatCurrency((basePrice * (1 + profitMargin / 100)) - basePrice)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedProduct(null);
                  setProfitMargin(0);
                  setBasePrice(0);
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg"
                disabled={basePrice <= 0}
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {selectedProduct && !showAddModal && profitMargin >= 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Product Profit Margin</h2>
            
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{selectedProduct.make} {selectedProduct.model}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedProduct.description}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profit Margin (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={profitMargin}
                onChange={(e) => setProfitMargin(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700 dark:text-blue-400">Current Selling Price:</span>
                  <span className="font-bold text-blue-900 dark:text-blue-300">
                    {formatCurrency(getPartnerProduct(selectedProduct.id)?.selling_price || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-blue-700 dark:text-blue-400">New Selling Price:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(getPartnerProduct(selectedProduct.id)?.selling_price || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setProfitMargin(0);
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const partnerProduct = getPartnerProduct(selectedProduct.id);
                  if (partnerProduct) {
                    handleUpdateProduct(partnerProduct.id, profitMargin);
                    setSelectedProduct(null);
                    setProfitMargin(0);
                  }
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg"
              >
                Update Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
