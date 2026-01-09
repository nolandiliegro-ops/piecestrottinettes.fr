import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const HeroBranding = () => {
  return (
    <div className="flex flex-col justify-center h-full py-8 lg:py-0">
      {/* Subtitle */}
      <p className="text-sm tracking-[0.3em] text-muted-foreground font-medium mb-4 animate-fade-in">
        SPÉCIALISTE TROTTINETTES
      </p>

      {/* Giant Title Stack */}
      <div className="relative">
        <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl xl:text-9xl leading-[0.85] tracking-tight">
          <span className="block text-foreground animate-fade-in" style={{ animationDelay: "0.1s" }}>
            ROULE
          </span>
          <span className="block text-primary animate-fade-in" style={{ animationDelay: "0.2s" }}>
            RÉPARE
          </span>
          <span className="block text-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
            DURE
          </span>
        </h1>

        {/* Vertical Labels */}
        <div 
          className="hidden xl:flex absolute -left-16 top-1/2 -translate-y-1/2 flex-col items-center gap-2 text-xs tracking-[0.2em] text-muted-foreground"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg) translateY(50%)" }}
        >
          <span>QUALITÉ</span>
          <span className="text-primary">|</span>
          <span>PIÈCE</span>
          <span className="text-primary">|</span>
          <span>SERVICE</span>
        </div>
      </div>

      {/* Description */}
      <p className="mt-6 lg:mt-8 text-base lg:text-lg text-muted-foreground max-w-md animate-fade-in" style={{ animationDelay: "0.4s" }}>
        Trouvez les pièces détachées compatibles avec votre trottinette électrique. 
        Plus de 2000 références disponibles.
      </p>

      {/* CTA Button */}
      <div className="mt-6 lg:mt-8 animate-fade-in" style={{ animationDelay: "0.5s" }}>
        <Button 
          size="lg" 
          className="rounded-full px-8 py-6 font-display text-xl tracking-wide gap-2 hover:scale-105 transition-transform"
        >
          <Sparkles className="w-5 h-5" />
          Découvrir les pièces
        </Button>
      </div>
    </div>
  );
};

export default HeroBranding;
