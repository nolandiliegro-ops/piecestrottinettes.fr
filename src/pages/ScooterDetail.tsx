import { useParams, Link, useSearchParams } from "react-router-dom";
import { SCOOTER_SEO } from "@/data/scooterSeo";
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
import ScooterPageVariants, { type PageStyle } from "@/components/scooter/ScooterPageVariants";
import ScooterSeoFiche, { PartnerBlock } from "@/components/scooter/ScooterSeoFiche";
import { useShowroomData } from "@/hooks/useShowroomData";
import { getBrandColors } from "@/contexts/ScooterContext";
import { solidConversionState } from "@/lib/compatibilityStatus";
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
  // Mise en page (16/10) : sans paramètre = Pit-stand (6). ?style=0 ancienne page, ?style=1..5 autres propositions.
  const [searchParams] = useSearchParams();
  const styleNum = Number(searchParams.get("style"));
  // 16/10 : Pit-stand (6) validée par Nolan = page par défaut. ?style=0 = ancienne page (référence), ?style=1..5 = autres propositions.
  const hasStyleParam = searchParams.has("style");
  const pageStyle = (hasStyleParam ? (styleNum >= 1 && styleNum <= 6 ? styleNum : null) : 6) as PageStyle | null;
  // 17/10 (soir) : pièces compatibles juste sous le hero sur Pit-stand — Nolan : « on voit moins les pièces ».
  // ?ordre=0 = ancien ordre (fiche et gamme avant les pièces). ?fiche=long = fiche SEO en sections empilées.
  const partsFirst = pageStyle === 6 && searchParams.get("ordre") !== "0";
  const ficheMode = searchParams.get("fiche") === "long" ? "long" : "tabs";
  // 17/10 (soir) — pièces vs fiche « Tout savoir » (Nolan : sur la Thunder 3, 27 pièces repoussent la fiche tout en bas).
  // 17/10 : Carrousel (1) choisi par Nolan = défaut. ?pieces=0 grille complète · 2 familles · 3 fiche d'abord · 4 grille courte.
  const piecesN = Number(searchParams.get("pieces"));
  const piecesStyle = searchParams.has("pieces") ? (piecesN >= 0 && piecesN <= 4 ? piecesN : 1) : 1;

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

  // 13/10 : titre calé sur « pièces <modèle> » + les familles qui vendent (avant : « — Pièces compatibles »).
  const seoFiche = SCOOTER_SEO[scooter.slug];
  const seoTitle = seoFiche?.metaTitle ?? `Pièces ${scooter.name} : pneus, freins, chargeur compatibles`;
  const seoDescription = seoFiche?.metaDescription ?? `Découvre toutes les pièces compatibles avec ta ${brandName ? `${brandName} ` : ""}${scooter.name} : ${count} pièce${count > 1 ? "s" : ""} référencée${count > 1 ? "s" : ""}, livraison rapide. Freins, pneus, batteries, contrôleurs et plus sur piècestrottinettes.`;
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

  const grid = (layout: "grid" | "rail" | "familles" | "courte", id = "showroom-parts", title?: string) => (
    <div id={id} style={{ scrollMarginTop: "80px" }}>
      <CompatiblePartsGrid
        parts={compatibleParts}
        isLoading={isPartsLoading}
        scooterName={scooter.name}
        scooterId={scooter.id}
        solidBlocked={solidConversionState(scooter) === "blocked"}
        layout={layout}
        fullGridId="toutes-les-pieces"
        title={title}
      />
    </div>
  );
  const video = <ScooterVideo youtubeVideoId={scooter.youtube_video_id} scooterName={scooter.name} />;
  // Sans fiche « Tout savoir », le bloc partenaire s'affiche seul (cible du bouton « Où l'acheter »).
  const fiche = seoFiche ? <ScooterSeoFiche seo={seoFiche} affiliateLink={scooter.affiliate_link} mode={ficheMode} />
    : scooter.affiliate_link ? (
      <section className="px-4 pb-10 lg:px-8" style={{ backgroundColor: "#FAFAF8" }}>
        <div className="mx-auto max-w-6xl"><PartnerBlock url={scooter.affiliate_link} name={scooter.name} /></div>
      </section>
    ) : null;
  // Sans fiche « Tout savoir », la grille complète reste la règle (les propositions ne concernent que les pages longues).
  const ps = seoFiche ? piecesStyle : 0;
  const partsBlock = (
    <>
      {ps === 3 && fiche}
      {grid(ps === 1 ? "rail" : ps === 2 ? "familles" : ps === 4 ? "courte" : "grid")}
      {ps !== 3 && fiche}
      {ps === 2 && grid("grid", "toutes-les-pieces", `TOUTES LES PIÈCES ${scooter.name.toUpperCase()}`)}
      {video}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E8" }}>
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={scooter.image_url ?? undefined}
        canonical={canonical}
        schema={seoFiche ? [productSchema, breadcrumbSchema, {
          "@context": "https://schema.org", "@type": "FAQPage",
          mainEntity: seoFiche.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }, ...(seoFiche.video ? [{
          "@context": "https://schema.org", "@type": "VideoObject",
          name: seoFiche.video.title,
          description: `${seoFiche.displayName} en vidéo (${seoFiche.video.channel}).`,
          thumbnailUrl: `https://i.ytimg.com/vi/${seoFiche.video.id}/hqdefault.jpg`,
          uploadDate: seoFiche.video.uploadDate,
          embedUrl: `https://www.youtube-nocookie.com/embed/${seoFiche.video.id}`,
          contentUrl: `https://www.youtube.com/watch?v=${seoFiche.video.id}`,
        }] : [])] : [productSchema, breadcrumbSchema]}
      />
      <ShowroomHeader />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex-1"
      >
        {pageStyle ? (
          <ScooterPageVariants style={pageStyle} scooter={scooter} allScooters={allScooters} partsCount={count} showTag={hasStyleParam}
            ficheMode={partsFirst ? "slot" : ficheMode} afterHero={partsFirst ? partsBlock : undefined} />
        ) : (
        <>
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
        </>
        )}

        {!partsFirst && <>{grid("grid")}{video}</>}

        {/* Autres modèles — segmented control 3 onglets (masqué dans les propositions ?style=) */}
        {!pageStyle && <RelatedScootersTabs
          current={{
            id: scooter.id,
            brand_id: scooter.brand?.id ?? null,
            brandName,
            power_watts: scooter.power_watts,
            max_speed_kmh: scooter.max_speed_kmh,
            range_km: scooter.range_km,
          }}
        />}
        {pageStyle === 4 && <div className="h-20 lg:hidden" aria-hidden />}
      </motion.main>

      <Footer />
    </div>
  );
};

export default ScooterDetail;
