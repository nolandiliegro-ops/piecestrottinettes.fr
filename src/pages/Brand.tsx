import { useParams, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import { BRAND_ASSETS_FALLBACK } from "@/config/brand";
import { useBrandData } from "@/hooks/useBrandData";
import { buildBrandJsonLd } from "@/lib/brandSchema";
import BrandHeader from "@/components/brand/BrandHeader";
import BrandHero from "@/components/brand/BrandHero";
import BrandExpertNote from "@/components/brand/BrandExpertNote";
import BrandStory from "@/components/brand/BrandStory";
import BrandModelsCarousel from "@/components/brand/BrandModelsCarousel";
import BrandVideo from "@/components/brand/BrandVideo";
import BrandTopParts from "@/components/brand/BrandTopParts";
import BrandInfoBar from "@/components/brand/BrandInfoBar";
import BrandCTA from "@/components/brand/BrandCTA";

const FONT = "'Plus Jakarta Sans', sans-serif";

// Film-grain texture (fixed, pointer-events-none) — physical paper feel.
const GRAIN_BG =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const Brand = () => {
  const { slug } = useParams<{ slug: string }>();
  const { brand, models, topParts, isLoading } = useBrandData(slug);

  // Loading — until we know whether the (published) brand exists.
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: "#F5F0E8" }}>
        <Loader2 className="w-10 h-10 animate-spin" strokeWidth={1.5} style={{ color: "#1A1A1A" }} />
      </div>
    );
  }

  // 404 — not found or not published. True 404 (no redirect) for SEO.
  if (!brand) {
    return (
      <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: "#F5F0E8" }}>
        <BrandHeader />
        <main className="flex-1 flex items-center justify-center px-4 pt-20">
          <div className="text-center">
            <span className="text-7xl mb-6 block" aria-hidden>🏷️</span>
            <h1
              className="text-4xl mb-3"
              style={{
                fontFamily: "'Anton', sans-serif",
                color: "#1A1A1A",
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
              }}
            >
              Marque introuvable
            </h1>
            <p className="mb-8 max-w-md mx-auto" style={{ color: "#6B7280", fontFamily: FONT }}>
              Cette marque n'existe pas ou n'est pas encore disponible.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/catalogue"
                className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-xl text-white text-sm font-bold uppercase tracking-wider"
                style={{ backgroundColor: "#1A1A1A", fontFamily: FONT }}
              >
                Le catalogue
              </Link>
              <Link
                to="/trottinettes"
                className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-xl text-sm font-bold uppercase tracking-wider"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid #1A1A1A", color: "#1A1A1A", fontFamily: FONT }}
              >
                Les trottinettes
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const seoTitle = `${brand.name} — Histoire, modèles & pièces`;
  const seoDescription = `Découvre l'univers ${brand.name}${brand.tagline ? ` : ${brand.tagline}` : ""}. ${models.length} modèle${models.length > 1 ? "s" : ""}, pièces détachées compatibles et l'avis expert Steedy Trott.`;
  const canonical = `https://piecestrottinettes.fr/marque/${brand.slug}`;
  const ogImage = brand.hero_image_url ?? brand.logo_url ?? BRAND_ASSETS_FALLBACK.og_image.url;

  const schema = buildBrandJsonLd({
    name: brand.name,
    slug: brand.slug,
    logoUrl: brand.logo_url,
    description: brand.description,
    foundedYear: brand.founded_year,
    websiteUrl: brand.website_url,
  });

  return (
    <div className="min-h-[100dvh] flex flex-col relative" style={{ backgroundColor: "#F5F0E8" }}>
      <SEO title={seoTitle} description={seoDescription} image={ogImage} canonical={canonical} schema={schema} />

      {/* Film grain overlay — fixed, non-interactive (never on scrolling content). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 opacity-[0.03]"
        style={{ backgroundImage: GRAIN_BG }}
      />

      <BrandHeader />

      <main className="flex-1">
        <BrandHero brand={brand} modelCount={models.length} />

        {/* USP first — expert note before the story (Nolan's editorial decision). */}
        {/* NOTE admin: si expert_note est vide, la section disparaît — pense à la remplir pour conserver l'USP. */}
        {brand.expert_note && (
          <BrandExpertNote note={brand.expert_note} brandName={brand.name} accentColor={brand.accent_color} />
        )}

        {brand.description && <BrandStory description={brand.description} />}

        {/* Always rendered: shows a soft "coming soon" banner when the gamme is empty. */}
        <BrandModelsCarousel models={models} brandName={brand.name} accentColor={brand.accent_color} />

        {brand.youtube_video_id && (
          <BrandVideo videoId={brand.youtube_video_id} brandName={brand.name} accentColor={brand.accent_color} />
        )}

        {topParts.length > 0 && (
          <BrandTopParts parts={topParts} brandName={brand.name} brandSlug={brand.slug} />
        )}

        <BrandInfoBar
          country={brand.country}
          foundedYear={brand.founded_year}
          websiteUrl={brand.website_url}
          brandName={brand.name}
        />

        <BrandCTA brandName={brand.name} brandSlug={brand.slug} accentColor={brand.accent_color} />
      </main>

      <Footer />
    </div>
  );
};

export default Brand;
