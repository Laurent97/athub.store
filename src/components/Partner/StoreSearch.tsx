import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

interface PartnerStore {
  id: string;
  store_name: string;
  store_slug: string;
  description: string;
  logo_url: string;
  country: string;
  city: string;
  total_earnings: number;
  store_visits: number;
}

export default function StoreSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stores, setStores] = useState<PartnerStore[]>([]);
  const [filteredStores, setFilteredStores] = useState<PartnerStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentStores, setRecentStores] = useState<PartnerStore[]>([]);
  const [topStores, setTopStores] = useState<PartnerStore[]>([]);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStores([]);
    } else {
      const filtered = stores.filter(store =>
        store.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStores(filtered);
    }
  }, [searchTerm, stores]);

  const loadStores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('is_active', true)
        .eq('partner_status', 'approved')
        .order('store_visits', { ascending: false });

      if (error) throw error;
      
      setStores(data || []);
      
      // Get recent stores (last 5)
      setRecentStores(data?.slice(0, 5) || []);
      
      // Get top earning stores
      const sortedByEarnings = [...(data || [])]
        .sort((a, b) => (b.total_earnings || 0) - (a.total_earnings || 0))
        .slice(0, 5);
      setTopStores(sortedByEarnings);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Find Partner Stores
        </h2>
        <p className="text-gray-600">
          Discover and shop from our trusted partner stores
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for store names, locations, or products..."
            className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Search Results Dropdown */}
        {searchTerm && filteredStores.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {filteredStores.map((store) => (
              <Link
                key={store.id}
                to={`/store/${store.store_slug}`}
                className="block p-4 hover:bg-gray-50 border-b last:border-b-0"
              >
                <div className="flex items-center">
                  {store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.store_name}
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">
                        {store.store_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-grow">
                    <div className="font-medium text-gray-900">
                      {store.store_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {store.city}, {store.country}
                    </div>
                  </div>
                  <div className="text-blue-600">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-700">Total Stores</div>
          <div className="text-2xl font-bold text-blue-900">{stores.length}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-700">Total Visits</div>
          <div className="text-2xl font-bold text-green-900">
            {stores.reduce((sum, store) => sum + (store.store_visits || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-700">Total Sales</div>
          <div className="text-2xl font-bold text-purple-900">
            ${stores.reduce((sum, store) => sum + (store.total_earnings || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Recent Stores */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Stores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {recentStores.map((store) => (
            <Link
              key={store.id}
              to={`/store/${store.store_slug}`}
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition"
            >
              <div className="text-center">
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.store_name}
                    className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold text-xl">
                      {store.store_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="font-medium text-gray-900 truncate">
                  {store.store_name}
                </div>
                <div className="text-sm text-gray-500">
                  {store.city}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Top Stores by Earnings */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Top Earning Stores</h3>
        <div className="space-y-3">
          {topStores.map((store, index) => (
            <Link
              key={store.id}
              to={`/store/${store.store_slug}`}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow transition"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-yellow-800 font-bold">#{index + 1}</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {store.store_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {store.city}, {store.country}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">
                  ${(store.total_earnings || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {store.store_visits || 0} visits
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* All Stores Link */}
      <div className="mt-8 text-center">
        <Link
          to="/manufacturers"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          View All Partner Stores
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
