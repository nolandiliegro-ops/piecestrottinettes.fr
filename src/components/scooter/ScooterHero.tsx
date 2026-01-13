import { motion } from "framer-motion";
import { ScooterDetail } from "@/hooks/useScooterDetail";
import { getScooterImage } from "@/lib/scooterImageMapping";

interface ScooterHeroProps {
  scooter: ScooterDetail;
}

const ScooterHero = ({ scooter }: ScooterHeroProps) => {
  const displayImage = scooter.image_url || getScooterImage(scooter.slug);

  return (
    <section className="relative min-h-[60vh] flex items-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-mineral/5 via-transparent to-primary/5 pointer-events-none" />
      
      {/* Radial glow behind scooter */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-gradient-radial from-mineral/10 to-transparent rounded-full blur-3xl opacity-50" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="order-2 lg:order-1"
          >
            {/* Brand Badge */}
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

            {/* Model Name */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="font-display text-5xl lg:text-7xl xl:text-8xl text-foreground leading-none mb-6"
            >
              {scooter.name}
            </motion.h1>

            {/* Tagline / Short Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-lg lg:text-xl text-muted-foreground max-w-md leading-relaxed"
            >
              {scooter.meta_description || "Découvrez toutes les pièces détachées compatibles et les spécifications techniques de ce modèle."}
            </motion.p>
          </motion.div>

          {/* Scooter Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="order-1 lg:order-2 relative"
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={scooter.name}
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-3xl">
                  <span className="text-8xl opacity-20">🛴</span>
                </div>
              )}

              {/* Floating specs badges */}
              {scooter.power_watts && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -left-4 top-1/4 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-4 py-2 shadow-lg"
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
                  className="absolute -right-4 top-1/3 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-4 py-2 shadow-lg"
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
                  className="absolute right-1/4 -bottom-4 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-4 py-2 shadow-lg"
                >
                  <span className="font-display text-2xl text-primary">{scooter.range_km}</span>
                  <span className="text-xs text-muted-foreground ml-1">km</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ScooterHero;
