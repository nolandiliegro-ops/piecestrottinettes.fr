import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ExpertJourneySection from "@/components/hero/ExpertJourneySection";
import CompatiblePartsSection from "@/components/CompatiblePartsSection";
import FavoritesSection from "@/components/home/FavoritesSection";
import ShopByCategorySection from "@/components/home/ShopByCategorySection";

const Index = () => {
  const [activeModelSlug, setActiveModelSlug] = useState<string | null>(null);
  const [activeModelName, setActiveModelName] = useState<string | null>(null);

  const handleActiveModelChange = useCallback((slug: string | null, name: string | null) => {
    setActiveModelSlug(slug);
    setActiveModelName(name);
  }, []);

  const scrollToCompatibleParts = () => {
    document.getElementById('compatible-parts')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-b from-[hsl(30_10%_97%)] via-[hsl(30_10%_96%)] to-[hsl(30_14%_95%)] watermark-brand"
    >
      {/* Header - Fixed at top */}
      <Header />
      
      {/* Main Content - Vertical Layout */}
      <main className="pt-16 lg:pt-20 pb-24 md:pb-0">
        {/* 1. Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <HeroSection onActiveModelChange={handleActiveModelChange} />
        </motion.section>

        {/* 2. Expert Journey Section - Mobile Only */}
        <ExpertJourneySection />

        {/* 3. Compatible Parts Section - Scroll Reveal */}
        <motion.section
          id="compatible-parts"
          className="pt-8 lg:pt-16 pb-8 lg:pb-12 scroll-mt-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <CompatiblePartsSection 
            activeModelSlug={activeModelSlug}
            activeModelName={activeModelName || undefined}
          />
        </motion.section>

        {/* 4. Shop By Category Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <ShopByCategorySection />
        </motion.section>

        {/* 5. Favorites Section - Last, only visible when logged in */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          <FavoritesSection />
        </motion.section>

        {/* Footer */}
        <Footer />
      </main>

      {/* Slogan - Premium Typography */}
      <motion.div
        className="fixed bottom-4 lg:bottom-8 left-4 lg:left-8 z-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div 
          className="px-4 py-2 lg:px-6 lg:py-3 rounded-full font-display text-sm lg:text-lg"
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(147,181,161,0.3)",
            boxShadow: "0 4px 20px rgba(147,181,161,0.2)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 0.9,
          }}
        >
          <span
            style={{
              background: "linear-gradient(135deg, #1A1A1A 0%, #93B5A1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ROULE · RÉPARE · DURE
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Index;
