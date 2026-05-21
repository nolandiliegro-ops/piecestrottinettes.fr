import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import ShowroomHeader from "@/components/showroom/ShowroomHeader";
import ShowroomHero from "@/components/showroom/ShowroomHero";
import CompatiblePartsGrid from "@/components/scooter/CompatiblePartsGrid";
import { useShowroomData } from "@/hooks/useShowroomData";

const Showroom = () => {
  const { slug } = useParams<{ slug: string }>();
  const { scooter, allScooters, compatibleParts, prevSlug, nextSlug, isLoading, isPartsLoading } =
    useShowroomData(slug);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F0E8" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#4A7C59" }} />
          <p style={{ color: "#6B7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Chargement du modèle...
          </p>
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
            <p className="mb-8 max-w-md mx-auto" style={{ color: "#6B7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Cette trottinette n'existe pas ou n'est plus disponible.
            </p>
            <Link
              to="/trottinettes"
              className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-xl text-white text-sm font-semibold uppercase tracking-wider"
              style={{ backgroundColor: "#1A1A1A", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
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
  const count = compatibleParts.length;

  const prices = compatibleParts
    .map((p) => p.price)
    .filter((p): p is number => p != null && p > 0);
  const lowPrice = prices.length > 0 ? Math.min(...prices) : null;

  const seoTitle = `${scooter.name} — Pièces compatibles`;
  const seoDescription = `Découvre toutes les pièces compatibles avec ta ${brandName ? `${brandName} ` : ""}${scooter.name} : ${count} pièce${count > 1 ? "s" : ""} référencée${count > 1 ? "s" : ""}, livraison rapide. Freins, pneus, batteries, contrôleurs et plus sur piècestrottinettes.`;
  const canonical = `https://piecestrottinettes.fr/showroom/${scooter.slug}`;

  const schema = {
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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E8" }}>
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={scooter.image_url ?? undefined}
        canonical={canonical}
        schema={schema}
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

        <div id="showroom-parts" style={{ scrollMarginTop: "80px" }}>
          <CompatiblePartsGrid
            parts={compatibleParts}
            isLoading={isPartsLoading}
            scooterName={scooter.name}
          />
        </div>
      </motion.main>

      <Footer />
    </div>
  );
};

export default Showroom;
