import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import CompatiblePartsSection from "@/components/CompatiblePartsSection";
import FavoritesSection from "@/components/home/FavoritesSection";
import { useBrands, useScooterModels } from "@/hooks/useScooterData";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [activeModelSlug, setActiveModelSlug] = useState<string | null>(null);
  const [activeModelName, setActiveModelName] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hasTriedRefetch = useRef(false);

  // 📊 TÉLÉMÉTRIE CATALOGUE - Debug showroom vide
  const { data: brands, isLoading: brandsLoading, error: brandsError } = useBrands();
  const { data: models, isLoading: modelsLoading, error: modelsError } = useScooterModels(null);
  
  useEffect(() => {
    console.log('📦 État du catalogue:', {
      brandsCount: brands?.length || 0,
      modelsCount: models?.length || 0,
      brandsLoading,
      modelsLoading,
      brandsError: brandsError?.message || null,
      modelsError: modelsError?.message || null,
      userConnected: !!user,
    });
  }, [brands, models, brandsLoading, modelsLoading, brandsError, modelsError, user]);

  // 🔄 AUTO-REFETCH si user connecté mais catalogue vide
  useEffect(() => {
    const brandsCount = brands?.length || 0;
    const modelsCount = models?.length || 0;
    
    // Conditions: user connecté, chargement terminé, catalogue vide, pas encore essayé
    if (user && !brandsLoading && !modelsLoading && !hasTriedRefetch.current) {
      if (brandsCount === 0 || modelsCount === 0) {
        console.warn('[Index] ⚠️ Catalogue vide malgré session valide');
        console.warn('[Index] 🔄 Force refetch dans 500ms...');
        hasTriedRefetch.current = true;
        
        setTimeout(() => {
          console.log('[Index] 🔄 Exécution refetchQueries...');
          queryClient.refetchQueries({ queryKey: ['brands'] });
          queryClient.refetchQueries({ queryKey: ['scooter_models'] });
          queryClient.refetchQueries({ queryKey: ['all_parts'] });
        }, 500);
      }
    }
  }, [user, brands, models, brandsLoading, modelsLoading, queryClient]);

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
