import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BentoDiscoverySection from "@/components/BentoDiscoverySection";

const Index = () => {
  const [activeModelSlug, setActiveModelSlug] = useState<string | null>(null);
  const [activeModelName, setActiveModelName] = useState<string | null>(null);

  const handleActiveModelChange = useCallback((slug: string | null, name: string | null) => {
    setActiveModelSlug(slug);
    setActiveModelName(name);
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-greige">
      {/* Header - Fixed at top */}
      <Header />
      
      {/* Bento Grid Layout - 100vh, Zero Scroll */}
      <main className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8 h-full">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Left Column - Hero Section (Carousel + Controls) */}
            <motion.div 
              className="lg:col-span-8 h-full rounded-3xl overflow-hidden relative"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(250,250,250,0.95) 100%)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(147,181,161,0.15)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
              }}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-mineral/5 via-transparent to-transparent pointer-events-none" />
              
              <HeroSection onActiveModelChange={handleActiveModelChange} />
            </motion.div>

            {/* Right Column - Bento Discovery Grid */}
            <motion.div 
              className="lg:col-span-4 h-full rounded-3xl overflow-hidden relative"
              style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(147,181,161,0.2)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
              }}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-tl from-mineral/8 via-transparent to-transparent pointer-events-none" />
              
              <div className="relative h-full overflow-y-auto scrollbar-hide p-6">
                <BentoDiscoverySection 
                  activeModelSlug={activeModelSlug} 
                  activeModelName={activeModelName || undefined}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Subtle ambient effects - much softer */}
      <div className="fixed inset-0 pointer-events-none">
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
          className="px-5 py-2.5 rounded-full font-display text-base tracking-widest"
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
