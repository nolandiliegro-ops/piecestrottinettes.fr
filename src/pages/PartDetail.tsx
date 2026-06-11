import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { usePartBySlug, useCompatibleScooters, useRelatedParts } from "@/hooks/usePartDetail";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { sanitizeHtml, stripHtml } from "@/lib/sanitizeHtml";
import { getPrimaryImage } from "@/lib/entityImage";
import MediaGallery from "@/components/pdp/MediaGallery";
import PurchaseBlock from "@/components/pdp/PurchaseBlock";
import EngineeringLab from "@/components/pdp/EngineeringLab";
import InstallationGuide from "@/components/pdp/InstallationGuide";
import CompatibilityMatrix from "@/components/pdp/CompatibilityMatrix";
import WorkshopSection from "@/components/pdp/WorkshopSection";
import VideoInstallation from "@/components/pdp/VideoInstallation";
import RelatedProducts from "@/components/pdp/RelatedProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const SITE_URL = "https://piecestrottinettes.fr";

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  }),
};

const PartDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: part, isLoading: partLoading, error } = usePartBySlug(slug);
  const { data: scooters = [], isLoading: scootersLoading } = useCompatibleScooters(
    part?.id ?? null
  );
  const { selectedScooter } = useSelectedScooter();
  const { data: relatedParts = [], isLoading: relatedLoading } = useRelatedParts(
    part?.category_id ?? null,
    part?.id ?? null,
    selectedScooter?.id ?? null
  );

  if (partLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--greige))]">
        <Header />
        <div className="pt-20 px-4 md:px-8 max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Skeleton className="lg:col-span-3 aspect-square rounded-2xl" />
            <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !part) {
    return (
      <div className="min-h-screen bg-[hsl(var(--greige))]">
        <Header />
        <div className="pt-24 px-4 flex flex-col items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="font-display text-4xl text-[hsl(var(--carbon))] mb-4">Pièce introuvable</h1>
            <p className="text-[hsl(var(--carbon))]/60 mb-8">Cette pièce n'existe pas ou a été retirée du catalogue.</p>
            <Link to="/catalogue">
              <Button variant="outline" className="gap-2 min-h-[44px]">
                <ArrowLeft className="w-4 h-4" />
                Retour au catalogue
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const compatibleModels = scooters.map((s) => s.name).join(", ");

  const productUrl = `${SITE_URL}/piece/${part.slug}`;
  // Image primaire en URL Storage ORIGINALE (convention JSON-LD) ; omise si vide.
  const schemaImage = getPrimaryImage(part.images, part.image_url, "");
  // Description texte brut : meta_description (déjà plain-text) sinon strip HTML de la description.
  const schemaDescription = part.meta_description?.trim()
    ? part.meta_description.trim()
    : stripHtml(part.description);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": productUrl,
    url: productUrl,
    name: part.name,
    ...(schemaImage ? { image: schemaImage } : {}),
    ...(schemaDescription ? { description: schemaDescription } : {}),
    ...(part.sku ? { sku: part.sku } : {}),
    brand: { "@type": "Brand", name: "Pièces Trottinettes" },
    ...(part.price != null
      ? {
          offers: {
            "@type": "Offer",
            price: (part.price * 1.2).toFixed(2),
            priceCurrency: "EUR",
            priceValidUntil: `${new Date().getFullYear()}-12-31`,
            availability:
              part.stock_quantity != null && part.stock_quantity > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            url: productUrl,
          },
        }
      : {}),
  };

  // BreadcrumbList calqué sur le fil d'ariane HTML (Accueil → Catalogue → [Catégorie] → Produit).
  const breadcrumbItems = [
    { name: "Accueil", item: SITE_URL },
    { name: "Catalogue", item: `${SITE_URL}/catalogue` },
    ...(part.category?.slug && part.category?.name
      ? [{ name: part.category.name, item: `${SITE_URL}/categorie/${part.category.slug}` }]
      : []),
    { name: part.name, item: productUrl },
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
    <div className="min-h-screen bg-[hsl(var(--greige))]">
      <SEO
        title={
          part.meta_title?.trim()
            ? part.meta_title
            : `${part.name} - Pièce compatible trottinette électrique`
        }
        description={
          part.meta_description?.trim()
            ? part.meta_description
            : `Achetez ${part.name} pour trottinette électrique. Compatible ${compatibleModels || "nombreux modèles"}. Livraison rapide.`
        }
        image={part.image_url ?? undefined}
        canonical={productUrl}
        schema={[productSchema, breadcrumbSchema]}
      />
      <Header />

      <div className="pt-20 pb-16">
        {/* Breadcrumb (matche le BreadcrumbList JSON-LD) */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={0}
          className="max-w-7xl mx-auto px-4 md:px-8 py-4"
        >
          <nav aria-label="Fil d'ariane">
            <ol className="flex items-center gap-1.5 text-sm text-[hsl(var(--carbon))]/60">
              <li>
                <Link to="/" className="inline-flex items-center min-h-[44px] hover:text-[hsl(var(--carbon))] transition-colors">
                  Accueil
                </Link>
              </li>
              <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
              <li>
                <Link to="/catalogue" className="inline-flex items-center min-h-[44px] hover:text-[hsl(var(--carbon))] transition-colors">
                  Catalogue
                </Link>
              </li>
              {part.category?.slug && part.category?.name && (
                <>
                  <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
                  <li className="min-w-0">
                    <Link
                      to={`/categorie/${part.category.slug}`}
                      className="inline-flex items-center min-h-[44px] font-medium text-[hsl(var(--carbon))] hover:text-mineral transition-colors truncate"
                    >
                      {part.category.name}
                    </Link>
                  </li>
                </>
              )}
            </ol>
          </nav>
        </motion.div>

        {/* === SECTION 1: Hero — MediaGallery + PurchaseBlock === */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          custom={1}
          className="max-w-7xl mx-auto px-4 md:px-8 py-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            <div className="lg:col-span-3 rounded-2xl shadow-lg overflow-hidden">
              <MediaGallery imageUrl={part.image_url} images={part.images} productName={part.name} />
            </div>
            <div className="lg:col-span-2">
              <PurchaseBlock
                id={part.id}
                name={part.name}
                price={part.price}
                stockQuantity={part.stock_quantity}
                categoryName={part.category?.name ?? null}
                categoryIcon={part.category?.icon ?? null}
                imageUrl={part.image_url}
                difficultyLevel={part.difficulty_level}
              />
            </div>
          </div>
        </motion.section>

        {/* === SECTION 2: 4 Technical Cards === */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          custom={2}
          className="max-w-7xl mx-auto px-4 md:px-8 py-8"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="min-h-[200px]">
              <InstallationGuide
                difficultyLevel={part.difficulty_level}
                estimatedTime={part.estimated_install_time_minutes}
                requiredTools={part.required_tools}
              />
            </div>
            <div className="min-h-[200px]">
              <EngineeringLab
                technicalMetadata={part.technical_metadata}
                difficultyLevel={part.difficulty_level}
              />
            </div>
            <div className="min-h-[200px]">
              <CompatibilityMatrix scooters={scooters} isLoading={scootersLoading} />
            </div>
            <div className="min-h-[200px]">
              <WorkshopSection
                youtubeVideoId={part.youtube_video_id}
                productName={part.name}
              />
            </div>
          </div>
        </motion.section>

        {/* === SECTION 3: PRÉSENTATION === */}
        {part.description && part.description.trim() && (
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            custom={3}
            className="max-w-7xl mx-auto px-4 md:px-8 py-8"
          >
            <div className="rounded-2xl shadow-md bg-white/70 backdrop-blur-sm border border-white/40 p-6 md:p-8 border-l-4 border-l-[#4A7C59]">
              <h2 className="font-black text-[hsl(var(--carbon))] uppercase tracking-tight text-xl mb-2">
                Présentation
              </h2>
              <div className="border-b-2 border-[#4A7C59] w-12 mb-6" />
              <div
                className="quill-content text-[#374151] text-base leading-[1.8]"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(part.description) }}
              />
            </div>
          </motion.section>
        )}

        {/* === SECTION 3b: Caractéristiques techniques === */}
        {part.characteristics?.trim() && (
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            custom={3}
            className="max-w-7xl mx-auto px-4 md:px-8 py-8"
          >
            <div className="rounded-2xl shadow-md bg-white/70 backdrop-blur-sm border border-white/40 p-6 md:p-8 border-l-4 border-l-[#4A7C59]">
              <h2 className="font-black text-[hsl(var(--carbon))] uppercase tracking-tight text-xl mb-2">
                Caractéristiques techniques
              </h2>
              <div className="border-b-2 border-[#4A7C59] w-12 mb-6" />
              <ul className="list-disc pl-5 space-y-1 text-[#374151] text-base leading-[1.8]">
                {part.characteristics
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
            </div>
          </motion.section>
        )}

        {/* === SECTION 4: YouTube Video === */}
        {part.youtube_video_id && (
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            custom={4}
            className="max-w-7xl mx-auto px-4 md:px-8 py-8"
          >
            <VideoInstallation
              youtubeVideoId={part.youtube_video_id}
              productName={part.name}
            />
          </motion.section>
        )}

        {/* === SECTION 5: Related Products === */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          custom={5}
          className="max-w-7xl mx-auto px-4 md:px-8 py-8"
        >
          <RelatedProducts parts={relatedParts} isLoading={relatedLoading} />
        </motion.section>
      </div>
    </div>
  );
};

export default PartDetail;
