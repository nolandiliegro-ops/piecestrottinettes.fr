import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { usePartBySlug, useCompatibleScooters, useRelatedParts } from "@/hooks/usePartDetail";
import { useSelectedScooter } from "@/contexts/ScooterContext";
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

      <div className="pt-20 pb-16">
        {/* Back link */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={0}
          className="max-w-7xl mx-auto px-4 md:px-8 py-4"
        >
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 text-[hsl(var(--carbon))]/60 hover:text-[hsl(var(--carbon))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Retour au catalogue</span>
          </Link>
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
                dangerouslySetInnerHTML={{ __html: part.description }}
              />
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
