import { useRef } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { optimizedImage } from "@/lib/imageTransform";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface BrandBentoGridProps {
  brands: Brand[];
  activeBrand: string | null;
  onBrandChange: (brandSlug: string | null) => void;
  isLoading?: boolean;
  /** brand slug -> photo d'un modèle publié de la marque */
  covers?: Record<string, string | undefined>;
  /** brand slug -> nombre de modèles publiés */
  counts?: Record<string, number>;
}

// Carrousel horizontal des marques : swipe au doigt sur mobile, flèches sur desktop.
// Une seule rangée au lieu d'un mur de 38 tuiles.
const BrandBentoGrid = ({
  brands,
  activeBrand,
  onBrandChange,
  isLoading = false,
  covers = {},
  counts = {},
}: BrandBentoGridProps) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="w-32 md:w-40 shrink-0 aspect-[4/5] rounded-2xl" />
        ))}
      </div>
    );
  }

  const tileBase =
    "relative w-32 md:w-40 shrink-0 snap-start aspect-[4/5] rounded-2xl overflow-hidden text-left transition-shadow duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-mineral";

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Marques précédentes"
        onClick={() => scrollBy(-1)}
        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center rounded-full bg-white shadow-md hover:shadow-xl transition-shadow"
      >
        <ChevronLeft className="w-5 h-5 text-carbon" />
      </button>
      <button
        type="button"
        aria-label="Marques suivantes"
        onClick={() => scrollBy(1)}
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center rounded-full bg-white shadow-md hover:shadow-xl transition-shadow"
      >
        <ChevronRight className="w-5 h-5 text-carbon" />
      </button>

      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 px-1 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Toutes */}
        <button
          type="button"
          onClick={() => onBrandChange(null)}
          aria-pressed={activeBrand === null}
          className={cn(
            tileBase,
            "bg-carbon shadow-md hover:shadow-xl",
            activeBrand === null && "ring-2 ring-mineral ring-offset-2 ring-offset-greige"
          )}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <LayoutGrid className="w-10 h-10 text-white/80" />
          </div>
          <div
            className={cn(
              "absolute bottom-0 inset-x-0 px-3 py-2",
              activeBrand === null ? "bg-mineral" : "bg-white/95"
            )}
          >
            <span
              className={cn(
                "font-montserrat font-bold text-sm uppercase tracking-wide",
                activeBrand === null ? "text-white" : "text-carbon"
              )}
            >
              Toutes
            </span>
          </div>
        </button>

        {brands.map((brand) => {
          const isActive = activeBrand === brand.slug;
          const cover = covers[brand.slug];
          const count = counts[brand.slug];
          return (
            <button
              key={brand.id}
              type="button"
              onClick={() => onBrandChange(isActive ? null : brand.slug)}
              aria-pressed={isActive}
              className={cn(
                tileBase,
                "bg-white shadow-md hover:shadow-xl",
                isActive && "ring-2 ring-mineral ring-offset-2 ring-offset-greige"
              )}
            >
              {cover ? (
                <img
                  src={optimizedImage(cover, 240)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-contain p-3 pb-12"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center pb-10 font-display text-xl text-carbon/30 text-center px-2">
                  {brand.name}
                </span>
              )}

              {brand.logo_url && (
                <img
                  src={brand.logo_url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute top-2 left-2 h-6 max-w-[60%] object-contain"
                />
              )}

              <div
                className={cn(
                  "absolute bottom-0 inset-x-0 px-3 py-2",
                  isActive ? "bg-mineral" : "bg-white/95 border-t border-gray-100"
                )}
              >
                <span
                  className={cn(
                    "block font-montserrat font-bold text-sm uppercase tracking-wide truncate",
                    isActive ? "text-white" : "text-carbon"
                  )}
                >
                  {brand.name}
                </span>
                {count ? (
                  <span className={cn("block text-sm", isActive ? "text-white/80" : "text-gray-500")}>
                    {count} modèle{count > 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BrandBentoGrid;
