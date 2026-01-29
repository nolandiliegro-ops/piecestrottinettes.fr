import { motion } from "framer-motion";
import { Sparkles, ShieldCheck } from "lucide-react";
import GamingCarousel from "./showcase/GamingCarousel";
import { useCompatibleParts, useCompatiblePartsCount } from "@/hooks/useScooterData";
import { getBrandColors } from "@/contexts/ScooterContext";
import { cn } from "@/lib/utils";

interface CompatiblePartsSectionProps {
  activeModelSlug: string | null;
  activeModelName?: string;
  activeBrandSlug?: string;
  compatiblePartsCount?: number;
}

const CompatiblePartsSection = ({ 
  activeModelSlug, 
  activeModelName,
  activeBrandSlug,
  compatiblePartsCount
}: CompatiblePartsSectionProps) => {
  const { data: parts = [], isLoading } = useCompatibleParts(activeModelSlug, 12);
  // Use prop if provided, otherwise fetch internally
  const { data: fetchedCount = 0 } = useCompatiblePartsCount(
    compatiblePartsCount === undefined ? activeModelSlug : null
  );
  const totalCount = compatiblePartsCount ?? fetchedCount;
  
  // Get brand-specific colors
  const brandColors = getBrandColors(activeBrandSlug);
  
  // Parse brand and model from activeModelName ("Dualtron Thunder" → ["Dualtron", "Thunder"])
  const nameParts = (activeModelName || '').split(' ');
  const brandName = nameParts[0] || '';
  const modelName = nameParts.slice(1).join(' ') || '';

  if (!activeModelSlug) {
    return (
      <div className="w-full px-4 md:px-10 lg:px-20">
        <motion.div
          className="flex flex-col items-center justify-center py-16 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles className="w-12 h-12 text-mineral mx-auto mb-3" />
          <h2 className="font-display text-2xl lg:text-3xl text-carbon mb-2">
            PIÈCES COMPATIBLES
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Sélectionnez un modèle de trottinette pour découvrir les pièces compatibles
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header - Compact Horizontal Layout */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-4 lg:mb-6 px-4 md:px-10 lg:px-20"
      >
        {/* Desktop: Single Horizontal Line */}
        <div className="hidden lg:flex items-center justify-center gap-3 flex-wrap">
          {/* Count with Brand Color */}
          <div className="flex items-center gap-2">
            <span 
              className="font-display text-3xl font-bold"
              style={{ color: brandColors.accent }}
            >
              {totalCount}
            </span>
            <span className="font-display text-xl text-carbon uppercase tracking-wide">
              PIÈCES CERTIFIÉES
            </span>
          </div>
          
          {/* Dot Separator */}
          <span className="text-muted-foreground/40 text-xl">•</span>
          
          {/* Badge 100% Compatible - Compact Pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mineral/15 border border-mineral/30"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-mineral" />
            <span className="text-[11px] font-semibold text-mineral uppercase tracking-wide">
              100% Compatible
            </span>
          </motion.div>
          
          {/* Dot Separator */}
          <span className="text-muted-foreground/40 text-xl">•</span>
          
          {/* Target Model with Brand Color */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground uppercase tracking-wide">
              Pour votre
            </span>
            <span 
              className="font-bold uppercase tracking-wide text-lg"
              style={{ color: brandColors.accent }}
            >
              {brandName}
            </span>
            <span className="font-display text-lg text-carbon">
              {modelName}
            </span>
          </div>
        </div>

        {/* Mobile: Two Compact Lines */}
        <div className="lg:hidden flex flex-col items-center gap-2">
          {/* Line 1: Count + Badge */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span 
                className="font-display text-2xl font-bold"
                style={{ color: brandColors.accent }}
              >
                {totalCount}
              </span>
              <span className="font-display text-sm text-carbon uppercase">
                PIÈCES
              </span>
            </div>
            
            <span className="text-muted-foreground/40">•</span>
            
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-mineral/15 border border-mineral/30">
              <ShieldCheck className="w-3 h-3 text-mineral" />
              <span className="text-[9px] font-semibold text-mineral uppercase tracking-wide">
                Compatible
              </span>
            </div>
          </div>
          
          {/* Line 2: Target Model */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Pour votre</span>
            <span 
              className="text-sm font-bold uppercase"
              style={{ color: brandColors.accent }}
            >
              {brandName}
            </span>
            <span className="text-sm font-display text-carbon">
              {modelName}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Gaming Carousel - Full Width */}
      <GamingCarousel 
        parts={parts}
        activeModelName={activeModelName}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CompatiblePartsSection;
