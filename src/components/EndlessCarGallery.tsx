import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Loader2, Building2, Shield, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { productService } from "@/lib/supabase/product-service";
import { SimpleLikeButton } from "@/components/liked-items/LikeButton";

const ProductCard = ({ product }: { product: any }) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);

  const imageUrl = product?.images?.[0] ?? product?.image ?? "/placeholder.svg";

  return (
    <Link to={`/products/${product.id}`} className="group bg-card rounded-xl overflow-hidden border border-border hover:border-blue-300 hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={imageUrl} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

        <div className="absolute top-3 left-3 flex gap-2">
          {product.featured && <Badge className="bg-blue-600 text-white text-xs font-semibold">Featured</Badge>}
          {product.verified && <Badge className="bg-green-600 text-white text-xs font-semibold">Verified</Badge>}
          {product.original_price && product.price < product.original_price && (
            <Badge variant="secondary" className="bg-red-500 text-white text-xs font-semibold">{Math.round((1 - product.price / product.original_price) * 100)}% OFF</Badge>
          )}
        </div>

        <SimpleLikeButton itemType="product" itemId={product.id} itemData={{ title: product.title, price: product.price, original_price: product.original_price, image: imageUrl }} className="absolute top-3 right-3" />

      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">{product.category_path?.category_name || product.category}</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-foreground">{product.rating ?? "4.5"}</span>
          </div>
        </div>

        <h3 className="font-semibold text-foreground mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm md:text-base">{product.title}</h3>

        {product.category === "car" && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {product.year && <span>{product.year}</span>}
            {product.mileage && <span>{product.mileage.toLocaleString()} km</span>}
            {product.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{product.location}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">{formatPrice(Number(product.original_price ?? product.price ?? 0))}</span>
            {product.original_price && product.price < product.original_price && <span className="text-sm text-muted-foreground line-through">{formatPrice(Number(product.price))}</span>}
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">Get Quote</Button>
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
  const observer = useRef<IntersectionObserver | null>(null);

  const lastProductRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreProducts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const loadProducts = async (pageNum = 1, isInitial = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await productService.getProducts(pageNum, 12);
      if (result?.data) {
        const all = result.data;
        setProducts((prev) => isInitial ? all : [...prev, ...all]);
        if (isInitial) {
          setTotalProducts(result.total ?? all.length);
        } else {
          setTotalProducts((prev) => prev + (result.data.length ?? 0));
        }
        setHasMore((result.data.length ?? 0) >= 12);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProducts = () => {
    if (!loading && hasMore) {
      const next = page + 1;
      setPage(next);
      loadProducts(next);
    }
  };

  useEffect(() => { loadProducts(1, true); }, []);

  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 mb-6">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-semibold">PREMIUM VEHICLE MARKETPLACE</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">Premium Vehicles & <span className="block text-blue-600">Automotive Solutions</span></h2>

          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">Discover our extensive collection of premium vehicles, cars, and automotive solutions from verified suppliers worldwide. Quality guaranteed, competitive pricing.</p>

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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <div key={product.id} ref={index === products.length - 3 ? lastProductRef : undefined} className="animate-slide-up-delayed">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-lg font-medium">Loading more products...</span>
            </div>
          </div>
        )}

        {!hasMore && products.length > 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">You've reached the end of our product collection</div>
            <div className="text-sm text-muted-foreground">Showing {products.length} of {totalProducts} products</div>
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">No products available at the moment</div>
            <div className="text-sm text-muted-foreground">Please check back later or browse our other categories</div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EndlessCarGallery;
