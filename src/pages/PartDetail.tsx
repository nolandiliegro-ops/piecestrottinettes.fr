import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { usePartBySlug, useCompatibleScooters, useRelatedParts } from "@/hooks/usePartDetail";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
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

const PartDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: part, isLoading: partLoading, error } = usePartBySlug(slug);
  const { data: scooters = [], isLoading: scootersLoading } = useCompatibleScooters(
    part?.id ?? null
  );
  const { data: relatedParts = [], isLoading: relatedLoading } = useRelatedParts(
    part?.category_id ?? null,
    part?.id ?? null
  );

  // Loading state
  if (partLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--greige))]">
        <Header />
        <div className="pt-20 px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-10 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <Skeleton className="col-span-2 aspect-square md:aspect-auto md:h-[50vh] rounded-2xl" />
              <Skeleton className="h-64 md:h-[50vh] rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !part) {
    return (
      <div className="min-h-screen bg-[hsl(var(--greige))]">
        <Header />
        <div className="pt-24 px-4 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-4xl text-[hsl(var(--carbon))] mb-4">
              Pièce introuvable
            </h1>
            <p className="text-[hsl(var(--carbon))]/60 mb-8">
              Cette pièce n'existe pas ou a été retirée du catalogue.
            </p>
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

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: part.name,
    image: part.image_url,
    description: part.description,
    sku: (part as any).sku,
    brand: { "@type": "Brand", name: "Pièces Trottinettes" },
    offers: {
      "@type": "Offer",
      price: (part.price! * 1.2).toFixed(2),
      priceCurrency: "EUR",
      availability:
        part.stock_quantity! > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `https://piecestrottinettes.fr/piece/${part.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--greige))]">
      <SEO
        title={`${part.name} - Pièce compatible trottinette électrique`}
        description={`Achetez ${part.name} pour trottinette électrique. Compatible ${compatibleModels || "nombreux modèles"}. ${part.description?.slice(0, 100) ?? ""}. Livraison rapide.`}
        image={part.image_url ?? undefined}
        canonical={`https://piecestrottinettes.fr/piece/${part.slug}`}
        schema={productSchema}
      />
      <Header />

      {/* DESKTOP/TABLET */}
      <div className="hidden md:block pt-16">
        {/* Back button */}
        <div className="px-6 lg:px-8 py-4">
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 text-[hsl(var(--carbon))]/60 hover:text-[hsl(var(--carbon))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Retour au catalogue</span>
          </Link>
        </div>

        {/* Bento Grid — natural height, scrollable */}
        <div className="px-6 lg:px-8 pb-6">
          <div className="max-w-7xl mx-auto grid grid-cols-4 grid-rows-[500px_280px] gap-4 lg:gap-6">
            {/* Row 1 */}
            <div className="col-span-2 row-span-1">
              <MediaGallery imageUrl={part.image_url} productName={part.name} />
            </div>
            <div className="col-span-1 row-span-1">
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

            {/* Description — PRÉSENTATION */}
            {part.description && part.description.trim() ? (
              <div className="col-span-1 row-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                  className="h-full rounded-2xl shadow-md bg-white/70 backdrop-blur-sm border border-white/40 p-6 overflow-y-auto border-l-4 border-l-[#4A7C59]"
                >
                  <h2 className="font-black text-[hsl(var(--carbon))] uppercase tracking-tight text-lg mb-4">
                    Présentation
                  </h2>
                  <div
                    className="quill-content text-[#1A1A1A] text-sm leading-[1.7]"
                    dangerouslySetInnerHTML={{ __html: part.description }}
                  />
                </motion.div>
              </div>
            ) : (
              <div className="col-span-1 row-span-1" />
            )}

            {/* Row 2 */}
            <div className="col-span-1 row-span-1">
              <InstallationGuide
                difficultyLevel={part.difficulty_level}
                estimatedTime={part.estimated_install_time_minutes}
                requiredTools={part.required_tools}
              />
            </div>
            <div className="col-span-1 row-span-1">
              <EngineeringLab
                technicalMetadata={part.technical_metadata}
                difficultyLevel={part.difficulty_level}
              />
            </div>
            <div className="col-span-1 row-span-1">
              <CompatibilityMatrix
                scooters={scooters}
                isLoading={scootersLoading}
              />
            </div>
            <div className="col-span-1 row-span-1">
              <WorkshopSection
                youtubeVideoId={part.youtube_video_id}
                productName={part.name}
              />
            </div>
          </div>
        </div>

        {/* Sections below bento grid — scrollable */}
        <div className="px-6 lg:px-8 space-y-12 pb-16">
          {/* YouTube Video */}
          {part.youtube_video_id && (
            <VideoInstallation
              youtubeVideoId={part.youtube_video_id}
              productName={part.name}
            />
          )}

          {/* Related Products */}
          <RelatedProducts parts={relatedParts} isLoading={relatedLoading} />
        </div>
      </div>

      {/* MOBILE: Vertical Stack Scrollable */}
      <div className="md:hidden pt-20 pb-12 px-4 space-y-6">
        {/* Back button */}
        <Link
          to="/catalogue"
          className="inline-flex items-center gap-2 text-[hsl(var(--carbon))]/60 hover:text-[hsl(var(--carbon))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Retour au catalogue</span>
        </Link>

        {/* Media Gallery */}
        <div className="aspect-square">
          <MediaGallery imageUrl={part.image_url} productName={part.name} />
        </div>

        {/* Purchase Block */}
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

        {/* Description — PRÉSENTATION */}
        {part.description && part.description.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="rounded-2xl shadow-md bg-white/70 backdrop-blur-sm border border-white/40 p-6 border-l-4 border-l-[#4A7C59]"
          >
            <h2 className="font-black text-[hsl(var(--carbon))] uppercase tracking-tight text-base mb-4">
              Présentation
            </h2>
            <div
              className="quill-content text-[#1A1A1A] text-sm leading-[1.7]"
              dangerouslySetInnerHTML={{ __html: part.description }}
            />
          </motion.div>
        )}

        {/* YouTube Video */}
        {part.youtube_video_id && (
          <VideoInstallation
            youtubeVideoId={part.youtube_video_id}
            productName={part.name}
          />
        )}

        {/* Installation Guide */}
        <InstallationGuide
          difficultyLevel={part.difficulty_level}
          estimatedTime={part.estimated_install_time_minutes}
          requiredTools={part.required_tools}
        />

        {/* Engineering Lab */}
        <EngineeringLab
          technicalMetadata={part.technical_metadata}
          difficultyLevel={part.difficulty_level}
        />

        {/* Compatibility Matrix */}
        <CompatibilityMatrix scooters={scooters} isLoading={scootersLoading} />

        {/* Workshop */}
        <div className="min-h-[300px]">
          <WorkshopSection
            youtubeVideoId={part.youtube_video_id}
            productName={part.name}
          />
        </div>

        {/* Related Products */}
        <RelatedProducts parts={relatedParts} isLoading={relatedLoading} />
      </div>
    </div>
  );
};

export default PartDetail;
