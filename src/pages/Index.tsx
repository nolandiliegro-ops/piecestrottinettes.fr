import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
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

  return (
    <div className="min-h-screen bg-greige">
      {/* Header - Fixed at top */}
      <Header />
      
      {/* Main Content - Vertical Layout */}
      <main className="pt-16 lg:pt-20">
        {/* Hero Section - Full Width */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <HeroSection onActiveModelChange={handleActiveModelChange} />
        </motion.section>

        {/* Favorites Section - Only visible when logged in */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        >
          <FavoritesSection />
        </motion.section>

        {/* Compatible Parts Section - Below Hero */}
        <motion.section
          className="py-12 lg:py-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <CompatiblePartsSection 
            activeModelSlug={activeModelSlug} 
            activeModelName={activeModelName || undefined}
          />
        </motion.section>
      </main>

      {/* Subtle ambient effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        {/* Top subtle glow */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-10"
          style={{
            background: "radial-gradient(ellipse at center, rgba(147,181,161,0.2) 0%, transparent 70%)",
            filter: "blur(40px)"
          }}
        />
      </div>

      {/* Slogan - Refined badge */}
      <motion.div
        className="fixed bottom-8 left-8 z-50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div 
          className="px-5 py-2.5 rounded-full font-display text-sm lg:text-base tracking-widest"
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
