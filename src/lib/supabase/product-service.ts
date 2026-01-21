import { supabase } from './client';
import type { Product, FilterOptions, SortOptions } from '../types';

export const productService = {
  /**
   * Get all products with pagination and filters
   */
  async getProducts(
    page = 1,
    limit = 20,
    filters?: FilterOptions,
    sort?: SortOptions
  ) {
    let query = supabase
      .from('products')
      .select(`
        id,
        sku,
        title,
        description,
        category,
        make,
        model,
        year,
        mileage,
        condition,
        specifications,
        original_price,
        sale_price,
        stock_quantity,
        images,
        is_active,
        created_by,
        created_at,
        updated_at,
        featured,
        category_path
      `, { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.make) {
      query = query.eq('make', filters.make);
    }
    if (filters?.model) {
      query = query.eq('model', filters.model);
    }
    if (filters?.condition) {
      query = query.eq('condition', filters.condition);
    }
    if (filters?.minPrice !== undefined) {
      query = query.gte('original_price', filters.minPrice);
    }
    if (filters?.maxPrice !== undefined) {
      query = query.lte('original_price', filters.maxPrice);
    }
    if (filters?.minYear !== undefined) {
      query = query.gte('year', filters.minYear);
    }
    if (filters?.maxYear !== undefined) {
      query = query.lte('year', filters.maxYear);
    }
    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
      );
    }

    // Apply sorting
    const sortField = sort?.field || 'created_at';
    const sortOrder = sort?.order === 'asc' ? true : false;
    query = query.order(sortField, { ascending: sortOrder });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query.range(from, to);

    // Normalize data to ensure consistent structure
    const normalizedData = data?.map(product => ({
      ...product,
      // Ensure images is always an array
      images: Array.isArray(product.images) ? product.images : 
              product.images ? [product.images] : [],
      // Ensure we have a price
      price: product.original_price || 0,
      // Ensure title is available
      title: product.title || `${product.make} ${product.model}`,
      // Ensure stock quantity has a default
      stock_quantity: product.stock_quantity || 10,
    })) || [];

    return {
      data: normalizedData as Product[],
      error,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  /**
   * Get single product by ID
   */
  async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        sku,
        title,
        description,
        category,
        make,
        model,
        year,
        mileage,
        condition,
        specifications,
        original_price,
        sale_price,
        stock_quantity,
        images,
        is_active,
        created_by,
        created_at,
        updated_at,
        featured,
        category_path
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    // Normalize the data to ensure consistent structure
    if (data) {
      const normalizedProduct = {
        ...data,
        // Ensure images is always an array
        images: Array.isArray(data.images) ? data.images : 
                data.images ? [data.images] : [],
        // Ensure we have a price
        price: data.original_price || 0,
        // Ensure title is available
        title: data.title || `${data.make} ${data.model}`,
        // Ensure stock quantity has a default
        stock_quantity: data.stock_quantity || 10,
      };
      return { data: normalizedProduct as Product, error };
    }

    return { data: data as Product | null, error };
  },

  /**
   * Search products by query string
   */
  async searchProducts(query: string, limit = 10) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(
        `title.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%`
      )
      .eq('is_active', true)
      .limit(limit);

    return { data: data as Product[] | null, error };
  },

  /**
   * Get available filter options (makes, categories, etc.)
   */
  async getFilterOptions() {
    const [makesResult, categoriesResult, yearsResult] = await Promise.all([
      supabase.from('products').select('make').not('make', 'is', null),
      supabase.from('products').select('category'),
      supabase
        .from('products')
        .select('year')
        .not('year', 'is', null)
        .order('year', { ascending: false }),
    ]);

    const makes = [
      ...new Set(
        (makesResult.data || [])
          .map((m) => m.make)
          .filter((m): m is string => !!m)
      ),
    ].sort();

    const categories = [
      ...new Set(
        (categoriesResult.data || [])
          .map((c) => c.category)
          .filter((c): c is string => !!c)
      ),
    ];

    const years = [
      ...new Set(
        (yearsResult.data || [])
          .map((y) => y.year)
          .filter((y): y is number => !!y)
      ),
    ].sort((a, b) => b - a);

    return {
      makes,
      categories,
      years,
      minYear: Math.min(...years),
      maxYear: Math.max(...years),
    };
  },

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string, limit = 12) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .limit(limit)
      .order('created_at', { ascending: false });

    return { data: data as Product[] | null, error };
  },

  /**
   * Get similar products (same category, different product)
   */
  async getSimilarProducts(productId: string, category: string, limit = 4) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .neq('id', productId)
      .limit(limit)
      .order('created_at', { ascending: false });

    return { data: data as Product[] | null, error };
  },

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 8) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(limit)
      .order('created_at', { ascending: false });

    return { data: data as Product[] | null, error };
  },
};
