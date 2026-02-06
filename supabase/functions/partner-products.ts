// Simple Partner Products Service
// This provides basic product management for partners

import { supabase } from '../lib/supabase/client';

// Product interface
export interface PartnerProduct {
  id: string;
  partner_id: string;
  product_id: string;
  title: string;
  description?: string;
  price?: number;
  profit_margin?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Get partner products (fallback to direct query)
export async function getPartnerProducts(partnerId: string): Promise<PartnerProduct[]> {
  try {
    console.log('📦 Fetching partner products for:', partnerId);
      
      const { data, error } = await supabase
        .from('partner_products')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching partner products:', error);
        throw error;
      }
      
      console.log('✅ Found products:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Unexpected error:', error);
      return [];
    }
  }

// Create partner product
export async function createPartnerProduct(
  partnerId: string,
  productId: string,
  title: string,
  description?: string,
  price?: number,
  profitMargin?: number
): Promise<PartnerProduct | null> {
  try {
    console.log('📝 Creating partner product:', { partnerId, productId });
      
      const { data, error } = await supabase
        .from('partner_products')
        .insert({
          partner_id,
          product_id: productId,
          title,
          description,
          price,
          profit_margin,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating partner product:', error);
        throw error;
      }
      
      console.log('✅ Product created:', data);
      return data;
    } catch (error) {
      console.error('Unexpected error:', error);
      return null;
    }
  }
}
