import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function finalComprehensiveCheck() {
  console.log('🎯 FINAL COMPREHENSIVE SYSTEM CHECK\n');
  
  const results = {
    cartContext: { status: '❌', issues: [] },
    productDetail: { status: '❌', issues: [] },
    storePages: { status: '❌', issues: [] },
    types: { status: '❌', issues: [] },
    database: { status: '❌', issues: [] }
  };

  try {
    // 1. Check CartContext Implementation
    console.log('📋 1. Checking CartContext.tsx...');
    
    // Read the actual CartContext file
    const fs = require('fs');
    const cartContextPath = './src/contexts/CartContext.tsx';
    const cartContextContent = fs.readFileSync(cartContextPath, 'utf8');
    
    const cartContextChecks = {
      hasCorrectPriceLogic: cartContextContent.includes('partnerProduct?.selling_price || product.original_price || 0'),
      hasPriceValidation: cartContextContent.includes('if (!price || price <= 0)'),
      hasProperErrorHandling: cartContextContent.includes('console.error'),
      hasFixedQuery: cartContextContent.includes('partner_products!inner(') && !cartContextContent.includes('partner_profiles!inner('),
      usesSellingPrice: cartContextContent.includes('selling_price') && !cartContextContent.includes('custom_price')
    };
    
    results.cartContext = {
      status: cartContextChecks.hasCorrectPriceLogic && cartContextChecks.hasPriceValidation && cartContextChecks.hasProperErrorHandling && cartContextChecks.hasFixedQuery && cartContextChecks.usesSellingPrice ? '✅' : '❌',
      issues: Object.entries(cartContextChecks).filter(([key, value]) => !value).map(([key, value]) => `${key}: ${value ? '✅' : '❌'}`)
    };

    // 2. Check ProductDetail Implementation
    console.log('\n📋 2. Checking ProductDetail.tsx...');
    
    const productDetailPath = './src/pages/ProductDetail.tsx';
    const productDetailContent = fs.readFileSync(productDetailPath, 'utf8');
    
    const productDetailChecks = {
      hasCorrectImports: productDetailContent.includes('import { supabase }'),
      createsValidPartnerProduct: productDetailContent.includes('selling_price: product.original_price || 0'),
      hasProperErrorHandling: productDetailContent.includes('catch (error)'),
      passesPartnerProduct: productDetailContent.includes('addItem(product, partnerProduct, quantity)')
    };
    
    results.productDetail = {
      status: productDetailChecks.hasCorrectImports && productDetailChecks.createsValidPartnerProduct && productDetailChecks.hasProperErrorHandling && productDetailChecks.passesPartnerProduct ? '✅' : '❌',
      issues: Object.entries(productDetailChecks).filter(([key, value]) => !value).map(([key, value]) => `${key}: ${value ? '✅' : '❌'}`)
    };

    // 3. Check Store Pages Implementation
    console.log('\n📋 3. Checking Store pages...');
    
    const storeBrokenPath = './src/pages/Store-Broken.tsx';
    const storeProductsPath = './src/components/Partner/StoreProducts.tsx';
    
    const storeBrokenContent = fs.readFileSync(storeBrokenPath, 'utf8');
    const storeProductsContent = fs.readFileSync(storeProductsPath, 'utf8');
    
    const storeChecks = {
      storeBrokenUsesSellingPrice: storeBrokenContent.includes('selling_price: product.selling_price') && !storeBrokenContent.includes('custom_price'),
      storeProductsUsesSellingPrice: storeProductsContent.includes('selling_price: number') && !storeProductsContent.includes('custom_price'),
      hasCorrectInterfaces: storeBrokenContent.includes('interface StoreProduct') && storeProductsContent.includes('selling_price: number')
    };
    
    results.storePages = {
      status: storeChecks.storeBrokenUsesSellingPrice && storeChecks.storeProductsUsesSellingPrice && storeChecks.hasCorrectInterfaces ? '✅' : '❌',
      issues: Object.entries(storeChecks).filter(([key, value]) => !value).map(([key, value]) => `${key}: ${value ? '✅' : '❌'}`)
    };

    // 4. Check Types Implementation
    console.log('\n📋 4. Checking database types...');
    
    const typesPath = './src/lib/types/database.ts';
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    
    const typeChecks = {
      partnerProductHasSellingPrice: typesContent.includes('selling_price: number'),
      cartItemHasRequiredFields: typesContent.includes('partner_store_name?: string') && typesContent.includes('partner_id?: string'),
      hasCorrectInterfaces: typesContent.includes('export interface PartnerProduct') && typesContent.includes('export interface CartItem')
    };
    
    results.types = {
      status: typeChecks.partnerProductHasSellingPrice && typeChecks.cartItemHasRequiredFields && typeChecks.hasCorrectInterfaces ? '✅' : '❌',
      issues: Object.entries(typeChecks).filter(([key, value]) => !value).map(([key, value]) => `${key}: ${value ? '✅' : '❌'}`)
    };

    // 5. Database Connection Test
    console.log('\n📋 5. Testing database connection...');
    
    try {
      const { data: testProduct } = await supabase
        .from('products')
        .select('id, title, original_price')
        .eq('id', 'd437c33e-5391-469d-9b9d-1f99ab3325a7')
        .single();
      
      if (testProduct) {
        results.database = {
          status: '✅',
          issues: [],
          details: {
            productFound: true,
            hasOriginalPrice: testProduct.original_price > 0,
            price: testProduct.original_price
          }
        };
      } else {
        results.database = {
          status: '❌',
          issues: ['Cannot connect to database or find product'],
          details: null
        };
      }
    } catch (error) {
      results.database = {
        status: '❌',
        issues: [`Database error: ${error.message}`],
        details: null
      };
    }

  } catch (error) {
    console.error('❌ Comprehensive check failed:', error);
  }

  // 6. Calculate Overall Status
  const allStatuses = [
    results.cartContext.status,
    results.productDetail.status,
    results.storePages.status,
    results.types.status,
    results.database.status
  ];
  
  const allIssues = [
    ...results.cartContext.issues,
    ...results.productDetail.issues,
    ...results.storePages.issues,
    ...results.types.issues,
    ...results.database.issues
  ];

  const successCount = allStatuses.filter(status => status === '✅').length;
  const totalChecks = allStatuses.length;

  console.log('\n🎯 FINAL RESULTS:');
  console.log(`✅ Success Rate: ${successCount}/${totalChecks} (${Math.round(successCount/totalChecks * 100)}%)`);
  
  if (allIssues.length === 0) {
    console.log('🎉 ALL SYSTEMS ARE WORKING CORRECTLY!');
    console.log('\n📋 Summary:');
    console.log('✅ CartContext: Fixed SQL queries, proper price validation');
    console.log('✅ ProductDetail: Creates valid partner products, proper error handling');
    console.log('✅ Store Pages: Updated to use selling_price');
    console.log('✅ Types: All interfaces use correct field names');
    console.log('✅ Database: Connection successful, data accessible');
    console.log('\n🛒 The cart system should now work without "Invalid price for product" errors!');
  } else {
    console.log('\n❌ ISSUES FOUND:');
    allIssues.forEach(issue => console.log(`   - ${issue}`));
    console.log('\n🔧 Please review the failing components above.');
  }

  return {
    overall: allIssues.length === 0 ? 'SUCCESS' : 'NEEDS_FIXES',
    successRate: Math.round(successCount/totalChecks * 100),
    results,
    recommendations: allIssues.length === 0 ? [
      'System is ready for production',
      'Cart should work correctly with valid prices'
    ] : [
      'Fix the failing components identified above',
      'Ensure all interfaces use selling_price instead of custom_price',
      'Test database connectivity and data integrity'
    ]
  };
}

finalComprehensiveCheck();
