import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getBrandColors } from "@/contexts/ScooterContext";

interface BrandWithCount {
  slug: string;
  name: string;
  count: number;
}

const FEATURED_BRAND_SLUGS = ["dualtron", "kaabo", "ninebot", "kukirin", "segway"];

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
        if (m.brand_id)
          counts.set(m.brand_id, (counts.get(m.brand_id) || 0) + 1);
      });

      return FEATURED_BRAND_SLUGS.map((slug) => {
        const brand = brands?.find((b) => b.slug === slug);
        const displayName = brand?.name ||
          slug.charAt(0).toUpperCase() + slug.slice(1);
        return {
          slug,
          name: displayName,
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
    <section
      className="px-4 py-10 lg:py-14"
      style={{ backgroundColor: "#F5F0E8" }}
    >
      <div className="mx-auto max-w-5xl">
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl text-center mb-7 lg:mb-10"
          style={{
            fontFamily: "'Anton', sans-serif",
            color: "#1A1A1A",
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
          }}
        >
          Choisis ta marque
        </h2>

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          {brands.map((brand) => {
            const colors = getBrandColors(brand.slug);
            return (
              <button
                key={brand.slug}
                onClick={() => navigate(`/catalogue?brand=${brand.slug}`)}
                className="rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-200 p-4 lg:p-5 min-h-[88px] flex flex-col items-center justify-center border border-gray-100 hover:-translate-y-0.5"
                style={{ minHeight: 88 }}
                aria-label={`Voir les pièces ${brand.name}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors.accent }}
                  />
                  <span
                    className="text-base lg:text-lg"
                    style={{
                      fontFamily: "'Anton', sans-serif",
                      color: "#1A1A1A",
                      letterSpacing: "0.02em",
                      textTransform: "uppercase",
                    }}
                  >
                    {brand.name}
                  </span>
                </span>
                <span
                  className="text-xs lg:text-sm mt-1"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    color: "#6B7280",
                  }}
                >
                  {isLoading
                    ? "…"
                    : `${brand.count} modèle${brand.count > 1 ? "s" : ""}`}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => navigate("/catalogue")}
            className="rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 p-4 lg:p-5 min-h-[88px] flex flex-col items-center justify-center text-white hover:-translate-y-0.5"
            style={{ backgroundColor: "#000000", minHeight: 88 }}
            aria-label="Voir toutes les marques"
          >
            <span
              className="text-base lg:text-lg"
              style={{
                fontFamily: "'Anton', sans-serif",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              Autres
            </span>
            <span
              className="text-xs lg:text-sm mt-1 text-white/70"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Tout voir →
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default BrandGrid;
