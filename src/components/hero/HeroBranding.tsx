import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

const HeroBranding = () => {
  return (
    <div className="flex flex-col justify-start h-full">
      {/* Subtitle */}
      <p className="text-xs tracking-[0.3em] text-muted-foreground font-medium mb-2 animate-fade-in">
        SPÉCIALISTE TROTTINETTES
      </p>

      {/* Giant Title Stack - Reduced for balance */}
      <div className="relative">
        <h1 className="font-display text-5xl sm:text-6xl lg:text-[7rem] xl:text-[8rem] 2xl:text-[9rem] leading-[0.7] tracking-[-0.02em]">
          {/* ROULE avec ombre et label QUALITÉ */}
          <div className="relative flex items-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <span className="absolute left-1.5 top-0.5 text-muted-foreground/15 -z-10 select-none">ROULE</span>
            <span className="text-foreground">ROULE</span>
            <span 
              className="ml-1.5 lg:ml-2 text-[8px] lg:text-[10px] tracking-[0.2em] text-muted-foreground font-sans font-medium"
              style={{ writingMode: 'vertical-rl' }}
            >
              QUALITÉ
            </span>
          </div>
          
          {/* RÉPARE avec ombre et label PIÈCES */}
          <div className="relative flex items-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <span className="absolute left-1.5 top-0.5 text-muted-foreground/15 -z-10 select-none">RÉPARE</span>
            <span className="text-primary">RÉPARE</span>
            <span 
              className="ml-1.5 lg:ml-2 text-[8px] lg:text-[10px] tracking-[0.2em] text-muted-foreground font-sans font-medium"
              style={{ writingMode: 'vertical-rl' }}
            >
              PIÈCES
            </span>
          </div>
          
          {/* DURE avec ombre et label SERVICE */}
          <div className="relative flex items-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <span className="absolute left-1.5 top-0.5 text-muted-foreground/15 -z-10 select-none">DURE</span>
            <span className="text-foreground">DURE</span>
            <span 
              className="ml-1.5 lg:ml-2 text-[8px] lg:text-[10px] tracking-[0.2em] text-muted-foreground font-sans font-medium"
              style={{ writingMode: 'vertical-rl' }}
            >
              SERVICE
            </span>
          </div>
        </h1>
      </div>

      {/* Description - ENLARGED and permanent */}
      <p className="mt-5 lg:mt-6 text-lg lg:text-xl xl:text-2xl text-muted-foreground max-w-lg leading-relaxed animate-fade-in font-medium" style={{ animationDelay: "0.4s" }}>
        Trouvez les pièces détachées 100% compatibles avec votre trottinette électrique. Qualité garantie, expédition rapide.
      </p>

      {/* Bouton Catalogue Premium - LARGE avec micro-interactions */}
      <motion.div 
        className="mt-6 lg:mt-8 animate-fade-in" 
        style={{ animationDelay: "0.5s" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <Button 
          asChild 
          variant="outline" 
          size="lg" 
          className="rounded-full gap-3 px-6 lg:px-8 py-6 text-base lg:text-lg font-semibold border-mineral/40 hover:bg-mineral hover:text-white hover:border-mineral transition-all duration-300 shadow-md hover:shadow-[0_8px_30px_rgba(147,181,161,0.5)] whitespace-nowrap"
        >
          <Link to="/catalogue">
            <ShoppingBag className="w-5 h-5" />
            VOIR TOUT LE CATALOGUE
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default HeroBranding;
