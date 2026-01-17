import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { usePartBySlug, useCompatibleScooters } from "@/hooks/usePartDetail";
import Header from "@/components/Header";
import MediaGallery from "@/components/pdp/MediaGallery";
import PurchaseBlock from "@/components/pdp/PurchaseBlock";
import EngineeringLab from "@/components/pdp/EngineeringLab";
import InstallationGuide from "@/components/pdp/InstallationGuide";
import CompatibilityMatrix from "@/components/pdp/CompatibilityMatrix";
import WorkshopSection from "@/components/pdp/WorkshopSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const PartDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: part, isLoading: partLoading, error } = usePartBySlug(slug);
  const { data: scooters = [], isLoading: scootersLoading } = useCompatibleScooters(
    part?.id ?? null
  );

  // Loading state
  if (partLoading) {
    return (
      <div className="min-h-screen bg-greige">
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
      <div className="min-h-screen bg-greige">
        <Header />
        <div className="pt-24 px-4 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-4xl text-carbon mb-4">
              Pièce introuvable
            </h1>
            <p className="text-carbon/60 mb-8">
              Cette pièce n'existe pas ou a été retirée du catalogue.
            </p>
            <Link to="/catalogue">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour au catalogue
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-greige">
      <Header />

      {/* DESKTOP/TABLET: 100vh Zero Scroll Bento Grid */}
      <div className="hidden md:flex flex-col h-screen pt-16">
        {/* Back button */}
        <div className="px-6 lg:px-8 py-4">
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 text-carbon/60 hover:text-carbon transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Retour au catalogue</span>
          </Link>
        </div>

        {/* Bento Grid Container */}
        <div className="flex-1 px-6 lg:px-8 pb-6 overflow-hidden">
          <div className="h-full max-w-7xl mx-auto grid grid-cols-4 grid-rows-[1.6fr_1fr] gap-4 lg:gap-6">
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
              />
            </div>

            {/* Row 2 - 4 columns */}
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
      </div>

      {/* MOBILE: Vertical Stack Scrollable */}
      <div className="md:hidden pt-20 pb-8 px-4 space-y-4">
        {/* Back button */}
        <Link
          to="/catalogue"
          className="inline-flex items-center gap-2 text-carbon/60 hover:text-carbon transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Retour au catalogue</span>
        </Link>

        {/* Media Gallery - Square aspect on mobile */}
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
        />

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

        {/* Workshop Section */}
        <div className="min-h-[300px]">
          <WorkshopSection
            youtubeVideoId={part.youtube_video_id}
            productName={part.name}
          />
        </div>
      </div>
    </div>
  );
};

export default PartDetail;
