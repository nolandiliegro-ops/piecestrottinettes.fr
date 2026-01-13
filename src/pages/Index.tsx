import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
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
      <main className="pt-16 lg:pt-20">
        {/* 1. Hero Section + Bridge Button Container */}
        <div className="relative">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <HeroSection onActiveModelChange={handleActiveModelChange} />
          </motion.section>

          {/* BRIDGE BUTTON - Chevauchement 50/50 */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <button
              onClick={scrollToCompatibleParts}
              className="group relative flex items-center gap-3 lg:gap-4 
                         px-8 py-4 lg:px-10 lg:py-5 
                         bg-carbon text-greige 
                         font-display text-base lg:text-xl tracking-wide
                         rounded-full border border-white/10
                         shadow-[0_8px_32px_rgba(28,28,28,0.4)]
                         hover:shadow-[0_12px_48px_rgba(28,28,28,0.6)]
                         hover:scale-105 active:scale-100
                         transition-all duration-300"
            >
              {/* Glow Effect */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-mineral/20 to-garage/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
              
              <span className="relative z-10">DÉCOUVRIR LES PIÈCES</span>
              <ChevronDown className="relative z-10 w-5 h-5 lg:w-6 lg:h-6 animate-bounce" />
            </button>
          </motion.div>
        </div>

        {/* 2. Compatible Parts Section - avec padding-top pour le bridge */}
        <motion.section
          id="compatible-parts"
          className="pt-12 lg:pt-16 pb-8 lg:pb-12 scroll-mt-20"
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
