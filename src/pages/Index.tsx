import SEO from "@/components/SEO";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSearchFirst from "@/components/home/HeroSearchFirst";
import ExpertJourneySection from "@/components/hero/ExpertJourneySection";
import BrandGrid from "@/components/home/BrandGrid";
import GarageRiderCard from "@/components/home/GarageRiderCard";
import Divider from "@/components/home/Divider";
import ScooterCarousel from "@/components/home/ScooterCarousel";
import ShopByCategorySection from "@/components/home/ShopByCategorySection";
import FavoritesSection from "@/components/home/FavoritesSection";
import TrustStrip from "@/components/home/TrustStrip";

const Index = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: "#F5F0E8" }}
    >
      <SEO
        title="Pièces Trottinette Électrique | Trouve ta pièce compatible — piècestrottinettes.fr"
        description="Plus jamais la mauvaise pièce. Sélectionne ton modèle (Dualtron, Kaabo, Ninebot, Kukirin, Segway) et achète des pièces 100% compatibles. Expédition 24h, méca pro."
        canonical="https://piecestrottinettes.fr/"
      />

      <div
        aria-hidden
        className="absolute inset-x-0 top-[35%] pointer-events-none overflow-hidden z-0 select-none"
      >
        <span
          className="block text-center whitespace-nowrap"
          style={{
            fontFamily: "'Anton', 'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(80px, 12vw, 220px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "rgba(26, 26, 26, 0.04)",
          }}
        >
          PIECESTROTTINETTES
        </span>
      </div>

      <Header />

      <main className="relative z-10 pt-16 lg:pt-20 pb-24 md:pb-0">
        <HeroSearchFirst />
        <ExpertJourneySection />
        <BrandGrid />
        <GarageRiderCard />
        <Divider />
        <ScooterCarousel />
        <ShopByCategorySection />
        <FavoritesSection />
        <TrustStrip />
        <Footer />
      </main>

      <motion.div
        className="fixed bottom-4 lg:bottom-8 left-4 lg:left-8 z-40 pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div
          className="px-4 py-2 lg:px-6 lg:py-3 rounded-full text-sm lg:text-lg"
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(74,124,89,0.3)",
            boxShadow: "0 4px 20px rgba(74,124,89,0.2)",
            fontFamily: "'Anton', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.04em",
            lineHeight: 1,
            color: "#1A1A1A",
            textTransform: "uppercase",
          }}
        >
          Roule · Répare · Dure
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Index;
