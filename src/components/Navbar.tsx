import { Link } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, X, ChevronDown, Heart, Package, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import NotificationsModal from "@/components/Notifications/NotificationsModal";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState("/");
  const { getItemCount } = useCart();
  const { user, userProfile, signOut } = useAuth();

  // Make notifications modal globally accessible
  useEffect(() => {
    (window as any).openNotificationsModal = () => setIsNotificationsOpen(true);
    (window as any).closeNotificationsModal = () => setIsNotificationsOpen(false);
    
    return () => {
      delete (window as any).openNotificationsModal;
      delete (window as any).closeNotificationsModal;
    };
  }, []);

  const navLinks = [
    { name: "Cars", href: "/products?category=cars" },
    { name: "Parts", href: "/products?category=parts" },
    { name: "Accessories", href: "/products?category=accessories" },
    { name: "Partner Shops", href: "/manufacturers" },
    { name: "Become a Partner", href: "#partner", action: "openModal" },
  ];

  // Update dashboard URL when user profile changes
  useEffect(() => {
    if (!user) {
      setDashboardUrl("/auth");
      return;
    }

    const userType = userProfile?.user_type || 'customer';

    if (userType === 'admin') {
      setDashboardUrl("/admin");
    } else if (userType === 'partner' || userProfile?.partner_status === 'approved') {
      // Route to partner dashboard if user is partner OR has approved partner profile
      setDashboardUrl("/partner/dashboard");
    } else {
      // For customers without partner profile, go home
      setDashboardUrl("/");
    }
  }, [user, userProfile]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container-wide">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="AutoTradeHub" className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="font-bold text-lg sm:text-xl text-foreground hidden xs:block">AutoTradeHub</span>
            <span className="font-bold text-base text-foreground xs:hidden">ATH</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              link.action === "openModal" ? (
                <Button 
                  key={link.name} 
                  variant="nav" 
                  size="sm" 
                  className="text-sm"
                  onClick={() => (window as any).openPartnerModal?.()}
                >
                  {link.name}
                </Button>
              ) : (
                <Link key={link.name} to={link.href}>
                  <Button variant="nav" size="sm" className="text-sm">
                    {link.name}
                  </Button>
                </Link>
              )
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2 sm:gap-3">
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-semibold animate-bounce-subtle">
                    {getItemCount()}
                  </span>
                )}
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground relative"
              onClick={() => setIsNotificationsOpen(true)}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"></span>
            </Button>
            <Link to="/liked-items">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
            {user && (
              <Link to="/my-orders">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="My Orders">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
            )}
            <ThemeSwitcher />
            {user ? (
              <div className="flex items-center gap-2">
                <Link to={dashboardUrl}>
                  <Button variant="outline" size="sm">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="hidden sm:inline">Dashboard</span>
                    <span className="sm:hidden">👤</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:inline">
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="accent" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-3 sm:py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                link.action === "openModal" ? (
                  <button
                    key={link.name}
                    onClick={() => {
                      (window as any).openPartnerModal?.();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-foreground hover:bg-secondary rounded-lg transition-colors text-sm sm:text-base"
                  >
                    {link.name}
                  </button>
                ) : (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className="px-3 sm:px-4 py-2 sm:py-3 text-foreground hover:bg-secondary rounded-lg transition-colors text-sm sm:text-base"
                  >
                    {link.name}
                  </Link>
                )
              ))}
              <div className="flex flex-col gap-2 px-3 sm:px-4 pt-3 sm:pt-4 border-t border-border mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/cart" className="flex-1">
                    <Button variant="outline" className="w-full gap-2 relative text-xs sm:text-sm">
                      <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                      Cart
                      {getItemCount() > 0 && (
                        <span className="absolute top-0 right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-semibold">
                          {getItemCount()}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 relative text-xs sm:text-sm"
                    onClick={() => setIsNotificationsOpen(true)}
                  >
                    <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                    Notif
                    <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-red-500"></span>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/liked-items" className="flex-1">
                    <Button variant="outline" className="w-full gap-2 text-xs sm:text-sm">
                      <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                      Liked
                    </Button>
                  </Link>
                  {user && (
                    <Link to="/my-orders" className="flex-1">
                      <Button variant="outline" className="w-full gap-2 text-xs sm:text-sm">
                        <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                        Orders
                      </Button>
                    </Link>
                  )}
                </div>
                {user ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Link to={dashboardUrl} className="flex-1">
                      <Button variant="outline" className="w-full gap-2 text-xs sm:text-sm">
                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button variant="ghost" className="flex-1 text-xs sm:text-sm" onClick={signOut}>
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Link to="/auth" className="flex-1">
                    <Button variant="accent" className="w-full text-xs sm:text-sm">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Notifications Modal */}
      <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />
    </nav>
  );
};

export default Navbar;
