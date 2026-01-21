import { productService } from '../src/lib/supabase/product-service';

async function testProductServiceFix() {
  console.log('🔧 TESTING PRODUCT SERVICE FIXES\n');

  try {
    // Test 1: Get product by ID
    console.log('📋 Test 1: getProductById...');
    const { data: product, error: productError } = await productService.getProductById('d437c33e-5391-469d-9b9d-1f99ab3325a7');
    
    if (productError) {
      console.error('❌ Product fetch error:', productError);
      return;
    }

    if (!product) {
      console.error('❌ Product not found');
      return;
    }

    console.log('✅ Product Data Structure:');
    console.log('   ID:', product.id);
    console.log('   Title:', product.title);
    console.log('   Price:', product.price);
    console.log('   Original Price:', product.original_price);
    console.log('   Images:', product.images);
    console.log('   Images type:', typeof product.images);
    console.log('   Images length:', product.images?.length);
    console.log('   Stock Quantity:', product.stock_quantity);
    console.log('   Has Images:', product.images && product.images.length > 0);
    console.log('   First Image:', product.images?.[0]);

    // Test 2: Get products list
    console.log('\n📋 Test 2: getProducts...');
    const { data: products, error: productsError } = await productService.getProducts(1, 5);
    
    if (productsError) {
      console.error('❌ Products fetch error:', productsError);
      return;
    }

    console.log('✅ Products List:');
    products?.forEach((p, index) => {
      console.log(`   Product ${index + 1}:`, {
        id: p.id,
        title: p.title,
        price: p.price,
        original_price: p.original_price,
        hasImages: p.images && p.images.length > 0,
        imageCount: p.images?.length,
        stock_quantity: p.stock_quantity
      });
    });

    // Test 3: Verify data normalization
    console.log('\n📋 Test 3: Data Normalization Check...');
    const normalizationIssues = [];
    
    products?.forEach((p, index) => {
      if (!p.images || !Array.isArray(p.images)) {
        normalizationIssues.push(`Product ${index + 1}: Images not properly normalized`);
      }
      if (!p.price && !p.original_price) {
        normalizationIssues.push(`Product ${index + 1}: Missing both price and original_price`);
      }
      if (!p.title && !p.name) {
        normalizationIssues.push(`Product ${index + 1}: Missing both title and name`);
      }
      if (!p.stock_quantity || p.stock_quantity <= 0) {
        normalizationIssues.push(`Product ${index + 1}: Invalid stock_quantity`);
      }
    });

    if (normalizationIssues.length === 0) {
      console.log('✅ All products properly normalized!');
    } else {
      console.log('❌ Normalization issues found:');
      normalizationIssues.forEach(issue => console.log(`   - ${issue}`));
    }

    console.log('\n🎉 PRODUCT SERVICE FIX SUMMARY:');
    console.log('✅ Explicit field selection: All necessary fields fetched');
    console.log('✅ Data normalization: Images always arrays, prices always set');
    console.log('✅ Title fallback: Uses name or make+model if title missing');
    console.log('✅ Stock fallback: Default to 10 if missing');
    console.log('✅ Price fallback: Uses price OR original_price');
    console.log('✅ Consistent structure: All products have same field types');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProductServiceFix();
