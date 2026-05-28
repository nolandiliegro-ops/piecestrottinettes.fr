import { Bike, Star } from "lucide-react";
import { getBrandColors } from "@/contexts/ScooterContext";
import type { ScooterHero } from "@/hooks/useHeroScooters";

interface Props {
  scooters: ScooterHero[];
  title: string;
  onSelect: (slug: string) => void;
  isLoading?: boolean;
  showStar?: boolean;
}

const HeroMiniCards = ({ scooters, title, onSelect, isLoading, showStar }: Props) => {
  return (
    <div>
      <style>{`
        .pt-mini-scroll::-webkit-scrollbar { display: none; }
        .pt-mini-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <h2
        className="px-1 mb-4 lg:mb-5 text-sm lg:text-base font-bold uppercase tracking-wider inline-flex items-center gap-2"
        style={{ color: "var(--token-global-text-primary, #1A1A1A)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {showStar && <Star className="w-4 h-4 fill-current" style={{ color: "#FF6600" }} />}
        {title}
      </h2>

      <div
        className="pt-mini-scroll flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:gap-3 lg:overflow-visible"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {isLoading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={`sk-${idx}`}
                className="flex-shrink-0 w-[150px] lg:w-auto rounded-2xl bg-white border border-black/10 overflow-hidden animate-pulse"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="aspect-square bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))
          : scooters.map((s) => {
              const brand = getBrandColors(s.brand_name);
              const count = s.compatible_parts_count ?? 0;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelect(s.slug)}
                  aria-label={`Voir ${s.name}`}
                  className="group flex-shrink-0 w-[150px] lg:w-auto text-left rounded-2xl bg-white border border-black/10 hover:border-black hover:-translate-y-1 hover:shadow-xl transition-all duration-200 overflow-hidden"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <div
                    className="relative aspect-square flex items-center justify-center p-3"
                    style={{ backgroundColor: "var(--token-brands-card-surround, #F5F0E8)" }}
                  >
                    {s.brand_name && (
                      <span
                        className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[10px] text-white font-bold uppercase tracking-wider"
                        style={{ backgroundColor: brand.accent, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {s.brand_name}
                      </span>
                    )}
                    {s.image_url ? (
                      <img
                        src={s.image_url}
                        alt={s.name}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <Bike className="w-12 h-12" style={{ color: "var(--token-global-text-secondary, #6B7280)" }} strokeWidth={1.2} />
                    )}
                  </div>
                  <div className="p-3">
                    <h3
                      className="text-base leading-tight"
                      style={{
                        fontFamily: "'Anton', sans-serif",
                        color: "var(--token-global-text-primary, #1A1A1A)",
                        letterSpacing: "-0.005em",
                        textTransform: "uppercase",
                      }}
                    >
                      {s.name}
                    </h3>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--token-global-text-secondary, #6B7280)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {count} pièce{count > 1 ? "s" : ""}
                    </p>
                  </div>
                </button>
              );
            })}

        {!isLoading && scooters.length === 0 && (
          <div
            className="w-full py-8 text-center text-sm"
            style={{ color: "var(--token-global-text-secondary, #6B7280)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Aucune trottinette trouvée.
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroMiniCards;
