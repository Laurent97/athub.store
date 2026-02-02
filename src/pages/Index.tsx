import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EndlessCarGallery from "@/components/EndlessCarGallery";
import TrustBadges from "@/components/TrustBadges";
import PartnerCTA from "@/components/PartnerCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <EndlessCarGallery />
        <TrustBadges />
        <PartnerCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
