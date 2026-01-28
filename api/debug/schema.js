export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', process.env.VITE_SUPABASE_URL);
    console.log('Supabase Key exists:', !!process.env.VITE_SUPABASE_ANON_KEY);

    // First, try to get sample products to see what columns exist
    const { data: sampleProducts, error: sampleError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('Products query error:', sampleError);
      return res.status(500).json({ 
        error: 'Products query failed',
        details: sampleError.message,
        code: sampleError.code 
      });
    }

    // If we have products, examine the structure
    if (sampleProducts && sampleProducts.length > 0) {
      const product = sampleProducts[0];
      const columns = Object.keys(product);
      
      return res.status(200).json({
        success: true,
        sampleProduct: product,
        availableColumns: columns,
        columnTypes: columns.map(col => ({
          column: col,
          value: product[col],
          type: typeof product[col]
        }))
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'No products found in table',
        sampleProduct: null,
        availableColumns: []
      });
    }

  } catch (error) {
    console.error('Schema debug error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}
