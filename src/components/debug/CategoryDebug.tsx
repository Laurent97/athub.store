import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '@/lib/supabase/product-service';

export function CategoryDebug() {
  const [searchParams] = useSearchParams();
  const [logs, setLogs] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const debugCategories = async () => {
    const categoryFilter = searchParams.get("category") || "all";
    
    addLog(`🔍 Debugging category filtering...`);
    addLog(`📋 Category filter: ${categoryFilter}`);
    
    try {
      // Fetch all products first
      const result = await productService.getProducts(1);
      
      if (result.data && result.data.length > 0) {
        addLog(`📊 Found ${result.data.length} total products`);
        
        // Show all products with their categories
        result.data.forEach((product: any, index: number) => {
          addLog(`  ${index + 1}. ${product.title}`);
          addLog(`     - category: ${product.category}`);
          addLog(`     - category_path: ${JSON.stringify(product.category_path)}`);
          addLog(`     - category_path.product_type: ${product.category_path?.product_type}`);
        });
        
        // Apply the same filtering logic as the frontend
        const filtered = result.data.filter((product: any) => {
          if (categoryFilter !== "all" && product.category_path?.product_type !== categoryFilter) {
            addLog(`❌ Filtered out: ${product.title} (product_type: ${product.category_path?.product_type} != ${categoryFilter})`);
            return false;
          }
          addLog(`✅ Included: ${product.title}`);
          return true;
        });
        
        addLog(`📋 Filtered result: ${filtered.length} products`);
        setProducts(filtered);
        
      } else {
        addLog(`❌ No products found in database`);
      }
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  const testDirectQuery = async () => {
    addLog(`🔍 Testing direct database query...`);
    
    try {
      const { data, error } = await productService.getProducts(1);
      
      if (error) {
        addLog(`❌ Query error: ${error.message}`);
      } else {
        addLog(`📊 Direct query found ${data?.length || 0} products`);
        
        // Check if any products have the expected category_path
        const cars = data?.filter((p: any) => p.category_path?.product_type === 'cars');
        const parts = data?.filter((p: any) => p.category_path?.product_type === 'parts');
        const accessories = data?.filter((p: any) => p.category_path?.product_type === 'accessories');
        
        addLog(`🚗 Cars: ${cars?.length || 0}`);
        addLog(`🔧 Parts: ${parts?.length || 0}`);
        addLog(`📱 Accessories: ${accessories?.length || 0}`);
        
        // Show sample car product
        if (cars && cars.length > 0) {
          addLog(`🚗 Sample car: ${cars[0].title}`);
          addLog(`     category_path: ${JSON.stringify(cars[0].category_path)}`);
        }
      }
      
    } catch (error: any) {
      addLog(`❌ Direct query error: ${error.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold mb-4">Category Debug</h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={debugCategories}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Debug Categories
        </button>
        <button
          onClick={testDirectQuery}
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          Test Direct Query
        </button>
        <button
          onClick={clearLogs}
          className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.map((log, index) => (
          <div
            key={index}
            className={`p-2 rounded text-sm font-mono ${
              log.includes('✅') ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' :
              log.includes('❌') ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200' :
              log.includes('🔍') || log.includes('📊') || log.includes('📋') ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200' :
              log.includes('🚗') || log.includes('🔧') || log.includes('📱') ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200' :
              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            {log}
          </div>
        ))}
      </div>

      {products.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Filtered Products ({products.length}):</h4>
          <div className="space-y-1">
            {products.map((product, index) => (
              <div key={index} className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                {product.title} ({product.category_path?.product_type})
              </div>
            ))}
          </div>
        </div>
      )}

      {logs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Click "Debug Categories" to see what's happening
        </div>
      )}
    </div>
  );
}
