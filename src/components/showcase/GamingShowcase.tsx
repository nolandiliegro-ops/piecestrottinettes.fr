import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import GamingProductCard from "./GamingProductCard";
import GamingThumbnails from "./GamingThumbnails";

interface Part {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  difficulty_level: number | null;
}

interface GamingShowcaseProps {
  parts: Part[];
  activeModelName?: string;
  isLoading?: boolean;
}

const GamingShowcaseSkeleton = () => (
  <div 
    className="relative w-full rounded-2xl overflow-hidden"
    style={{
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
      minHeight: "650px",
    }}
  >
    <div className="flex flex-col items-center justify-center h-full py-16">
      <Skeleton className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full bg-white/5" />
      <Skeleton className="w-64 h-8 mt-6 bg-white/5" />
      <Skeleton className="w-32 h-12 mt-4 bg-white/5" />
    </div>
  </div>
);

const GamingShowcase = ({ parts, activeModelName, isLoading }: GamingShowcaseProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? parts.length - 1 : prev - 1));
  }, [parts.length]);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === parts.length - 1 ? 0 : prev + 1));
  }, [parts.length]);

  const goToIndex = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  if (isLoading) {
    return <GamingShowcaseSkeleton />;
  }

  if (parts.length === 0) {
    return (
      <div 
        className="relative w-full rounded-2xl overflow-hidden flex flex-col items-center justify-center py-20"
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
          minHeight: "400px",
        }}
      >
        <Sparkles className="w-16 h-16 text-mineral mb-4" />
        <p className="text-white/60 text-lg">Aucune pièce compatible trouvée</p>
      </div>
    );
  }

  const currentPart = parts[currentIndex];

  return (
    <div 
      className="relative w-full rounded-2xl overflow-hidden gaming-showcase-container"
      style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
        minHeight: "600px",
      }}
    >
      {/* Neon Grid Background */}
      <div className="gaming-grid-bg" />

      {/* Header with model name */}
      {activeModelName && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-0 right-0 text-center z-10"
        >
          <span className="text-white/40 text-sm uppercase tracking-widest">
            Pour votre
          </span>
          <h3 className="text-white font-display text-lg md:text-xl tracking-wide">
            {activeModelName}
          </h3>
        </motion.div>
      )}

      {/* Navigation Arrow Left */}
      <motion.button
        onClick={goToPrev}
        className="absolute left-2 md:left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 gaming-nav-btn"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Produit précédent"
      >
        <div 
          className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 flex items-center justify-center rounded-full transition-all duration-300"
          style={{
            background: "rgba(147, 181, 161, 0.1)",
            border: "2px solid rgba(147, 181, 161, 0.4)",
            boxShadow: "0 0 20px rgba(147, 181, 161, 0.2), inset 0 0 20px rgba(147, 181, 161, 0.1)",
          }}
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-mineral" />
        </div>
      </motion.button>

      {/* Navigation Arrow Right */}
      <motion.button
        onClick={goToNext}
        className="absolute right-2 md:right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 gaming-nav-btn"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Produit suivant"
      >
        <div 
          className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 flex items-center justify-center rounded-full transition-all duration-300"
          style={{
            background: "rgba(147, 181, 161, 0.1)",
            border: "2px solid rgba(147, 181, 161, 0.4)",
            boxShadow: "0 0 20px rgba(147, 181, 161, 0.2), inset 0 0 20px rgba(147, 181, 161, 0.1)",
          }}
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-mineral" />
        </div>
      </motion.button>

      {/* Main Product Display */}
      <div className="relative pt-16 pb-8 md:pt-20 min-h-[550px] md:min-h-[600px] flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <GamingProductCard 
            key={currentPart.id}
            part={currentPart}
            direction={direction}
          />
        </AnimatePresence>
      </div>

      {/* Thumbnails Navigation */}
      <div className="pb-6">
        <GamingThumbnails
          parts={parts}
          currentIndex={currentIndex}
          onSelect={goToIndex}
        />
      </div>

      {/* Counter */}
      <div className="absolute bottom-4 right-4 text-white/30 text-sm font-mono">
        {currentIndex + 1} / {parts.length}
      </div>
    </div>
  );
};

export default GamingShowcase;
