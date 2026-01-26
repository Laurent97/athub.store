import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EnhancedCategoryNavigation from "@/components/EnhancedCategoryNavigation";
import FeaturedProducts from "@/components/FeaturedProducts";
import TrustBadges from "@/components/TrustBadges";
import SupplierShowcase from "@/components/SupplierShowcase";
import PartnerCTA from "@/components/PartnerCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <TrustBadges />
        
        {/* Enhanced Category Navigation */}
        <section className="section-padding bg-background">
          <div className="container-wide">
            <EnhancedCategoryNavigation />
          </div>
        </section>
        
        <FeaturedProducts />
        <SupplierShowcase />
        <PartnerCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
