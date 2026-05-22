import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BrandWithCount {
  slug: string;
  name: string;
  count: number;
}

const BRAND_CONFIG: Record<string, { color: string; tagline: string }> = {
  dualtron: { color: "#FF6B35", tagline: "Performance" },
  kaabo:    { color: "#1A1A1A", tagline: "Tout-terrain" },
  segway:   { color: "#0066CC", tagline: "Urbain" },
  xiaomi:   { color: "#FF6900", tagline: "Daily" },
  kukirin:  { color: "#8B5CF6", tagline: "Gaming" },
  ninebot:  { color: "#10B981", tagline: "Pliable" },
};

// Marques affichées en home. Ne lister que des marques avec published=true en BDD,
// sinon clic = 404 sur /marque/:slug. Ajouter kukirin quand publiée.
const FEATURED_BRAND_SLUGS = ["dualtron", "kaabo", "segway", "xiaomi", "ninebot"];

const useBrandsWithCount = () =>
  useQuery({
    queryKey: ["home_brands_with_count"],
    queryFn: async (): Promise<BrandWithCount[]> => {
      const { data: brands, error: brandsErr } = await supabase
        .from("brands")
        .select("id, name, slug")
        .in("slug", FEATURED_BRAND_SLUGS);
      if (brandsErr) throw brandsErr;

      const { data: models, error: modelsErr } = await supabase
        .from("scooter_models")
        .select("brand_id")
        .eq("published", true);
      if (modelsErr) throw modelsErr;

      const counts = new Map<string, number>();
      (models || []).forEach((m) => {
        if (m.brand_id) counts.set(m.brand_id, (counts.get(m.brand_id) || 0) + 1);
      });

      return FEATURED_BRAND_SLUGS.map((slug) => {
        const brand = brands?.find((b) => b.slug === slug);
        return {
          slug,
          name: brand?.name ?? slug.charAt(0).toUpperCase() + slug.slice(1),
          count: brand ? counts.get(brand.id) || 0 : 0,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

const BrandGrid = () => {
  const navigate = useNavigate();
  const { data: brands = [], isLoading } = useBrandsWithCount();

  return (
    <section className="px-4 py-10 lg:py-14" style={{ backgroundColor: "#F5F0E8" }}>
      <div className="mx-auto max-w-5xl">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-7 lg:mb-10">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.25em] mb-2"
              style={{ color: "#6B7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              — OU EXPLORE PAR MARQUE
            </p>
            <h2
              className="text-3xl lg:text-5xl leading-none tracking-tight uppercase"
              style={{ fontFamily: "'Anton', sans-serif", color: "#1A1A1A" }}
            >
              Choisis ta marque
            </h2>
          </div>

          <button
            onClick={() => navigate("/catalogue")}
            className="hidden lg:inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider underline underline-offset-4 hover:decoration-2 transition-all"
            style={{ color: "#1A1A1A", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Toutes les marques
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {brands.map((brand) => {
            const cfg = BRAND_CONFIG[brand.slug] ?? { color: "#6B7280", tagline: "" };
            return (
              <button
                key={brand.slug}
                onClick={() => navigate(`/marque/${brand.slug}`)}
                aria-label={`Voir les pièces ${brand.name}`}
                className="group relative aspect-square rounded-2xl bg-white border border-black/10 p-4 flex flex-col justify-between overflow-hidden transition-all duration-200 hover:border-black hover:-translate-y-1 hover:shadow-xl text-left"
              >
                {/* Cercle décoratif top-right */}
                <div
                  aria-hidden
                  className="absolute top-0 right-0 w-16 h-16 rounded-full -mr-6 -mt-6 opacity-10 group-hover:opacity-20 transition-opacity duration-200"
                  style={{ backgroundColor: cfg.color }}
                />

                {/* Pastille + tagline */}
                <div className="relative z-10 flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: "#6B7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {cfg.tagline}
                  </span>
                </div>

                {/* Nom marque + count */}
                <div className="relative z-10">
                  <p
                    className="text-xl leading-none tracking-tight uppercase"
                    style={{ fontFamily: "'Anton', sans-serif", color: "#1A1A1A" }}
                  >
                    {brand.name}
                  </p>
                  <p
                    className="text-[11px] font-semibold mt-1"
                    style={{ color: "#6B7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {isLoading
                      ? "…"
                      : `${brand.count} modèle${brand.count > 1 ? "s" : ""} dispo`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile CTA */}
        <button
          onClick={() => navigate("/catalogue")}
          className="mt-4 lg:hidden w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-gray-900"
          style={{ backgroundColor: "#000000", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Toutes les marques →
        </button>

      </div>
    </section>
  );
};

export default BrandGrid;
