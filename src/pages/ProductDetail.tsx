import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Heart, ShoppingCart, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '@/contexts/CartContext';
import { productService } from '@/lib/supabase/product-service';
import { supabase } from '@/lib/supabase/client';
import { getEffectivePrice } from '@/services/partnerProductsService';
import type { Product, PartnerProduct } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import ProductRecommendations from '@/components/Product/ProductRecommendations';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { LikeButton } from '@/components/liked-items/LikeButton';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct();
    } else {
      navigate('/products');
    }
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await productService.getProductById(id);
      
      if (error || !data) {
        toast({
          title: 'Product not found',
          description: 'The product you are looking for does not exist.',
          variant: 'destructive',
        });
        navigate('/products');
      } else {
        setProduct(data);
        if (data.images && data.images.length > 0) {
          setSelectedImageIndex(0);
        }
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product details.',
        variant: 'destructive',
      });
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      // For now, let's create a simple partner product object using the product's original price
      // This avoids the complex join issue and ensures we have a valid price
      const partnerProduct: PartnerProduct = {
        id: `temp-${product.id}`, // Temporary ID
        partner_id: 'temp-partner', // Temporary partner ID
        product_id: product.id,
        selling_price: product.original_price || 0, // Use product's original price
        profit_margin: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        partner_store_name: 'Direct Purchase' // Default store name
      };
      
      console.log('Adding to cart with partner product:', {
        product,
        partnerProduct,
        finalPrice: partnerProduct.selling_price || product.original_price
      });
      
      addItem(product, partnerProduct, quantity);
      toast({
        title: 'Added to cart',
        description: `${product.title} has been added to your cart.`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Fallback to adding without partner product
      addItem(product, undefined, quantity);
      toast({
        title: 'Added to cart',
        description: `${product.title} has been added to your cart.`,
      });
    }
  };

  const nextImage = () => {
    if (product && product.images && product.images.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product && product.images && product.images.length > 0) {
      setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 container-wide flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading product details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 container-wide">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Product not found</h1>
            <Link to="/products">
              <Button>Browse Products</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container-wide">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link to="/products" className="hover:text-foreground transition-colors">
              Products
            </Link>
            <span>/</span>
            <span className="text-foreground">{product.title}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary">
                <img
                  src={product.images && product.images[selectedImageIndex] ? product.images[selectedImageIndex] : '/placeholder.svg'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {product.images && product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      aria-label="Previous image"
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      aria-label="Next image"
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImageIndex === index
                          ? 'border-accent'
                          : 'border-transparent hover:border-border'
                      }`}
                    >
                      <img src={image} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="uppercase">
                    {product.category}
                  </Badge>
                  <Badge
                    variant={product.condition === 'new' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {product.condition}
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {product.title}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="font-medium">4.9</span>
                  </div>
                  <span className="text-sm">SKU: {product.sku}</span>
                </div>
              </div>

              {/* Price */}
              <div>
                <div className="text-4xl font-bold text-foreground mb-2">
                  {formatPrice(product.original_price)}
                </div>
                {product.year && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Year:</span> {product.year}
                    {product.mileage && (
                      <>
                        {' • '}
                        <span className="font-medium">Mileage:</span> {product.mileage.toLocaleString()} km
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Key Details for Cars */}
              {product.category === 'car' && (
                <div className="p-4 bg-secondary rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>Available in Japan</span>
                  </div>
                  {product.make && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Make:</span> {product.make}
                      {product.model && (
                        <>
                          {' • '}
                          <span className="text-muted-foreground">Model:</span> {product.model}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Quantity & Actions */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-foreground">Quantity:</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={product.stock_quantity === 0}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                  <LikeButton
                  itemType="product"
                  itemId={product.id}
                  itemData={{
                    title: product.title,
                    price: product.price,
                    original_price: product.original_price,
                    image: product.images?.[0],
                    category: product.category,
                    make: product.make,
                    model: product.model,
                    year: product.year,
                    condition: product.condition,
                    rating: product.rating,
                    status: 'active' // Add status field
                  }}
                  size="sm"
                  variant="outline"
                  showCount={false}
                />
                </div>

                {product.stock_quantity === 0 && (
                  <p className="text-sm text-destructive">Out of stock</p>
                )}
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <Tabs defaultValue="description" className="mt-12">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="prose max-w-none">
                <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                {product.specifications &&
                  Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}:</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="mt-6">
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Shipping Information</h3>
                  <p>Free shipping on orders over $500. Standard shipping takes 5-10 business days.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Returns</h3>
                  <p>30-day return policy. Items must be in original condition.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Product Recommendations */}
          {product && (
            <div className="mt-16 pt-8 border-t border-border">
              <ProductRecommendations 
                currentProduct={product} 
                limit={8}
                title="You May Also Like"
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
