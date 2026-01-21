import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/Admin/AdminSidebar';

interface Partner {
  id: string;
  store_name: string;
  store_slug: string;
  contact_email: string;
  partner_status: string;
  is_active: boolean;
  total_earnings: number;
  store_visits: number;
  rating: number;
}

export default function AdminPartnersTest() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.user_type !== 'admin') {
      navigate('/');
      return;
    }
    loadPartners();
  }, [userProfile, navigate]);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            <AdminSidebar />
            <div className="flex-grow">
              <h1 className="text-2xl font-bold mb-6">Admin Partners Test</h1>
              
              {loading ? (
                <div>Loading...</div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Partners ({partners.length})</h2>
                  <div className="space-y-4">
                    {partners.map((partner) => (
                      <div key={partner.id} className="border rounded p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">{partner.store_name}</h3>
                            <p className="text-sm text-gray-600">{partner.contact_email}</p>
                            <p className="text-sm">Status: {partner.partner_status}</p>
                            <p className="text-sm">Active: {partner.is_active ? 'Yes' : 'No'}</p>
                            <p className="text-sm">Visits: {partner.store_visits || 0}</p>
                            <p className="text-sm">Rating: {partner.rating || 0}</p>
                            <p className="text-sm">Earnings: ${partner.total_earnings || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
