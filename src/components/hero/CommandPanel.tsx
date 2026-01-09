import { Search, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brand } from "@/data/scooterData";

interface CommandPanelProps {
  brands: Brand[];
  selectedBrand: string | null;
  onBrandSelect: (brandId: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const CommandPanel = ({
  brands,
  selectedBrand,
  onBrandSelect,
  searchQuery,
  onSearchChange,
}: CommandPanelProps) => {
  return (
    <div className="flex flex-col justify-center h-full py-8 lg:py-0 space-y-8">
      {/* Section Title */}
      <div className="animate-fade-in">
        <p className="text-sm tracking-[0.2em] text-muted-foreground font-medium mb-2">
          ÉTAPE 1
        </p>
        <h2 className="font-display text-2xl lg:text-3xl text-foreground">
          Identifiez votre trottinette
        </h2>
      </div>

      {/* Search Bar */}
      <div className="relative animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="glass rounded-2xl p-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Modèle, marque..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 pr-4 py-6 text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
      </div>

      {/* Brand Selection */}
      <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <p className="text-sm text-muted-foreground mb-3">Ou sélectionnez une marque</p>
        <div className="flex flex-wrap gap-2">
          {/* All Brands Option */}
          <button
            onClick={() => onBrandSelect(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedBrand === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Toutes
          </button>
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => onBrandSelect(brand.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedBrand === brand.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <p className="text-sm tracking-[0.15em] text-muted-foreground font-medium">
            ACCÈS RAPIDE
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Scanner Button - Pill with pulse glow */}
          <Button
            className="rounded-full px-6 py-5 font-display text-lg tracking-wide gap-2 pulse-glow rotate-[-2deg] hover:rotate-0 transition-transform"
          >
            <Sparkles className="w-5 h-5" />
            Scanner
          </Button>

          {/* Decorative Star */}
          <div className="text-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L13.5 10.5L24 12L13.5 13.5L12 24L10.5 13.5L0 12L10.5 10.5L12 0Z" />
            </svg>
          </div>

          {/* Mon Garage Button - Outline pill */}
          <Button
            variant="outline"
            className="rounded-full px-6 py-5 font-display text-lg tracking-wide border-2 border-foreground text-foreground hover:bg-foreground hover:text-background rotate-[2deg] hover:rotate-0 transition-all"
          >
            Mon Garage
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommandPanel;
