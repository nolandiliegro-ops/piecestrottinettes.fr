import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Battery, Zap, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GarageScooter {
  id: string;
  scooter_model: {
    id: string;
    name: string;
    brand: string;
    image_url?: string | null;
    max_speed_kmh?: number | null;
    range_km?: number | null;
    power_watts?: number | null;
    voltage?: number | null;
  };
  nickname?: string | null;
  added_at: string;
  is_owned?: boolean;
  current_km?: number | null;
}

interface GarageScooterCarouselProps {
  scooters: GarageScooter[];
  onScooterChange?: (scooter: GarageScooter) => void;
  className?: string;
}

const GarageScooterCarousel = ({ scooters, onScooterChange, className }: GarageScooterCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    const newIndex = currentIndex === 0 ? scooters.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    onScooterChange?.(scooters[newIndex]);
  };

  const handleNext = () => {
    const newIndex = currentIndex === scooters.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    onScooterChange?.(scooters[newIndex]);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    onScooterChange?.(scooters[index]);
  };

  if (!scooters || scooters.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-white/40 rounded-2xl">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-mineral/10 mx-auto flex items-center justify-center mb-4">
            <span className="text-4xl">🛴</span>
          </div>
          <p className="text-carbon/60 font-medium">Aucune trottinette dans votre garage</p>
          <p className="text-carbon/40 text-sm mt-1">
            Ajoutez votre première trottinette depuis la page d'accueil
          </p>
        </div>
      </div>
    );
  }

  const currentScooter = scooters[currentIndex];
  const model = currentScooter.scooter_model;
  const displayName = currentScooter.nickname || `${model.brand} ${model.name}`;

  return (
    <div className={cn("relative", className)}>
      {/* Main Carousel Container */}
      <div className="relative bg-white/60 border border-mineral/20 rounded-2xl overflow-hidden">
        
        {/* Carousel Content */}
        <div className="relative h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center p-8"
            >
              <div className="w-full max-w-4xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  
                  {/* Left: Image */}
                  <div className="relative">
                    {/* Brand Badge */}
                    <div className="absolute top-0 left-0 z-10 px-4 py-2 bg-mineral/10 backdrop-blur-sm rounded-full border border-mineral/20">
                      <span className="text-sm font-semibold text-mineral uppercase tracking-wider">
                        {model.brand}
                      </span>
                    </div>

                    {/* Scooter Image */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-greige/30">
                      {model.image_url ? (
                        <motion.img
                          src={model.image_url}
                          alt={displayName}
                          className="w-full h-full object-contain p-8"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-8xl opacity-30">🛴</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Info */}
                  <div className="space-y-6">
                    {/* Name */}
                    <div>
                      <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="font-display text-4xl text-carbon mb-2"
                      >
                        {displayName}
                      </motion.h2>
                      {currentScooter.nickname && (
                        <p className="text-carbon/50 text-sm">
                          {model.brand} {model.name}
                        </p>
                      )}
                    </div>

                    {/* Specs */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="grid grid-cols-3 gap-4"
                    >
                      {/* Speed */}
                      {model.max_speed_kmh && (
                        <div className="bg-greige/30 rounded-xl p-4 text-center">
                          <Zap className="w-6 h-6 text-mineral mx-auto mb-2" />
                          <p className="text-2xl font-bold text-carbon">{model.max_speed_kmh}</p>
                          <p className="text-xs text-carbon/50 mt-1">km/h</p>
                        </div>
                      )}

                      {/* Range */}
                      {model.range_km && (
                        <div className="bg-greige/30 rounded-xl p-4 text-center">
                          <Battery className="w-6 h-6 text-mineral mx-auto mb-2" />
                          <p className="text-2xl font-bold text-carbon">{model.range_km}</p>
                          <p className="text-xs text-carbon/50 mt-1">km</p>
                        </div>
                      )}

                      {/* Power */}
                      {model.power_watts && (
                        <div className="bg-greige/30 rounded-xl p-4 text-center">
                          <Zap className="w-6 h-6 text-mineral mx-auto mb-2" />
                          <p className="text-2xl font-bold text-carbon">{model.power_watts}</p>
                          <p className="text-xs text-carbon/50 mt-1">W</p>
                        </div>
                      )}
                    </motion.div>

                    {/* Added Date */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="flex items-center gap-2 text-carbon/50 text-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>
                        Ajouté le {new Date(currentScooter.added_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </motion.div>
                  </div>

                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Arrows */}
        {scooters.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border border-mineral/20 flex items-center justify-center hover:bg-white hover:border-mineral/40 transition-all duration-300 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6 text-carbon" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border border-mineral/20 flex items-center justify-center hover:bg-white hover:border-mineral/40 transition-all duration-300 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6 text-carbon" />
            </button>
          </>
        )}
      </div>

      {/* Dots Navigation */}
      {scooters.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {scooters.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={cn(
                "transition-all duration-300",
                index === currentIndex
                  ? "w-8 h-2 bg-mineral rounded-full"
                  : "w-2 h-2 bg-mineral/30 rounded-full hover:bg-mineral/50"
              )}
              aria-label={`Aller à la trottinette ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GarageScooterCarousel;
