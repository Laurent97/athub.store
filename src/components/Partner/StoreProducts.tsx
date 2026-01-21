import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface StoreProduct {
  id: string;
  product_id: string;
  partner_id: string;
  selling_price: number;
  is_available: boolean;
  created_at: string;
  products: {
    id: string;
    title: string;
    description: string;
    images: string[];
    category: string;
    make: string;
    model: string;
    year: number;
    mileage: number;
    condition: string;
    specifications: any;
    created_at: string;
  };
}

interface StoreProductsProps {
  store: any;
  products: StoreProduct[];
  onAddToCart: (product: StoreProduct) => void;
  onDirectOrder: (product: StoreProduct) => void;
}

export default function StoreProducts({
  store,
  products,
  onAddToCart,
  onDirectOrder
}: StoreProductsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const filteredProducts = products.filter(product => {
    if (filter !== 'all' && product.products.category !== filter) {
      return false;
    }
    
    if (searchTerm && !product.products.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.custom_price - b.custom_price;
      case 'price-high':
        return b.custom_price - a.custom_price;
      case 'newest':
        return new Date(b.products?.created_at || 0).getTime() - new Date(a.products?.created_at || 0).getTime();
      default:
        return 0;
    }
  });

  const categories = [...new Set(products.map(p => p.products.category))];

  const handleQuickOrder = (product: StoreProduct) => {
    if (!user) {
      navigate('/login', { state: { from: `/store/${store.store_slug}` } });
      return;
    }
    setSelectedProduct(product);
    setShowQuickOrder(true);
    setQuantity(1);
  };

  const confirmQuickOrder = () => {
    if (selectedProduct) {
      onDirectOrder(selectedProduct);
      setShowQuickOrder(false);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
          
          <div className="w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in this store..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Products Count */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Products ({filteredProducts.length})
        </h2>
        <p className="text-gray-600">
          Available products from {store.store_name}
        </p>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No products found in this store</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
              {/* Product Image */}
              <div className="relative">
                <img
                  src={product.products.images?.[0] || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&auto=format&fit=crop'}
                  alt={product.products.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute top-2 right-2">
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                    {product.products.category}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 truncate">
                  {product.products.title}
                </h3>
                
                <div className="mt-2 space-y-1">
                  {product.products.make && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Make:</span>
                      {product.products.make}
                    </div>
                  )}
                  {product.products.model && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Model:</span>
                      {product.products.model}
                    </div>
                  )}
                  {product.products.year && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Year:</span>
                      {product.products.year}
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      ${product.custom_price.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      Sold by {store.store_name}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onAddToCart(product)}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => handleQuickOrder(product)}
                    className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Order Modal */}
      {showQuickOrder && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Quick Order from {store.store_name}
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedProduct.products.images?.[0] || ''}
                    alt={selectedProduct.products.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {selectedProduct.products.title}
                    </h3>
                    <div className="text-2xl font-bold text-green-600">
                      ${selectedProduct.custom_price.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <div className="flex items-center">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 border border-gray-300 rounded-l-lg flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-grow h-10 border-y border-gray-300 text-center"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 border border-gray-300 rounded-r-lg flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${(selectedProduct.custom_price * quantity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="border-t mt-2 pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${(selectedProduct.custom_price * quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowQuickOrder(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmQuickOrder}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Pay from Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
