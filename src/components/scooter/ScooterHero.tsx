import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScooterDetail } from "@/hooks/useScooterDetail";
import { getAllImages } from "@/lib/entityImage";

interface ScooterHeroProps {
  scooter: ScooterDetail;
}

const ScooterHero = ({ scooter }: ScooterHeroProps) => {
  const allImages = getAllImages(scooter.images, scooter.image_url);
  const hasGallery = allImages.length > 1;
  const [currentIdx, setCurrentIdx] = useState(0);
  const displayImage = allImages[currentIdx]?.url ?? "/placeholder.svg";

  const goPrev = () => setCurrentIdx((i) => (i - 1 + allImages.length) % allImages.length);
  const goNext = () => setCurrentIdx((i) => (i + 1) % allImages.length);

  return (
    <section
      className="relative min-h-[60vh] flex items-center overflow-hidden"
      style={{
        backgroundImage: 'url(/garage-floor.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="order-2 lg:order-1"
          >
            {scooter.brand && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-3 mb-6"
              >
                {scooter.brand.logo_url && (
                  <img
                    src={scooter.brand.logo_url}
                    alt={scooter.brand.name}
                    className="h-8 w-auto object-contain"
                  />
                )}
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  {scooter.brand.name}
                </span>
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="font-display text-5xl lg:text-7xl xl:text-8xl text-foreground leading-none mb-6"
            >
              {scooter.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-lg lg:text-xl text-muted-foreground max-w-md leading-relaxed"
            >
              {scooter.meta_description || "Découvrez toutes les pièces détachées compatibles et les spécifications techniques de ce modèle."}
            </motion.p>
          </motion.div>

          {/* Scooter Image / Gallery */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="order-1 lg:order-2 relative"
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              {allImages.length > 0 ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={displayImage}
                      src={displayImage}
                      alt={allImages[currentIdx]?.alt || scooter.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="w-full h-full object-contain drop-shadow-2xl"
                    />
                  </AnimatePresence>

                  {hasGallery && (
                    <>
                      <button
                        type="button"
                        onClick={goPrev}
                        aria-label="Photo précédente"
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-card transition-colors shadow-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        aria-label="Photo suivante"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-card transition-colors shadow-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-3xl">
                  <span className="text-8xl opacity-20">🛴</span>
                </div>
              )}

              {scooter.power_watts && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -left-4 top-1/4 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-4 py-2 shadow-lg pointer-events-none"
                >
                  <span className="font-display text-2xl text-primary">{scooter.power_watts}</span>
                  <span className="text-xs text-muted-foreground ml-1">W</span>
                </motion.div>
              )}

              {scooter.max_speed_kmh && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="absolute -right-4 top-1/3 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-4 py-2 shadow-lg pointer-events-none"
                >
                  <span className="font-display text-2xl text-primary">{scooter.max_speed_kmh}</span>
                  <span className="text-xs text-muted-foreground ml-1">km/h</span>
                </motion.div>
              )}

              {scooter.range_km && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="absolute right-1/4 -bottom-4 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-4 py-2 shadow-lg pointer-events-none"
                >
                  <span className="font-display text-2xl text-primary">{scooter.range_km}</span>
                  <span className="text-xs text-muted-foreground ml-1">km</span>
                </motion.div>
              )}
            </div>

            {/* Thumbnails */}
            {hasGallery && (
              <div className="mt-4 flex justify-center gap-2 flex-wrap">
                {allImages.map((img, idx) => (
                  <button
                    key={`${img.url}-${idx}`}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    aria-label={`Voir photo ${idx + 1}`}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentIdx
                        ? "border-primary shadow-md scale-105"
                        : "border-border opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || `${scooter.name} ${idx + 1}`}
                      className="w-full h-full object-contain bg-card/40"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ScooterHero;
