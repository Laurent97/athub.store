import { TrackingService } from '../lib/supabase/tracking-service';
import { supabase } from '../lib/supabase/client';
import { ShippingFormData, TrackingUpdateFormData } from '../lib/types/tracking';

// Admin API endpoints
export const adminTrackingAPI = {
  // Mark order as shipped
  async shipOrder(orderId: string, data: ShippingFormData, adminId: string) {
    try {
      console.log('🚀 Shipping order:', { orderId, adminId });
      
      // Get current user if adminId not provided
      if (!adminId) {
        const { data: { user } } = await supabase.auth.getUser();
        adminId = user?.id;
        if (!adminId) {
          throw new Error('User not authenticated');
        }
      }
      
      const tracking = await TrackingService.createTracking({
        ...data,
        orderId,
        adminId
      });
      
      // Update order with tracking_id
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          tracking_id: tracking.id,
          status: 'shipped',
          updated_at: new Date().toISOString()
        })
        .eq('order_number', orderId);

      if (orderError) {
        console.error('❌ Error updating order:', orderError);
        throw new Error(`Failed to update order: ${orderError.message}`);
      }

      console.log('✅ Order shipped successfully:', tracking);
      return { success: true, data: tracking };
    } catch (error) {
      console.error('💥 Error shipping order:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to ship order' 
      };
    }
  },

  // Get all tracking records
  async getAllTracking() {
    try {
      const data = await TrackingService.getAllTracking();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching tracking:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch tracking' 
      };
    }
  },

  // Update tracking status
  async updateTracking(data: TrackingUpdateFormData, adminId: string) {
    try {
      const result = await TrackingService.updateTrackingStatus({
        ...data,
        adminId
      });
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating tracking:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update tracking' 
      };
    }
  },

  // Update estimated delivery
  async updateEstimatedDelivery(trackingId: string, estimatedDelivery: string) {
    try {
      const data = await TrackingService.updateEstimatedDelivery(trackingId, estimatedDelivery);
      return { success: true, data };
    } catch (error) {
      console.error('Error updating estimated delivery:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update estimated delivery' 
      };
    }
  },

  // Delete tracking
  async deleteTracking(trackingId: string) {
    try {
      await TrackingService.deleteTracking(trackingId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting tracking:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete tracking' 
      };
    }
  }
};

// Public API endpoints
export const publicTrackingAPI = {
  // Get tracking by number
  async getTracking(trackingNumber: string) {
    try {
      const data = await TrackingService.getTrackingByNumber(trackingNumber);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching tracking:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Tracking not found' 
      };
    }
  }
};

// Partner API endpoints
export const partnerTrackingAPI = {
  // Get tracking for partner's orders
  async getPartnerTracking(partnerId: string) {
    try {
      const data = await TrackingService.getPartnerTracking(partnerId);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching partner tracking:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch tracking' 
      };
    }
  },

  // Get tracking by order ID
  async getOrderTracking(orderId: string) {
    try {
      const data = await TrackingService.getTrackingByOrderId(orderId);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching order tracking:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Tracking not found' 
      };
    }
  }
};
