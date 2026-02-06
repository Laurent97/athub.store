import { supabase } from './client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  product_type: string;
  level: number;
  sort_order: number;
  item_count: number;
  is_active: boolean;
  parent_id?: string;
}

export const categoryService = {
  /**
   * Get all active categories from product_categories table
   */
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data as Category[] || [];
  },

  /**
   * Get main categories (level 1)
   */
  async getMainCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .eq('level', 1)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching main categories:', error);
      return [];
    }

    return data as Category[] || [];
  },

  /**
   * Get subcategories by parent ID
   */
  async getSubcategories(parentId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .eq('parent_id', parentId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching subcategories:', error);
      return [];
    }

    return data as Category[] || [];
  },

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching category by slug:', error);
      return null;
    }

    return data as Category;
  },

  /**
   * Get formatted categories for frontend dropdown
   */
  async getFormattedCategories(): Promise<{ id: string; label: string }[]> {
    const categories = await this.getMainCategories();
    
    // Format for frontend: { id: string, label: string }
    const formattedCategories = categories.map(cat => ({
      id: cat.slug,
      label: `${cat.name} ${cat.item_count > 0 ? `(${cat.item_count > 1000 ? `${Math.floor(cat.item_count / 1000)}K+` : cat.item_count}+ Items)` : ''}`
    }));

    // Add "All Products" at the beginning
    return [
      { id: "all", label: "All Products 150K+ Items" },
      ...formattedCategories
    ];
  }
};
