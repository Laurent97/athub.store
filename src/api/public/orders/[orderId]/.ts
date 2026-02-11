// Public API endpoint for order access without authentication
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export async function GET(request: Request, { params }: { params: { orderId: string } }) {
  try {
    const { orderId } = params;
    
    // Validate orderId format
    if (!orderId || typeof orderId !== 'string') {
      return Response.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    // Fetch only public-safe fields from orders
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        currency,
        status,
        created_at,
        updated_at,
        payment_status,
        shipping_fee,
        tax_fee,
        items:order_items(
          id,
          product_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .or(`id.eq.${orderId},order_number.eq.${orderId}`)
      .maybeSingle();
    
    if (error) {
      console.error('Public order API error:', error);
      return Response.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      );
    }
    
    if (!data) {
      return Response.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Return public order data (no sensitive customer info)
    return Response.json({
      ...data,
      isPublicView: true,
      accessType: 'public'
    });
    
  } catch (error) {
    console.error('Public order API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
