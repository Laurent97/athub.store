import { supabase } from './client';

export interface LikeResponse {
  success: boolean;
  isLiked: boolean;
  totalLikes?: number;
  message?: string;
}

export interface LikedItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'product' | 'store' | 'partner';
  created_at: string;
  updated_at: string;
}

export class LikedItemsService {
  private static tableExists: boolean | null = null;

  // Check if liked_items table exists (cached)
  private static async checkTableExists(): Promise<boolean> {
    if (this.tableExists !== null) return this.tableExists;
    
    try {
      const { data, error } = await supabase
        .from('liked_items')
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        this.tableExists = false;
        return false;
      }
      
      this.tableExists = !error;
      return this.tableExists;
    } catch (error) {
      console.error('Error checking liked_items table:', error);
      this.tableExists = false;
      return false;
    }
  }

  // Toggle like/unlike for an item
  static async toggleLike(userId: string, itemId: string, itemType: string = 'product'): Promise<LikeResponse> {
    try {
      const tableExists = await this.checkTableExists();
      
      if (!tableExists) {
        return { 
          success: false, 
          isLiked: false, 
          message: 'liked_items table not available' 
        };
      }

      // First check if already liked using maybeSingle to avoid 406
      const { data: existing } = await supabase
        .from('liked_items')
        .select('id')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .maybeSingle(); // KEY: Use maybeSingle to handle 406 gracefully

      if (existing) {
        // Unlike if already liked
        const { error } = await supabase
          .from('liked_items')
          .delete()
          .eq('id', existing.id);
        
        if (error) throw error;
        return { success: true, isLiked: false, totalLikes: 0 };
      }

      // Add new like
      const { data, error } = await supabase
        .from('liked_items')
        .insert({
          user_id: userId,
          item_id: itemId,
          item_type: itemType,
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        success: true,
        isLiked: true,
        totalLikes: 1,
      };
    } catch (error) {
      console.error('Error toggling like:', error);
      return { 
        success: false, 
        isLiked: false, 
        totalLikes: 0, 
        message: error.message 
      };
    }
  }

  // Check if an item is liked
  static async isLiked(userId: string, itemId: string, itemType: string = 'product'): Promise<boolean> {
    try {
      const tableExists = await this.checkTableExists();
      
      if (!tableExists) {
        console.warn('liked_items table not available');
        return false;
      }

      const { data } = await supabase
        .from('liked_items')
        .select('id')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .maybeSingle(); // KEY: Use maybeSingle to handle 406 gracefully

      return !!data;
    } catch (error) {
      console.error('Error checking like status:', error);
      return false;
    }
  }

  // Get all liked items for a user
  static async getLikedItems(userId: string, itemType?: string): Promise<LikedItem[]> {
    try {
      const tableExists = await this.checkTableExists();
      
      if (!tableExists) {
        console.warn('liked_items table not available');
        return [];
      }

      let query = supabase
        .from('liked_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (itemType) {
        query = query.eq('item_type', itemType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching liked items:', error);
      return [];
    }
  }

  // Get liked products with product details (manual join)
  static async getLikedProducts(userId: string): Promise<any[]> {
    try {
      const tableExists = await this.checkTableExists();
      
      if (!tableExists) {
        console.warn('liked_items table not available');
        return [];
      }

      const { data, error } = await supabase
        .from('liked_items')
        .select(`
          id,
          user_id,
          item_id,
          item_type,
          created_at,
          products!inner(
            id,
            title,
            make,
            model,
            original_price,
            sale_price,
            images,
            description,
            stock_quantity,
            is_active
          )
        `)
        .eq('user_id', userId)
        .eq('item_type', 'product')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getLikedProducts:', error);
      return [];
    }
  }

  // Remove multiple liked items
  static async removeMultipleLikes(userId: string, itemIds: string[]): Promise<{ success: boolean; removed: number }> {
    try {
      const tableExists = await this.checkTableExists();
      
      if (!tableExists) {
        return { success: false, removed: 0 };
      }

      const { data, error } = await supabase
        .from('liked_items')
        .delete()
        .eq('user_id', userId)
        .in('item_id', itemIds);

      if (error) throw error;
      return { success: true, removed: data?.length || 0 };
    } catch (error) {
      console.error('Error removing multiple items:', error);
      return { success: false, removed: 0 };
    }
  }

  // Get like count for an item
  static async getLikeCount(itemId: string, itemType: string = 'product'): Promise<number> {
    try {
      const tableExists = await this.checkTableExists();
      
      if (!tableExists) {
        return 0;
      }

      const { count } = await supabase
        .from('liked_items')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', itemId)
        .eq('item_type', itemType);

      return count || 0;
    } catch (error) {
      console.error('Error getting like count:', error);
      return 0;
    }
  }
}

export default LikedItemsService;
