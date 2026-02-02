import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, Car, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 py-8">
      <div className="container-wide">
        <div className="text-center">
          {/* Compact Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/20 text-white mb-4">
            <Building2 className="w-3 h-3" />
            <span className="text-xs font-semibold">B2B AUTOMOTIVE MARKETPLACE</span>
          </div>

          {/* Compact Heading */}
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Global Automotive Trading Hub
          </h1>

          {/* Compact Description */}
          <p className="text-blue-100 dark:text-blue-200 mb-6 max-w-2xl mx-auto text-sm">
            Connect with verified suppliers worldwide. Source vehicles and parts at wholesale prices.
          </p>

          {/* Compact Search Bar */}
          <div className="max-w-xl mx-auto mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-1 flex gap-1 border border-gray-200 dark:border-gray-700">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search vehicles, parts, suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full h-10 pl-10 pr-4 bg-transparent text-foreground dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border-0 focus:ring-0 outline-none text-sm"
                />
              </div>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-6 h-10 text-sm font-medium"
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>
          </div>

          {/* Compact Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/products">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 dark:border-white/90 dark:text-white/90 dark:hover:bg-white dark:hover:text-blue-700 font-medium gap-2 bg-white/10 hover:bg-white"
              >
                <Car className="w-4 h-4" />
                Browse Vehicles
              </Button>
            </Link>
            <Link to="/become-partner">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-2 border-white/80 text-white/90 hover:bg-white hover:text-blue-600 dark:border-white/70 dark:text-white/80 dark:hover:bg-white dark:hover:text-blue-700 font-medium bg-white/10 hover:bg-white"
              >
                Become a Supplier
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
