import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ExpertJourneySection from "@/components/hero/ExpertJourneySection";
import CompatiblePartsSection from "@/components/CompatiblePartsSection";
import FavoritesSection from "@/components/home/FavoritesSection";

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
    <div className="min-h-screen bg-gradient-to-b from-[hsl(30_10%_97%)] via-[hsl(30_10%_96%)] to-[hsl(30_14%_95%)] watermark-brand">
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

        {/* 3. Compatible Parts Section - avec padding-top pour le bridge */}
        <motion.section
          id="compatible-parts"
          className="pt-8 lg:pt-16 pb-8 lg:pb-12 scroll-mt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        >
          <CompatiblePartsSection 
            activeModelSlug={activeModelSlug}
            activeModelName={activeModelName || undefined}
          />
        </motion.section>

        {/* 4. Favorites Section - Last, only visible when logged in */}
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

      {/* Slogan - Smaller on mobile */}
      <motion.div
        className="fixed bottom-4 lg:bottom-8 left-4 lg:left-8 z-50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div 
          className="px-3 py-1.5 lg:px-5 lg:py-2.5 rounded-full font-display text-xs lg:text-base tracking-widest"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(147,181,161,0.25)",
            color: "#93B5A1",
            boxShadow: "0 2px 12px rgba(147,181,161,0.15)"
          }}
        >
          ROULE RÉPARE DURE
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
