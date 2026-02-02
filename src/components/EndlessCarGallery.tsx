import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, MapPin, Loader2, Building2, Shield, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { productService } from "@/lib/supabase/product-service";
import { SimpleLikeButton } from "@/components/liked-items/LikeButton";
import { useAuth } from "@/contexts/AuthContext";

const ProductCard = ({ product }: { product: any }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get first image or placeholder
  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0] 
    : product.image || '/placeholder.svg';

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-card rounded-xl overflow-hidden border border-border hover:border-blue-300 hover:shadow-lg transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {product.featured && (
            <Badge className="bg-blue-600 text-white text-xs font-semibold">Featured</Badge>
          )}
          {product.verified && (
            <Badge className="bg-green-600 text-white text-xs font-semibold">Verified</Badge>
          )}
          {product.original_price && product.price < product.original_price && (
            <Badge variant="secondary" className="bg-red-500 text-white text-xs font-semibold">
              {Math.round((1 - product.price / product.original_price) * 100)}% OFF
            </Badge>
          )}
        </div>
        
        {/* Like Button */}
        <SimpleLikeButton
          itemType="product"
          itemId={product.id}
          itemData={{
            title: product.title,
            price: product.price,
            original_price: product.original_price,
            image: imageUrl,
            category: product.category,
            make: product.make,
            model: product.model,
            year: product.year,
            condition: product.condition,
            rating: product.rating,
            status: 'active'
          }}
          className="absolute top-3 right-3"
        />
        
        {/* Supplier Info */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-foreground truncate">
                {product.supplier || 'Verified Supplier'}
              </span>
            </div>
            {product.min_order && (
              <span className="text-xs text-muted-foreground">Min: {product.min_order}</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
            {product.category_path?.category_name || product.category}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-foreground">{product.rating || '4.5'}</span>
            <span className="text-xs text-muted-foreground">({product.reviews || '128'})</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm md:text-base">
          {product.title}
        </h3>

        {/* Details for cars */}
        {product.category === "car" && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {product.year && <span>{product.year}</span>}
            {product.mileage && <span>{product.mileage.toLocaleString()} km</span>}
            {product.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {product.location}
              </span>
            )}
          </div>
        )}

        {/* B2B Specific Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          {product.moq && (
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
              MOQ: {product.moq}
            </span>
          )}
          {product.lead_time && (
            <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
              {product.lead_time} days
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">
              {formatPrice(Number(product.original_price || product.price))}
            </span>
            {product.original_price && product.price < product.original_price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(Number(product.price))}
              </span>
            )}
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
            Get Quote
          </Button>
        </div>
      </div>
    </Link>
  );
};

const EndlessCarGallery = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const observer = useRef<IntersectionObserver>();
  const lastProductRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreProducts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const { user } = useAuth();

  const loadProducts = async (pageNum = 1, isInitial = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const result = await productService.getProducts(pageNum, 12); // Load 12 products per page
      
      if (result.data) {
        // Filter for cars and vehicles primarily
        const carProducts = result.data.filter((product: any) => 
          product.category === 'car' || 
          product.category === 'vehicle' ||
          product.category_path?.category_name?.toLowerCase().includes('car') ||
          product.category_path?.category_name?.toLowerCase().includes('vehicle') ||
          product.title?.toLowerCase().includes('car') ||
          product.title?.toLowerCase().includes('vehicle')
        );
        
        if (isInitial) {
          setProducts(carProducts);
        } else {
          setProducts(prev => [...prev, ...carProducts]);
        }
        
        setTotalProducts(result.total || result.data.length);
        setHasMore(result.data.length >= 12); // Continue if we got a full page
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProducts = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadProducts(nextPage);
    }
  };

  useEffect(() => {
    loadProducts(1, true);
  }, []);

  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 mb-6">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-semibold">PREMIUM VEHICLE MARKETPLACE</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Premium Vehicles & 
            <span className="block text-blue-600">Automotive Solutions</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            Discover our extensive collection of premium vehicles, cars, and automotive solutions from verified suppliers worldwide. Quality guaranteed, competitive pricing.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm font-semibold text-blue-900">Trade Assurance</div>
                <div className="text-xs text-blue-700">Protected orders</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Truck className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm font-semibold text-green-900">Fast Shipping</div>
                <div className="text-xs text-green-700">Global delivery</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Building2 className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-sm font-semibold text-purple-900">Verified Suppliers</div>
                <div className="text-xs text-purple-700">Quality checked</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <Users className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-sm font-semibold text-orange-900">Bulk Pricing</div>
                <div className="text-xs text-orange-700">Volume discounts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <div
              key={product.id}
              ref={index === products.length - 3 ? lastProductRef : undefined}
              className="animate-slide-up-delayed"
              style={{ '--animation-delay': `${index * 0.05}s` } as React.CSSProperties}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-lg font-medium">Loading more vehicles...</span>
            </div>
          </div>
        )}

        {/* End of Products Message */}
        {!hasMore && products.length > 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              You've reached the end of our vehicle collection
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {products.length} of {totalProducts} vehicles
            </div>
          </div>
        )}

        {/* No Products */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              No vehicles available at the moment
            </div>
            <div className="text-sm text-muted-foreground">
              Please check back later or browse our other categories
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EndlessCarGallery;
