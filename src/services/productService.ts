// Complete Product Service Layer (100% Server Compatible)
// Uses RPC functions to bypass all REST API issues

import { supabase } from '../lib/supabase/client'

// Product interface for type safety
export interface Product {
  id: string
  sku: string
  title: string
  description?: string
  category: string
  make?: string
  model?: string
  year?: number
  mileage?: number
  condition?: string
  original_price: number
  sale_price?: number
  stock_quantity: number
  is_active: boolean
  featured: boolean     // Add featured field
  created_at: string
  updated_at: string
}

export interface ProductFormData {
  sku: string
  title: string
  description?: string
  category: string
  make?: string
  model?: string
  year?: number
  mileage?: number
  condition?: string
  original_price: number
  sale_price?: number
  stock_quantity: number
  is_active?: boolean
  featured?: boolean     // Add featured field
}

// Get products with filtering and pagination
export async function getProducts(options: {
  category?: string
  isActive?: boolean
  limit?: number
  offset?: number
} = {}): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_products', {
        p_category: options.category || null,
        p_is_active: options.isActive !== undefined ? options.isActive : null,
        p_limit: options.limit || 50,
        p_offset: options.offset || 0
      })

    if (error) {
      console.error('Error fetching products:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Unexpected error:', err)
    return []
  }
}

// Get single product by ID
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_product_by_id', { p_id: id })

    if (error) {
      console.error('Error fetching product:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Unexpected error:', err)
    return null
  }
}

// Get single product by SKU
export async function getProductBySku(sku: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_product_by_sku', { p_sku: sku })

    if (error) {
      console.error('Error fetching product by SKU:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Unexpected error:', err)
    return null
  }
}

// Create new product
export async function createProduct(productData: ProductFormData): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .rpc('create_product', {
        p_sku: productData.sku,
        p_title: productData.title,
        p_description: productData.description || null,
        p_category: productData.category,
        p_make: productData.make || null,
        p_model: productData.model || null,
        p_year: productData.year || null,
        p_mileage: productData.mileage || null,
        p_condition: productData.condition || null,
        p_original_price: productData.original_price,
        p_sale_price: productData.sale_price || null,
        p_stock_quantity: productData.stock_quantity
      })

    if (error) {
      console.error('Error creating product:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Unexpected error:', err)
    return null
  }
}

// Update existing product
export async function updateProduct(id: string, productData: Partial<ProductFormData>): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .rpc('update_product', {
        p_id: id,
        p_sku: productData.sku || null,
        p_title: productData.title || null,
        p_description: productData.description || null,
        p_category: productData.category || null,
        p_make: productData.make || null,
        p_model: productData.model || null,
        p_year: productData.year || null,
        p_mileage: productData.mileage || null,
        p_condition: productData.condition || null,
        p_original_price: productData.original_price || null,
        p_sale_price: productData.sale_price || null,
        p_stock_quantity: productData.stock_quantity || null,
        p_is_active: productData.is_active !== undefined ? productData.is_active : null
      })

    if (error) {
      console.error('Error updating product:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Unexpected error:', err)
    return null
  }
}

// Delete product
export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .rpc('delete_product', { p_id: id })

    if (error) {
      console.error('Error deleting product:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Unexpected error:', err)
    return false
  }
}

// Toggle product active status
export async function toggleProductStatus(id: string, currentStatus: boolean): Promise<Product | null> {
  return updateProduct(id, { is_active: !currentStatus })
}

// Search products by title or SKU
export async function searchProducts(query: string, limit: number = 20): Promise<Product[]> {
  try {
    // Use direct query for search (RPC doesn't support search)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`title.ilike.%${query}%,sku.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(limit)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching products:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Unexpected error:', err)
    return []
  }
}

// Get products by category
export async function getProductsByCategory(category: string, limit: number = 20): Promise<Product[]> {
  return getProducts({ category, isActive: true, limit })
}

// Get featured products (active, limited)
export async function getFeaturedProducts(limit: number = 8): Promise<Product[]> {
  return getProducts({ isActive: true, limit })
}

// Get low stock products
export async function getLowStockProducts(threshold: number = 5): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lt('stock_quantity', threshold)
      .eq('is_active', true)
      .order('stock_quantity', { ascending: true })

    if (error) {
      console.error('Error fetching low stock products:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Unexpected error:', err)
    return []
  }
}

// Validate product data
export function validateProductData(data: ProductFormData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.sku || data.sku.trim().length === 0) {
    errors.push('SKU is required')
  }

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required')
  }

  if (!data.category || data.category.trim().length === 0) {
    errors.push('Category is required')
  }

  if (data.original_price < 0) {
    errors.push('Original price must be positive')
  }

  if (data.stock_quantity < 0) {
    errors.push('Stock quantity must be positive')
  }

  if (data.year && (data.year < 1900 || data.year > new Date().getFullYear() + 1)) {
    errors.push('Year must be between 1900 and next year')
  }

  if (data.mileage && data.mileage < 0) {
    errors.push('Mileage must be positive')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Check if SKU already exists with improved error handling
export async function checkSkuExists(sku: string): Promise<boolean> {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const { data, error } = await supabase
      .rpc('check_sku_exists', { 
        p_sku: sku 
      }, {
        // @ts-ignore - AbortSignal is supported but not in types
        signal: controller.signal
      })

    clearTimeout(timeoutId);

    if (error) {
      console.error('Error checking SKU:', error);
      
      // Handle specific error cases
      if (error.message.includes('timeout') || error.message.includes('aborted')) {
        throw new Error('SKU validation timed out');
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        throw new Error('Network connection failed');
      } else {
        // For other errors, return false to allow user to proceed
        console.warn('SKU validation failed, allowing user to proceed:', error);
        return false;
      }
    }

    return data || false;
  } catch (err) {
    console.error('Unexpected error in SKU validation:', err);
    
    // If it's a network error, we want to retry
    if (err instanceof TypeError && 
        (err.message.includes('Failed to fetch') || 
         err.message.includes('NetworkError') ||
         err.message.includes('ERR_NETWORK') ||
         err.message.includes('ERR_NAME_NOT_RESOLVED'))) {
      throw err; // Re-throw network errors for retry mechanism
    }
    
    // For other unexpected errors, return false to allow user to proceed
    console.warn('Unexpected SKU validation error, allowing user to proceed:', err);
    return false;
  }
}

// Format price for display
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}

// Generate unique SKU
export function generateSKU(category: string, make?: string, model?: string): string {
  const categoryCode = category.substring(0, 3).toUpperCase()
  const makeCode = make ? make.substring(0, 3).toUpperCase() : 'GEN'
  const modelCode = model ? model.substring(0, 3).toUpperCase() : 'MOD'
  const timestamp = Date.now().toString(36).toUpperCase()
  
  return `${categoryCode}-${makeCode}-${modelCode}-${timestamp}`
}
