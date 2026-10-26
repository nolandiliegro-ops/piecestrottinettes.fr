import { ogImage } from "@/lib/ogImage";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useScooterFicheState } from "@/hooks/useScooterFiche";
import { BuyCtx, livePrice } from "@/components/scooter/BuyProposals";
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
import { NoOfferBlock } from "@/components/scooter/PriceAlert";
import ScooterGuides from "@/components/scooter/ScooterGuides";
import ScooterQuestions from "@/components/scooter/ScooterQuestions";
import { AtelierOnFiche, conseilsParam } from "@/components/scooter/AtelierOnFiche";
import { useShowroomData } from "@/hooks/useShowroomData";
import { getBrandColors } from "@/contexts/ScooterContext";
import { solidConversionState } from "@/lib/compatibilityStatus";
import { firstFitting, clampDescription } from "@/lib/seoText";
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
  const { fiche: seoFiche, settled: ficheSettled } = useScooterFicheState(slug);
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
        {/* SPA : la page répond 200 → noindex pour ne pas laisser Google indexer une soft 404 (audit SEO 24/10). */}
        <SEO noindex title="Modèle introuvable" description="Cette trottinette n'existe pas ou n'est plus disponible." />
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

  // Nav gamme (même marque) — liens simples sous le breadcrumb.
  const sameBrandModels = allScooters.filter(
    (s) => s.slug !== scooter.slug && brandName && s.brand_name === brandName
  );

  // 13/10 : titre calé sur « pièces <modèle> » + les familles qui vendent (avant : « — Pièces compatibles »).
  // 24/10 (audit SEO) : variantes plus courtes si le nom est long (≤ 60), description ≤ 158, marque pas répétée.
  const seoTitle = seoFiche?.metaTitle ?? firstFitting([
    `Pièces ${scooter.name} : pneus, freins, chargeur compatibles`,
    `Pièces ${scooter.name} : pneus, freins, chargeur`,
    `Pièces détachées ${scooter.name}`,
    `Pièces ${scooter.name}`,
  ]);
  const fullModel = brandName && !scooter.name.toLowerCase().startsWith(brandName.toLowerCase()) ? `${brandName} ${scooter.name}` : scooter.name;
  const seoDescription = seoFiche?.metaDescription ?? clampDescription(`Pièces compatibles avec ta ${fullModel} : ${count} référence${count > 1 ? "s" : ""}, pneus, freins, chargeurs, batteries. Livraison rapide.`);
  // Ni pièce compatible ni fiche « Tout savoir » : page vide → noindex (et hors sitemap). Une fiche suffit à garder la page.
  const emptyPage = !isPartsLoading && ficheSettled && count === 0 && !seoFiche;
  const canonical = `${SITE}/scooter/${scooter.slug}`;

  // JSON-LD : la trottinette n'est PAS vendue ici → pas de Product/Offer (avant : AggregateOffer au prix de la pièce
  // la moins chère, présenté comme le prix de la trottinette — audit SEO 24/10). On décrit la liste des pièces vendues.
  const partsSchema = count > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Pièces compatibles ${fullModel}`,
    numberOfItems: count,
    itemListElement: compatibleParts.slice(0, 50).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/piece/${p.slug}`,
      name: p.name,
    })),
  } : null;

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
        tireSize={scooter.tire_size}
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
    ) : (
      // 24/10 : sans vendeur partenaire, on propose l'alerte « premier prix relevé » (jamais de cul-de-sac).
      <section className="px-4 pb-10 lg:px-8" style={{ backgroundColor: "#FAFAF8" }}>
        <div className="mx-auto max-w-6xl"><NoOfferBlock name={scooter.name} /></div>
      </section>
    );
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
        image={ogImage("scooter", scooter.slug)}
        canonical={canonical}
        noindex={emptyPage}
        schema={seoFiche ? [...(partsSchema ? [partsSchema] : []), breadcrumbSchema, {
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
        }] : [])] : [...(partsSchema ? [partsSchema] : []), breadcrumbSchema]}
      />
      <ShowroomHeader />

      <BuyCtx.Provider value={{ price: livePrice(scooter.price_eur, scooter.price_checked_at), brandLogo: scooter.brand?.logo_url ?? null, scooterId: scooter.id }}>
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

        {/* 24/10 : guides de l'atelier liés à cette trottinette (fiche → article → pièces) */}
        {/* 24/10 : conseils + question de l'atelier, propositions ?conseils=1..5 (sans paramètre : inchangés). */}
        {conseilsParam() ? <AtelierOnFiche look={conseilsParam()!} slug={scooter.slug} brandSlug={scooter.brand?.slug} scooterName={scooter.name} scooterImage={scooter.image_url} />
          : <><ScooterGuides slug={scooter.slug} brandSlug={scooter.brand?.slug} scooterName={scooter.name} />
            <ScooterQuestions slug={scooter.slug} scooterName={scooter.name} /></>}

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
      </BuyCtx.Provider>

      <Footer />
    </div>
  );
};

export default ScooterDetail;
