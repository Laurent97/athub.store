// UPDATE FOR FEATURED PRODUCTS COMPONENT
// Replace your existing liked case with this code:

import { LikedItemsService } from '@/lib/supabase/liked-items-service-robust';

// In your FeaturedProducts component, update the 'liked' case:

case 'liked':
  // Get liked products
  if (user) {
    setLoading(true);
    try {
      const likedProducts = await LikedItemsService.getLikedProducts(user.id);
      setProducts(likedProducts.slice(0, 6));
    } catch (error) {
      console.error('Error fetching liked products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  } else {
    setProducts([]);
  }
  break;

// Also update your like button handlers:
const handleLikeToggle = async (product: any) => {
  if (!user) {
    // Redirect to login or show login modal
    return;
  }

  try {
    const result = await LikedItemsService.toggleLike(user.id, product.id, 'product');
    
    if (!result.error) {
      // Update UI state
      setLikedProducts(prev => {
        const isLiked = result.isLiked;
        if (isLiked) {
          return [...prev, product];
        } else {
          return prev.filter(p => p.id !== product.id);
        }
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
  }
};

// And your initial like status check:
useEffect(() => {
  const checkLikeStatus = async () => {
    if (user && products.length > 0) {
      const likedProductIds = await LikedItemsService.getLikedItems(user.id)
        .then(items => items.map(item => item.item_id));
      
      setLikedProducts(prev => {
        return prev.map(product => ({
          ...product,
          isLiked: likedProductIds.includes(product.id)
        }));
      });
    }
  };
  
  if (user && products.length > 0) {
    checkLikeStatus();
  }
}, [user, products]);
