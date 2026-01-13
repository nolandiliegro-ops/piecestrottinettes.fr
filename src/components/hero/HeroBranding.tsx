import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

const HeroBranding = () => {
  return (
    <div className="flex flex-col justify-start h-full">
      {/* Subtitle */}
      <p className="text-xs tracking-[0.3em] text-muted-foreground font-medium mb-2 animate-fade-in">
        SPÉCIALISTE TROTTINETTES
      </p>

      {/* Giant Title Stack - MAXIMUM Impact Typography */}
      <div className="relative">
        <h1 className="font-display text-6xl sm:text-7xl lg:text-[10rem] xl:text-[12rem] 2xl:text-[14rem] leading-[0.65] tracking-[-0.02em]">
          {/* ROULE avec ombre et label QUALITÉ */}
          <div className="relative flex items-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <span className="absolute left-2 top-1 text-muted-foreground/15 -z-10 select-none">ROULE</span>
            <span className="text-foreground">ROULE</span>
            <span 
              className="ml-2 lg:ml-3 text-[9px] lg:text-[11px] tracking-[0.2em] text-muted-foreground font-sans font-medium"
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
              className="ml-2 lg:ml-3 text-[9px] lg:text-[11px] tracking-[0.2em] text-muted-foreground font-sans font-medium"
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
              className="ml-2 lg:ml-3 text-[9px] lg:text-[11px] tracking-[0.2em] text-muted-foreground font-sans font-medium"
              style={{ writingMode: 'vertical-rl' }}
            >
              SERVICE
            </span>
          </div>
        </h1>
      </div>

      {/* Description - more compact */}
      <p className="mt-3 lg:mt-4 text-sm text-muted-foreground max-w-sm animate-fade-in" style={{ animationDelay: "0.4s" }}>
        Trouvez les pièces détachées 100% compatibles avec votre trottinette électrique. Qualité garantie, expédition rapide.
      </p>

      {/* Bouton Catalogue Produit */}
      <div className="mt-4 animate-fade-in" style={{ animationDelay: "0.5s" }}>
        <Button asChild variant="outline" className="rounded-full gap-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
          <Link to="/catalogue">
            <ShoppingBag className="w-4 h-4" />
            Catalogue Produit
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default HeroBranding;
