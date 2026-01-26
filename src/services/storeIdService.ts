import { supabase } from '@/lib/supabase/client';

export class StoreIdService {
  // Generate a new store ID
  static async generateStoreId(): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('generate_store_id');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating store ID:', error);
      throw error;
    }
  }

  // Validate store ID format
  static async validateStoreId(storeId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('validate_store_id', { store_id: storeId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error validating store ID:', error);
      return false;
    }
  }

  // Get partner by store ID
  static async getPartnerByStoreId(storeId: string) {
    try {
      const { data, error } = await supabase
        .from('partner_profiles')
        .select(`
          *,
          users!partner_profiles_user_id_fkey (
            email,
            full_name,
            phone
          )
        `)
        .eq('store_id', storeId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching partner by store ID:', error);
      throw error;
    }
  }

  // Search partners by store ID or store name
  static async searchPartners(query: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('partner_profiles')
        .select(`
          store_id,
          store_name,
          store_slug,
          is_active,
          created_at,
          users!partner_profiles_user_id_fkey (
            email,
            full_name
          )
        `)
        .or(`store_id.ilike.%${query}%,store_name.ilike.%${query}%,store_slug.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching partners:', error);
      throw error;
    }
  }

  // Update partner store ID (admin only)
  static async updatePartnerStoreId(partnerId: string, storeId: string) {
    try {
      const { data, error } = await supabase
        .from('partner_profiles')
        .update({ store_id: storeId })
        .eq('id', partnerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating partner store ID:', error);
      throw error;
    }
  }

  // Get store statistics
  static async getStoreStats(storeId: string, period: 'week' | 'month' | 'year' = 'month') {
    try {
      // Get partner info
      const partner = await this.getPartnerByStoreId(storeId);
      
      // Calculate period start date
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default: // month
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get orders for this store in the period
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, status, created_at')
        .eq('partner_id', partner.user_id)
        .gte('created_at', startDate.toISOString());

      if (ordersError) throw ordersError;

      // Get products count for this store
      const { count: productCount, error: productError } = await supabase
        .from('partner_products')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partner.user_id);

      if (productError) throw productError;

      // Calculate period revenue
      const periodRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const periodOrders = orders?.length || 0;

      return {
        storeId,
        storeName: partner.store_name,
        period,
        stats: {
          totalRevenue: partner.total_earnings || 0,
          totalOrders: partner.store_visits || 0,
          totalProducts: productCount || 0,
          rating: partner.conversion_rate || 0,
          periodRevenue,
          periodOrders,
          pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
          conversionRate: productCount > 0 ? ((periodOrders / productCount) * 100).toFixed(2) : '0'
        }
      };
    } catch (error) {
      console.error('Error getting store stats:', error);
      throw error;
    }
  }

  // Format store ID for display
  static formatStoreId(storeId: string): string {
    if (!storeId) return 'N/A';
    
    // If already properly formatted, return as is
    if (storeId.includes('-')) {
      return storeId;
    }
    
    // Handle case where store ID has AUTO prefix with masked characters
    if (storeId.startsWith('AUTO') && storeId.includes('#')) {
      // Extract the actual numbers from the end
      const numbers = storeId.replace(/[^0-9]/g, '');
      if (numbers.length >= 4) {
        // Format as AUTO-XXXX-XXXX-XXXX using the available numbers
        const padded = numbers.padEnd(11, '0'); // Ensure we have 11 digits
        return `AUTO-${padded.slice(0, 4)}-${padded.slice(4, 8)}-${padded.slice(8, 11)}`;
      }
    }
    
    // Format as AUTO-XXXX-XXXX-XXXX for better readability
    if (storeId.length === 15) {
      return `${storeId.slice(0, 4)}-${storeId.slice(4, 8)}-${storeId.slice(8, 12)}-${storeId.slice(12)}`;
    }
    
    // Handle case where store ID starts with AUTO and has numbers
    if (storeId.startsWith('AUTO') && storeId.length > 4) {
      const numbers = storeId.slice(4).replace(/[^0-9]/g, '');
      if (numbers.length >= 4) {
        const padded = numbers.padEnd(11, '0');
        return `AUTO-${padded.slice(0, 4)}-${padded.slice(4, 8)}-${padded.slice(8, 11)}`;
      }
    }
    
    return storeId;
  }

  // Extract store ID from formatted string
  static extractStoreId(formattedStoreId: string): string {
    if (!formattedStoreId) return '';
    
    // Remove dashes if present
    return formattedStoreId.replace(/-/g, '');
  }
}

export default StoreIdService;
