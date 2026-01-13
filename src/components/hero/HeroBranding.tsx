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

      {/* Description - LARGER for impact */}
      <p className="mt-4 lg:mt-5 text-base lg:text-lg text-muted-foreground max-w-md animate-fade-in" style={{ animationDelay: "0.4s" }}>
        Trouvez les pièces détachées 100% compatibles avec votre trottinette électrique. Qualité garantie, expédition rapide.
      </p>

      {/* Bouton Catalogue Premium - Large */}
      <div className="mt-5 animate-fade-in" style={{ animationDelay: "0.5s" }}>
        <Button asChild variant="outline" size="lg" className="rounded-full gap-2.5 px-6 py-5 text-base font-medium border-mineral/40 hover:bg-mineral hover:text-white hover:border-mineral transition-all shadow-sm hover:shadow-md">
          <Link to="/catalogue">
            <ShoppingBag className="w-5 h-5" />
            VOIR TOUT LE CATALOGUE
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default HeroBranding;
