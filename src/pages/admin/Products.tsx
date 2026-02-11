import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import AdminLayout from '../../components/Admin/AdminLayout';
import { getProducts, createProduct, updateProduct, deleteProduct, Product } from '../../services/fixedProductService';

export default function AdminProducts() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Refs for scrollbar synchronization
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);

  // Synchronize scrollbar with table scroll
  const handleTableScroll = () => {
    if (tableContainerRef.current && scrollbarRef.current) {
      const tableContainer = tableContainerRef.current;
      const scrollbar = scrollbarRef.current;
      
      const scrollRatio = tableContainer.scrollLeft / (tableContainer.scrollWidth - tableContainer.clientWidth);
      scrollbar.scrollLeft = scrollRatio * (scrollbar.scrollWidth - scrollbar.clientWidth);
    }
  };

  // Synchronize table with scrollbar scroll
  const handleScrollbarScroll = () => {
    if (scrollbarRef.current && tableContainerRef.current) {
      const scrollbar = scrollbarRef.current;
      const tableContainer = tableContainerRef.current;
      
      const scrollRatio = scrollbar.scrollLeft / (scrollbar.scrollWidth - scrollbar.clientWidth);
      tableContainer.scrollLeft = scrollRatio * (tableContainer.scrollWidth - tableContainer.clientWidth);
    }
  };
  
  const [newProduct, setNewProduct] = useState({
    sku: '',
    title: '',
    description: '',
    category: 'part',
    make: '',
    model: '',
    year: 2024,
    mileage: 0,
    condition: 'new',
    original_price: 0,
    stock_quantity: 0,
  });

  useEffect(() => {
    if (userProfile?.user_type !== 'admin') {
      navigate('/');
      return;
    }

    loadProducts();
  }, [userProfile, navigate]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts({
        isActive: true,
        limit: 50,
        offset: 0
      });
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      const result = await createProduct(newProduct);
      
      if (result.success) {
        setShowAddModal(false);
        setNewProduct({
          sku: '',
          title: '',
          description: '',
          category: 'part',
          make: '',
          model: '',
          year: 2024,
          mileage: 0,
          condition: 'new',
          original_price: 0,
          stock_quantity: 0,
        });
        
        loadProducts();
        alert('Product added successfully!');
      } else {
        alert(result.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product');
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({
          sku: newProduct.sku,
          title: newProduct.title,
          description: newProduct.description,
          category: newProduct.category,
          make: newProduct.make,
          model: newProduct.model,
          original_price: newProduct.original_price,
          stock_quantity: newProduct.stock_quantity,
        })
        .eq('id', selectedProduct.id);
      
      if (error) throw error;
      
      setShowEditModal(false);
      loadProducts();
      alert('Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    }
  };

  const toggleProductStatus = async (productId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !isActive })
        .eq('id', productId);

      if (error) throw error;
      loadProducts();
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const toggleStockStatus = async (productId: string, currentStock: number) => {
    try {
      const newStock = currentStock === 0 ? 10 : 0;
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', productId);

      if (error) throw error;
      loadProducts();
      alert(`Product stock updated to ${newStock} units`);
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      loadProducts();
      alert('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
              {/* Welcome Header */}
              <div className="mb-10 animate-fade-in">
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-8 text-white shadow-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-4xl font-bold mb-2">Product Management</h1>
                      <p className="text-amber-100/90 text-lg">Manage products in your catalog</p>
                      <p className="text-amber-100/70 mt-1 text-sm">Add, edit, and organize your automotive parts inventory</p>
                    </div>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      ➕ Add Product
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-card rounded-2xl shadow-md border border-border p-6 mb-6 animate-fade-in hover:shadow-lg transition-shadow">
                <div className="flex space-x-4">
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="🔍 Search products by SKU, title, make, or model..."
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-all"
                    />
                  </div>
                  <button
                    onClick={loadProducts}
                    className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-2 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-card rounded-2xl shadow-md border border-border overflow-hidden animate-fade-in hover:shadow-lg transition-shadow">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading products...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-8 text-center">
                    <span className="text-4xl mb-4 block">📦</span>
                    <p className="text-muted-foreground">No products found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto" ref={tableContainerRef} onScroll={handleTableScroll}>
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-gradient-to-r from-card to-card/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            🏷️ SKU
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            📦 Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            📂 Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            💰 Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            📊 Stock
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            ✅ Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            ⚡ Actions
                          </th>
                        </tr>
                      </thead>
                      <tr>
                        <td colSpan={7} className="p-0">
                          <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-2 m-2">
                            <div className="text-xs text-amber-700 font-medium mb-2 text-center">
                              ↔️ Scroll horizontally to view all table columns →
                            </div>
                            <div 
                              ref={scrollbarRef}
                              className="w-full h-2 bg-amber-200 rounded-full cursor-pointer overflow-hidden"
                              onScroll={handleScrollbarScroll}
                              style={{ overflowX: 'auto' }}
                            >
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: '150%' }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tbody className="bg-card divide-y divide-border">
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-primary/5 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <code className="text-sm text-foreground bg-muted px-2 py-1 rounded font-mono">
                                🏷️ {product.sku}
                              </code>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-foreground">
                                📦 {product.title}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                🚗 {product.make} {product.model}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                                📂 {product.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-amber-700">
                                💰 ${product.original_price.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-bold flex items-center gap-1 ${
                                product.stock_quantity > 10 ? 'text-green-600' : 
                                product.stock_quantity > 0 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {product.stock_quantity > 10 && '✅'}
                                {product.stock_quantity > 0 && product.stock_quantity <= 10 && '⚠️'}
                                {product.stock_quantity === 0 && '❌'}
                                {product.stock_quantity} units
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => toggleProductStatus(product.id, product.is_active)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                  product.is_active
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {product.is_active ? '✅ Active' : '❌ Inactive'}
                              </button>
                              <button
                                onClick={() => toggleStockStatus(product.id, product.stock_quantity)}
                                className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                  product.stock_quantity > 0
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {product.stock_quantity > 0 ? '📦 In Stock' : '❌ Out of Stock'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setNewProduct({
                                      sku: product.sku,
                                      title: product.title,
                                      description: product.description || '',
                                      category: product.category,
                                      make: product.make || '',
                                      model: product.model || '',
                                      year: product.year || 2024,
                                      mileage: product.mileage || 0,
                                      condition: product.condition || 'new',
                                      original_price: product.original_price,
                                      stock_quantity: product.stock_quantity,
                                    });
                                    setShowEditModal(true);
                                  }}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded text-xs font-semibold transition-all"
                                  title="Edit product details"
                                >
                                  📝 Edit
                                </button>
                                <button
                                  onClick={() => toggleStockStatus(product.id, product.stock_quantity)}
                                  className="px-2 py-1 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded text-xs font-semibold transition-all"
                                  title="Toggle stock status (sets to 10 or 0)"
                                >
                                  📦 Stock
                                </button>
                                <button
                                  onClick={() => toggleProductStatus(product.id, product.is_active)}
                                  className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                                    product.is_active
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                                  }`}
                                  title="Toggle active/inactive status"
                                >
                                  {product.is_active ? '✅ Active' : '❌ Inactive'}
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete "${product.title}"? This action cannot be undone.`)) {
                                      deleteProduct(product.id);
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded text-xs font-semibold transition-all"
                                  title="Delete product permanently"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newProduct.title}
                      onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="car">Car</option>
                      <option value="engine">Engine</option>
                      <option value="transmission">Transmission</option>
                      <option value="suspension">Suspension</option>
                      <option value="brakes">Brakes</option>
                      <option value="electrical">Electrical</option>
                      <option value="interior">Interior</option>
                      <option value="exterior">Exterior</option>
                      <option value="performance">Performance</option>
                      <option value="tools">Tools</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="part">Part</option>
                      <option value="accessory">Accessory</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price *
                    </label>
                    <input
                      type="number"
                      value={newProduct.original_price}
                      onChange={(e) => setNewProduct({...newProduct, original_price: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      value={newProduct.stock_quantity}
                      onChange={(e) => setNewProduct({...newProduct, stock_quantity: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Make
                    </label>
                    <input
                      type="text"
                      value={newProduct.make}
                      onChange={(e) => setNewProduct({...newProduct, make: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={newProduct.model}
                      onChange={(e) => setNewProduct({...newProduct, model: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddProduct}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newProduct.title}
                      onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="car">Car</option>
                      <option value="engine">Engine</option>
                      <option value="transmission">Transmission</option>
                      <option value="suspension">Suspension</option>
                      <option value="brakes">Brakes</option>
                      <option value="electrical">Electrical</option>
                      <option value="interior">Interior</option>
                      <option value="exterior">Exterior</option>
                      <option value="performance">Performance</option>
                      <option value="tools">Tools</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="part">Part</option>
                      <option value="accessory">Accessory</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price *
                    </label>
                    <input
                      type="number"
                      value={newProduct.original_price}
                      onChange={(e) => setNewProduct({...newProduct, original_price: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      value={newProduct.stock_quantity}
                      onChange={(e) => setNewProduct({...newProduct, stock_quantity: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Make
                    </label>
                    <input
                      type="text"
                      value={newProduct.make}
                      onChange={(e) => setNewProduct({...newProduct, make: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={newProduct.model}
                      onChange={(e) => setNewProduct({...newProduct, model: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProduct}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
