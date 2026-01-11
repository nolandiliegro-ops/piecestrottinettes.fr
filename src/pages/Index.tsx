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
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Left Column - Hero Section (Carousel + Controls) */}
            <motion.div 
              className="lg:col-span-8 h-full rounded-3xl overflow-hidden relative"
              style={{
                background: "linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(26,26,26,0.98) 100%)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(147,181,161,0.1)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)"
              }}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-mineral/5 via-transparent to-transparent pointer-events-none" />
              
              <HeroSection onActiveModelChange={handleActiveModelChange} />
            </motion.div>

            {/* Right Column - Bento Discovery Grid */}
            <motion.div 
              className="lg:col-span-4 h-full rounded-3xl overflow-hidden relative"
              style={{
                background: "rgba(245,243,240,0.6)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.3)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)"
              }}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-gradient-to-tl from-mineral/10 via-transparent to-transparent pointer-events-none" />
              
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

      {/* Luxury Automotive Ambient Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Top gradient glow */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20"
          style={{
            background: "radial-gradient(ellipse at center, rgba(147,181,161,0.3) 0%, transparent 70%)",
            filter: "blur(60px)"
          }}
        />
        
        {/* Bottom ambient light */}
        <div 
          className="absolute bottom-0 right-1/4 w-[600px] h-[300px] opacity-10"
          style={{
            background: "radial-gradient(ellipse at center, rgba(26,26,26,0.5) 0%, transparent 70%)",
            filter: "blur(80px)"
          }}
        />
      </div>

      {/* Slogan - Floating badge */}
      <motion.div
        className="fixed bottom-8 left-8 z-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div 
          className="px-6 py-3 rounded-full font-display text-lg tracking-widest"
          style={{
            background: "rgba(26,26,26,0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(147,181,161,0.3)",
            color: "#93B5A1",
            boxShadow: "0 4px 20px rgba(147,181,161,0.2)"
          }}
        >
          ROULE RÉPARE DURE
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
