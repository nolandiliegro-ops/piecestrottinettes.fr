import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, ChevronRight } from "lucide-react";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import ShowroomHeader from "@/components/showroom/ShowroomHeader";
import ShowroomHero from "@/components/showroom/ShowroomHero";
import ScooterSpecs from "@/components/scooter/ScooterSpecs";
import ScooterDescription from "@/components/scooter/ScooterDescription";
import ScooterVideo from "@/components/scooter/ScooterVideo";
import CompatiblePartsGrid from "@/components/scooter/CompatiblePartsGrid";
import RelatedScootersTabs from "@/components/scooter/RelatedScootersTabs";
import { useShowroomData } from "@/hooks/useShowroomData";
import { getBrandColors } from "@/contexts/ScooterContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const SITE = "https://piecestrottinettes.fr";
const FONT = "'Plus Jakarta Sans', sans-serif";

const ScooterDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { scooter, allScooters, compatibleParts, prevSlug, nextSlug, isLoading, isPartsLoading } =
    useShowroomData(slug);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F0E8" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#4A7C59" }} />
          <p style={{ color: "#6B7280", fontFamily: FONT }}>Chargement du modèle...</p>
        </div>
      </div>
    );
  }

  // 404 — not found or not published
  if (!scooter) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E8" }}>
        <ShowroomHeader />
        <main className="flex-1 flex items-center justify-center px-4 pt-20">
          <div className="text-center">
            <span className="text-7xl mb-6 block">🛴</span>
            <h1
              className="text-4xl mb-3"
              style={{ fontFamily: "'Anton', sans-serif", color: "#1A1A1A", textTransform: "uppercase", letterSpacing: "-0.01em" }}
            >
              Modèle introuvable
            </h1>
            <p className="mb-8 max-w-md mx-auto" style={{ color: "#6B7280", fontFamily: FONT }}>
              Cette trottinette n'existe pas ou n'est plus disponible.
            </p>
            <Link
              to="/trottinettes"
              className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-xl text-white text-sm font-semibold uppercase tracking-wider"
              style={{ backgroundColor: "#1A1A1A", fontFamily: FONT }}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
              Toutes les trottinettes
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const brandName = scooter.brand?.name ?? "";
  const brand = getBrandColors(brandName);
  const count = compatibleParts.length;

  // Prix réel = prix des PIÈCES compatibles (le scooter n'a pas de prix).
  const prices = compatibleParts.map((p) => p.price).filter((p): p is number => p != null && p > 0);
  const lowPrice = prices.length > 0 ? Math.min(...prices) : null;

  // Nav gamme (même marque) — liens simples sous le breadcrumb.
  const sameBrandModels = allScooters.filter(
    (s) => s.slug !== scooter.slug && brandName && s.brand_name === brandName
  );

  const seoTitle = `${scooter.name} — Pièces compatibles`;
  const seoDescription = `Découvre toutes les pièces compatibles avec ta ${brandName ? `${brandName} ` : ""}${scooter.name} : ${count} pièce${count > 1 ? "s" : ""} référencée${count > 1 ? "s" : ""}, livraison rapide. Freins, pneus, batteries, contrôleurs et plus sur piècestrottinettes.`;
  const canonical = `${SITE}/scooter/${scooter.slug}`;

  // JSON-LD Product + AggregateOffer (prix réel issu des pièces compatibles)
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: scooter.name,
    ...(scooter.image_url ? { image: scooter.image_url } : {}),
    description: scooter.description || seoDescription,
    sku: scooter.slug,
    brand: { "@type": "Brand", name: brandName || "Pièces Trottinettes" },
    ...(lowPrice != null
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "EUR",
            lowPrice,
            offerCount: prices.length,
            availability: "https://schema.org/InStock",
            url: canonical,
          },
        }
      : {}),
  };

  // JSON-LD BreadcrumbList
  const breadcrumbItems = [
    { name: "Accueil", item: `${SITE}/` },
    { name: "Trottinettes", item: `${SITE}/trottinettes` },
    ...(scooter.brand?.slug ? [{ name: brandName, item: `${SITE}/marque/${scooter.brand.slug}` }] : []),
    { name: scooter.name, item: canonical },
  ];
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.item,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E8" }}>
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={scooter.image_url ?? undefined}
        canonical={canonical}
        schema={[productSchema, breadcrumbSchema]}
      />
      <ShowroomHeader />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex-1"
      >
        <ShowroomHero
          scooter={scooter}
          allScooters={allScooters}
          prevSlug={prevSlug}
          nextSlug={nextSlug}
        />

        {/* Breadcrumb + nav gamme (liens simples) */}
        <div className="container mx-auto px-4 lg:px-8 pt-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/trottinettes">Trottinettes</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {scooter.brand?.slug && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/marque/${scooter.brand.slug}`}>{brandName}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{scooter.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Nav gamme même marque — liens simples (Temps 1) */}
          {sameBrandModels.length > 0 && (
            <nav
              aria-label={`Gamme ${brandName}`}
              className="mt-4 flex items-center gap-2 overflow-x-auto pb-1"
            >
              <span
                className="flex-shrink-0 text-xs font-bold uppercase tracking-wider"
                style={{ color: brand.accent, fontFamily: FONT }}
              >
                Gamme {brandName}
              </span>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(26,26,26,0.25)" }} />
              {sameBrandModels.map((s) => (
                <Link
                  key={s.slug}
                  to={`/scooter/${s.slug}`}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    color: "#1A1A1A",
                    backgroundColor: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(26,26,26,0.08)",
                    fontFamily: FONT,
                  }}
                >
                  {s.name}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Specs (tuiles couleur marque, Unbounded) */}
        <ScooterSpecs scooter={scooter} />

        {/* Description */}
        <ScooterDescription description={scooter.description} accentColor={brand.accent} />

        {/* Vidéo YouTube */}
        <ScooterVideo youtubeVideoId={scooter.youtube_video_id} scooterName={scooter.name} />

        {/* Pièces compatibles (ancre scroll du bouton "Pièces") */}
        <div id="showroom-parts" style={{ scrollMarginTop: "80px" }}>
          <CompatiblePartsGrid
            parts={compatibleParts}
            isLoading={isPartsLoading}
            scooterName={scooter.name}
          />
        </div>

        {/* Autres modèles — segmented control 3 onglets */}
        <RelatedScootersTabs
          current={{
            id: scooter.id,
            brand_id: scooter.brand?.id ?? null,
            brandName,
            power_watts: scooter.power_watts,
            max_speed_kmh: scooter.max_speed_kmh,
            range_km: scooter.range_km,
          }}
        />
      </motion.main>

      <Footer />
    </div>
  );
};

export default ScooterDetail;
