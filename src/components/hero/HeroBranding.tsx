import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const HeroBranding = () => {
  return (
    <div className="flex flex-col justify-center h-full">
      {/* Subtitle */}
      <p className="text-xs tracking-[0.3em] text-muted-foreground font-medium mb-2 animate-fade-in">
        SPÉCIALISTE TROTTINETTES
      </p>

      {/* Giant Title Stack - Monumental Typography */}
      <div className="relative">
        <h1 className="font-display text-6xl sm:text-7xl lg:text-[8rem] xl:text-[10rem] leading-[0.70] tracking-[-0.02em]">
          {/* ROULE avec ombre et label QUALITÉ */}
          <div className="relative flex items-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <span className="absolute left-2 top-1 text-muted-foreground/15 -z-10 select-none">ROULE</span>
            <span className="text-foreground">ROULE</span>
            <span 
              className="ml-3 lg:ml-4 text-[10px] lg:text-xs tracking-[0.2em] text-muted-foreground font-sans font-medium"
              style={{ writingMode: 'vertical-rl' }}
            >
              QUALITÉ
            </span>
          </div>
          
          {/* RÉPARE avec ombre et label PIÈCES */}
          <div className="relative flex items-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <span className="absolute left-2 top-1 text-muted-foreground/15 -z-10 select-none">RÉPARE</span>
            <span className="text-primary">RÉPARE</span>
            <span 
              className="ml-3 lg:ml-4 text-[10px] lg:text-xs tracking-[0.2em] text-muted-foreground font-sans font-medium"
              style={{ writingMode: 'vertical-rl' }}
            >
              PIÈCES
            </span>
          </div>
          
          {/* DURE avec ombre et label SERVICE */}
          <div className="relative flex items-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <span className="absolute left-2 top-1 text-muted-foreground/15 -z-10 select-none">DURE</span>
            <span className="text-foreground">DURE</span>
            <span 
              className="ml-3 lg:ml-4 text-[10px] lg:text-xs tracking-[0.2em] text-muted-foreground font-sans font-medium"
              style={{ writingMode: 'vertical-rl' }}
            >
              SERVICE
            </span>
          </div>
        </h1>
      </div>

      {/* Description */}
      <p className="mt-4 lg:mt-5 text-sm lg:text-base text-muted-foreground max-w-md animate-fade-in" style={{ animationDelay: "0.4s" }}>
        Trouvez les pièces détachées compatibles avec votre trottinette électrique. 
        Plus de 2000 références disponibles.
      </p>

      {/* CTA Button - General catalogue */}
      <div className="mt-4 lg:mt-5 animate-fade-in" style={{ animationDelay: "0.5s" }}>
        <Button 
          size="lg" 
          className="rounded-full px-6 py-5 font-display text-lg tracking-wide gap-2 hover:scale-105 transition-transform"
        >
          <Sparkles className="w-5 h-5" />
          Découvrir les pièces
        </Button>
      </div>
    </div>
  );
};

export default HeroBranding;
