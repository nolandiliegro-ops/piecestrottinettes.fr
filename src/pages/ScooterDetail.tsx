import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useScooterBySlug, useScooterCompatibleParts } from "@/hooks/useScooterDetail";
import ScooterHero from "@/components/scooter/ScooterHero";
import ScooterSpecs from "@/components/scooter/ScooterSpecs";
import ScooterDescription from "@/components/scooter/ScooterDescription";
import ScooterVideo from "@/components/scooter/ScooterVideo";
import CompatiblePartsGrid from "@/components/scooter/CompatiblePartsGrid";
import AffiliateButton from "@/components/scooter/AffiliateButton";
import OtherScootersCarousel from "@/components/scooter/OtherScootersCarousel";

const ScooterDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: scooter, isLoading, error } = useScooterBySlug(slug);
  const { data: compatibleParts = [], isLoading: isLoadingParts } = useScooterCompatibleParts(scooter?.id || null);

  // Dynamic SEO Meta Tags
  useEffect(() => {
    if (scooter) {
      document.title = scooter.meta_title || `${scooter.name} - Pièces Détachées | piècestrottinettes.FR`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          scooter.meta_description || `Découvrez toutes les pièces détachées compatibles avec la ${scooter.name}. Spécifications techniques, vidéos et guides d'installation.`
        );
      }
    }

    // Cleanup
    return () => {
      document.title = "piècestrottinettes.FR";
    };
  }, [scooter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement du modèle...</p>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !scooter) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center px-4"
          >
            <span className="text-8xl mb-6 block">🛴</span>
            <h1 className="font-display text-4xl text-foreground mb-4">
              Modèle introuvable
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Ce modèle de trottinette n'existe pas dans notre base de données.
            </p>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour à l'accueil
              </Button>
            </Link>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background studio-luxury-bg watermark-brand">
      <Header />
      
      <main className="pt-16 lg:pt-20">
        {/* Back Navigation */}
        <div className="container mx-auto px-4 lg:px-8 pt-6">
          <Link to="/trottinettes">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Toutes les trottinettes
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <ScooterHero scooter={scooter} />

        {/* Specs Grid */}
        <ScooterSpecs scooter={scooter} />

        {/* Description */}
        <ScooterDescription description={scooter.description} />

        {/* YouTube Video */}
        <ScooterVideo youtubeVideoId={scooter.youtube_video_id} scooterName={scooter.name} />

        {/* Compatible Parts Grid - THE KEY ELEMENT */}
        <CompatiblePartsGrid
          parts={compatibleParts}
          isLoading={isLoadingParts}
          scooterName={scooter.name}
        />

        {/* Other Scooters Carousel */}
        <OtherScootersCarousel currentScooterId={scooter.id} />

        {/* Affiliate CTA */}
        {scooter.affiliate_link && (
          <AffiliateButton affiliateLink={scooter.affiliate_link} scooterName={scooter.name} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ScooterDetail;
