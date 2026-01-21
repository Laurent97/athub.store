import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Star, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { productService } from "@/lib/supabase/product-service";
import { supabase } from "@/lib/supabase/client";
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
      className="group bg-card rounded-2xl overflow-hidden border border-border card-hover"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {product.featured && (
            <Badge className="bg-accent text-accent-foreground">Featured</Badge>
          )}
          {product.original_price && product.price < product.original_price && (
            <Badge variant="secondary" className="bg-success text-success-foreground">
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
        
        {/* Condition Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            product.condition === "New" 
              ? "bg-success/20 text-success" 
              : "bg-info/20 text-info"
          }`}>
            {product.condition}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {product.category_path?.category_name || product.category}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-accent text-accent" />
            <span className="text-sm font-medium">{product.rating}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground mb-2 group-hover:text-accent transition-colors line-clamp-2">
          {product.title}
        </h3>

        {/* Details for cars */}
        {product.category === "car" && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
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

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-foreground">
            {formatPrice(Number(product.original_price || product.price))}
          </span>
          {product.original_price && product.price < product.original_price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(Number(product.price))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

const FeaturedProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'featured' | 'liked' | 'recent'>('featured');
  const { user } = useAuth();

  useEffect(() => {
    loadProducts();
  }, [activeTab, user]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      let result;
      
      switch (activeTab) {
        case 'featured':
          // Get featured products
          result = await productService.getProducts(1);
          if (result.data) {
            const featured = result.data.filter((p: any) => p.featured).slice(0, 6);
            setProducts(featured);
          }
          break;
          
        case 'liked':
          // Get liked products
          if (user) {
            try {
              const { data: likedItems, error: likedError } = await supabase
                .from('liked_items')
                .select('item_id')
                .eq('user_id', user.id)
                .eq('item_type', 'product');
              
              if (likedError) {
                console.error('Error fetching liked items:', likedError);
                setProducts([]);
              } else if (likedItems && likedItems.length > 0) {
                const likedIds = likedItems.map(item => item.item_id);
                const allProducts = await productService.getProducts(1);
                const likedProducts = allProducts.data.filter((p: any) => 
                  likedIds.includes(p.id)
                ).slice(0, 6);
                setProducts(likedProducts);
              } else {
                setProducts([]);
              }
            } catch (error) {
              console.error('Error in liked products fetch:', error);
              setProducts([]);
            }
          } else {
            setProducts([]);
          }
          break;
          
        case 'recent':
          // Get recent products
          result = await productService.getProducts(1);
          if (result.data) {
            const recent = result.data
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 6);
            setProducts(recent);
          }
          break;
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-wide">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {activeTab === 'featured' && 'Featured Products'}
              {activeTab === 'liked' && 'Liked Products'}
              {activeTab === 'recent' && 'Recent Products'}
            </h2>
            <p className="text-muted-foreground text-lg">
              {activeTab === 'featured' && 'Handpicked vehicles and parts for you'}
              {activeTab === 'liked' && 'Products you\'ve saved to your collection'}
              {activeTab === 'recent' && 'Latest additions to our inventory'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Tab Navigation */}
            <div className="flex bg-card rounded-lg p-1 border border-border">
              <button
                onClick={() => setActiveTab('featured')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'featured'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Featured
              </button>
              <button
                onClick={() => setActiveTab('liked')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'liked'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Liked
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'recent'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Recent
              </button>
            </div>
            
            <Link to="/products">
              <Button variant="ghost" className="gap-2 text-accent hover:text-accent">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-card rounded-2xl overflow-hidden border border-border">
                  <div className="aspect-[4/3] bg-muted"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {activeTab === 'liked' && 'You haven\'t liked any products yet'}
              {activeTab === 'featured' && 'No featured products available'}
              {activeTab === 'recent' && 'No recent products available'}
            </div>
            {activeTab === 'liked' && (
              <Link to="/products">
                <Button>Browse Products</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
