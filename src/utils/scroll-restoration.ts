import { useState, useEffect } from 'react';

// Scroll restoration utility for consistent page navigation
// Ensures pages always start at the top when navigating

export const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  try {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior
    });
  } catch (error) {
    // Fallback for older browsers
    window.scrollTo(0, 0);
  }
};

export const useScrollToTop = (dependencies: any[] = [], behavior: ScrollBehavior = 'smooth') => {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      scrollToTop(behavior);
      setHasScrolled(true);
    }, 100);

    return () => clearTimeout(timer);
  }, dependencies);

  return hasScrolled;
};

// Hook for product detail pages specifically
export const useProductScrollToTop = (productId: string | undefined, isLoading: boolean) => {
  useEffect(() => {
    // Scroll when product ID changes
    if (productId) {
      scrollToTop('smooth');
    }
  }, [productId]);

  useEffect(() => {
    // Scroll again when loading completes to ensure we're at top
    if (!isLoading && productId) {
      const timer = setTimeout(() => {
        scrollToTop('smooth');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, productId]);
};

// Global scroll restoration for route changes
export const setupGlobalScrollRestoration = () => {
  // Override default browser scroll restoration
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // Listen for navigation events
  let lastScrollPosition = 0;

  const handleBeforeUnload = () => {
    lastScrollPosition = window.scrollY;
  };

  const handleLoad = () => {
    // Only restore scroll if it's a page refresh, not navigation
    if (performance.navigation.type === 1) { // 1 = TYPE_RELOAD
      window.scrollTo(0, lastScrollPosition);
    } else {
      scrollToTop('instant');
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('load', handleLoad);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('load', handleLoad);
  };
};
