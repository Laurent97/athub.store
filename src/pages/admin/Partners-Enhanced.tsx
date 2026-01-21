import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import { Search, Store, MapPin, DollarSign, CheckCircle, AlertCircle, XCircle, Filter, RefreshCw, Eye, Check, X, Clock, Power, PowerOff, Star, Edit, Save } from 'lucide-react';

interface Partner {
  id: string;
  user_id: string;
  store_name: string;
  store_slug: string;
  contact_email: string;
  contact_phone: string;
  country: string;
  city: string;
  partner_status: string;
  is_active: boolean;
  total_earnings: number;
  store_visits: number;
  rating: number;
  created_at: string;
  users: {
    email: string;
    full_name: string;
  };
}

export default function AdminPartnersEnhanced() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    store_visits: 0,
    rating: 0
  });

  useEffect(() => {
    // Redirect if not admin
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
        .select(`
          *,
          users (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPartners(data || []);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePartnerStatus = async (partnerId: string, status: string) => {
    try {
      // Update partner status
      const { error: partnerError } = await supabase
        .from('partner_profiles')
        .update({ partner_status: status })
        .eq('id', partnerId);

      if (partnerError) throw partnerError;

      // Update user status
      const partner = partners.find(p => p.id === partnerId);
      if (partner) {
        const { error: userError } = await supabase
          .from('users')
          .update({ 
            partner_status: status,
            updated_at: new Date().toISOString()
          })
          .eq('id', partner.user_id);

        if (userError) throw userError;
      }

      // Reload partners
      loadPartners();
      
      alert(`Partner status updated to ${status}`);
    } catch (error) {
      console.error('Error updating partner status:', error);
      alert('Failed to update partner status');
    }
  };

  const togglePartnerActiveStatus = async (partnerId: string, currentStatus: boolean) => {
    const newStatus = currentStatus ? 'approved' : 'suspended';
    await updatePartnerStatus(partnerId, newStatus);
  };

  const updateStoreVisits = async (partnerId: string, visits: number) => {
    try {
      const { error } = await supabase
        .from('partner_profiles')
        .update({ 
          store_visits: visits,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      if (error) throw error;
      
      loadPartners();
      alert(`Store visits updated to ${visits}`);
    } catch (error) {
      console.error('Error updating store visits:', error);
      alert('Failed to update store visits');
    }
  };

  const updatePartnerRating = async (partnerId: string, rating: number) => {
    try {
      const { error } = await supabase
        .from('partner_profiles')
        .update({ 
          rating: rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      if (error) throw error;
      
      loadPartners();
      alert(`Partner rating updated to ${rating}`);
    } catch (error) {
      console.error('Error updating partner rating:', error);
      alert('Failed to update partner rating');
    }
  };

  const openPartnerDetails = (partner: Partner) => {
    setSelectedPartner(partner);
    setShowModal(true);
  };

  const openEditModal = (partner: Partner) => {
    setSelectedPartner(partner);
    setEditForm({
      store_visits: partner.store_visits || 0,
      rating: partner.rating || 0
    });
    setShowEditModal(true);
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = 
      partner.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.users?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || partner.partner_status === filterStatus;
    
    const matchesActive = filterActive === 'all' || 
      (filterActive === 'active' && partner.is_active) || 
      (filterActive === 'inactive' && !partner.is_active);
    
    return matchesSearch && matchesStatus && matchesActive;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <AdminSidebar />
            
            {/* Main Content */}
            <div className="flex-grow">
              {/* Header */}
              <div className="mb-10 animate-fade-in">
                <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white shadow-lg">
                  <h1 className="text-4xl font-bold mb-2">Enhanced Partner Management</h1>
                  <p className="text-primary-foreground/90 text-lg">Complete partner management with activation, visits, and rating controls</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
                <div className="bg-card rounded-2xl shadow-md border border-border p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-muted-foreground text-sm font-medium">Total Partners</p>
                    <Store className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-4xl font-bold text-foreground">{partners.length}</p>
                  <p className="text-xs text-muted-foreground mt-2">All registered</p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl shadow-md border border-amber-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-amber-700 text-sm font-medium">Pending Review</p>
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-4xl font-bold text-amber-700">
                    {partners.filter(p => p.partner_status === 'pending').length}
                  </p>
                  <p className="text-xs text-amber-600 mt-2">Awaiting approval</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl shadow-md border border-green-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-green-700 text-sm font-medium">Approved</p>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-4xl font-bold text-green-700">
                    {partners.filter(p => p.partner_status === 'approved').length}
                  </p>
                  <p className="text-xs text-green-600 mt-2">Active partners</p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl shadow-md border border-primary/20 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-slate-600 text-sm font-medium">Total Earnings</p>
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-4xl font-bold text-primary">
                    ${partners.reduce((sum, p) => sum + (p.total_earnings || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Lifetime earnings</p>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-card rounded-2xl shadow-md border border-border p-6 mb-8 animate-fade-in hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Filter & Search</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by store or email..."
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-foreground"
                    />
                  </div>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-foreground"
                    title="Filter by partner status"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  
                  <select
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                    className="px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-foreground"
                    title="Filter by active status"
                  >
                    <option value="all">All Active Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                  
                  <button
                    onClick={loadPartners}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Partners Table */}
              <div className="bg-card rounded-2xl shadow-md border border-border overflow-hidden animate-fade-in hover:shadow-lg transition-shadow">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-border border-t-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground font-medium">Loading partners...</p>
                  </div>
                ) : filteredPartners.length === 0 ? (
                  <div className="p-12 text-center">
                    <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No partners found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-card to-card border-b border-border">
                          <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Store</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Visits</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Rating</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredPartners.map((partner, idx) => (
                          <tr 
                            key={partner.id} 
                            className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all"
                            style={{ animationDelay: `${idx * 30}ms` }}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                                  <Store className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{partner.store_name}</p>
                                  <p className="text-xs text-muted-foreground">{partner.users?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <p className="text-foreground font-medium">{partner.contact_email}</p>
                                <p className="text-xs text-muted-foreground">{partner.contact_phone}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-foreground">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{partner.city}, {partner.country}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                                partner.partner_status === 'approved' ? 'bg-green-100 text-green-700' :
                                partner.partner_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                partner.partner_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {partner.partner_status === 'approved' && <CheckCircle className="w-3 h-3" />}
                                {partner.partner_status === 'pending' && <Clock className="w-3 h-3" />}
                                {partner.partner_status === 'rejected' && <XCircle className="w-3 h-3" />}
                                {partner.partner_status.charAt(0).toUpperCase() + partner.partner_status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-primary">${(partner.total_earnings || 0).toLocaleString()}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => togglePartnerActiveStatus(partner.id, partner.is_active)}
                                  title={partner.is_active ? 'Deactivate Store' : 'Activate Store'}
                                  className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                                    partner.is_active 
                                      ? 'bg-red-100 hover:bg-red-200 text-red-600' 
                                      : 'bg-green-100 hover:bg-green-200 text-green-600'
                                  }`}
                                >
                                  {partner.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                  <span className="text-sm font-medium">
                                    {partner.is_active ? 'Deactivate' : 'Activate'}
                                  </span>
                                </button>
                                <button
                                  onClick={() => openPartnerDetails(partner)}
                                  title="View details"
                                  className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-600 hover:text-primary"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedPartner(partner);
                                    setEditForm({
                                      store_visits: partner.store_visits || 0,
                                      rating: partner.rating || 0
                                    });
                                    setShowEditModal(true);
                                  }}
                                  title="Edit store info"
                                  className="p-2 hover:bg-blue-100 rounded-lg transition-all text-blue-600"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
