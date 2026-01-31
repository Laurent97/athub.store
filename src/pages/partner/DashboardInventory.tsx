import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Edit, Trash2, Package, DollarSign, TrendingUp, Search } from 'lucide-react';

interface PartnerProduct {
  id: string;
  product_id: string;
  partner_id: string;
  profit_margin: number;
  selling_price: number;
  is_active: boolean;
  created_at: string;
  product?: {
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
  };
}

export default function DashboardInventory() {
  const { userProfile } = useAuth();
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<PartnerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedProduct, setSelectedProduct] = useState<PartnerProduct | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ profit_margin: 0, selling_price: 0 });
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    activeProducts: 0,
    totalProfit: 0
  });

  useEffect(() => {
    loadInventory();
    
    // Refresh inventory every 30 seconds to catch new additions
    const interval = setInterval(loadInventory, 30000);
    
    return () => clearInterval(interval);
  }, [userProfile]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, filterActive]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      // Use auth.uid() instead of userProfile.id to get the actual user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      const partnerId = user.id;
      
      console.log('Loading inventory for partner ID:', partnerId);

      const { data, error } = await supabase
        .from('partner_products')
        .select(`
          *,
          product:products(*)
        `)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      console.log('Inventory data loaded:', { count: data?.length, data });

      if (error) {
        console.error('Inventory load error:', error);
        throw error;
      }

      setProducts(data || []);

      // Calculate stats
      const totalProducts = data?.length || 0;
      const totalValue = data?.reduce((sum, p) => sum + p.selling_price, 0) || 0;
      const activeProducts = data?.filter(p => p.is_active).length || 0;
      const totalProfit = data?.reduce((sum, p) => sum + (p.selling_price * (p.profit_margin / 100)), 0) || 0;

      setStats({
        totalProducts,
        totalValue,
        activeProducts,
        totalProfit
      });
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    const filtered = products.filter(product => {
      const matchesSearch = 
        (product.product?.make?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (product.product?.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (product.product?.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterActive === 'all' || 
        (filterActive === 'active' ? product.is_active : !product.is_active);

      return matchesSearch && matchesFilter;
    });

    setFilteredProducts(filtered);
  };

  const handleEditProduct = (product: PartnerProduct) => {
    setSelectedProduct(product);
    setEditData({
      profit_margin: product.profit_margin,
      selling_price: product.selling_price
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from('partner_products')
        .update({
          profit_margin: editData.profit_margin,
          selling_price: editData.selling_price
        })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      setShowEditModal(false);
      setSelectedProduct(null);
      loadInventory();
      alert('Product updated successfully!');
    } catch (err) {
      console.error('Failed to update product:', err);
      alert('Failed to update product. Please try again.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to remove this product from your inventory?')) return;

    try {
      const { error } = await supabase
        .from('partner_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      loadInventory();
      alert('Product removed from inventory!');
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Failed to delete product. Please try again.');
    }
  };

  const toggleProductStatus = async (product: PartnerProduct) => {
    try {
      const { error } = await supabase
        .from('partner_products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;

      loadInventory();
    } catch (err) {
      console.error('Failed to toggle product status:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Inventory</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage products you've added to your store</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Products</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">{stats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4 border border-green-200 dark:border-green-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">Active</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">{stats.activeProducts}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-4 border border-purple-200 dark:border-purple-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Inventory Value</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-300 mt-1">{formatCurrency(stats.totalValue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg p-4 border border-orange-200 dark:border-orange-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Total Profit Margin</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-300 mt-1">{formatCurrency(stats.totalProfit)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Products</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by make, model, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                title="Filter by product status"
              >
                <option value="all">All Products</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadInventory}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No products in your inventory</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm">Add products from Products page to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Base Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Profit Margin</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Selling Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Added</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                          {product.product?.images && product.product.images.length > 0 ? (
                            <img src={product.product.images[0]} alt="product" className="w-full h-full object-cover rounded" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {product.product?.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {product.product?.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded capitalize">
                        {product.product?.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(product.product?.original_price || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-semibold text-green-600 dark:text-green-400">{product.profit_margin}%</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(product.selling_price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {product.product?.stock_quantity || 0}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleProductStatus(product)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          product.is_active
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/70'
                            : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/70'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Product Pricing</h2>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedProduct.product?.make} {selectedProduct.product?.model}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedProduct.product?.description}</p>
              </div>

              <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Base Price (System)</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(selectedProduct.selling_price / (1 + selectedProduct.profit_margin / 100))}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profit Margin (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editData.profit_margin}
                  onChange={(e) => {
                    const margin = parseFloat(e.target.value) || 0;
                    const basePrice = selectedProduct.selling_price / (1 + selectedProduct.profit_margin / 100);
                    setEditData({
                      profit_margin: margin,
                      selling_price: basePrice * (1 + margin / 100)
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selling Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editData.selling_price}
                  onChange={(e) => setEditData({ ...editData, selling_price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-700/50">
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-1">Your Profit Per Unit</p>
                <p className="text-lg font-bold text-amber-900 dark:text-amber-200">
                  {formatCurrency(editData.selling_price - (selectedProduct.selling_price / (1 + selectedProduct.profit_margin / 100)))}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
