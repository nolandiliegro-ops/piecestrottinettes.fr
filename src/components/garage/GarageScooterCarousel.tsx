import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Wrench, ArrowRight, ImageIcon, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import ScooterPlaceholder from './ScooterPlaceholder';
import CustomPhotoButton from './CustomPhotoButton';
import HorizontalScooterStrip from './HorizontalScooterStrip';
import DeleteScooterButton from './DeleteScooterButton';
import ScooterIdentity from './ScooterIdentity';

interface GarageScooter {
  id: string;
  scooter_model: {
    id: string;
    name: string;
    slug?: string;
    brand: string;
    image_url?: string | null;
    max_speed_kmh?: number | null;
    range_km?: number | null;
    power_watts?: number | null;
    voltage?: number | null;
    amperage?: number | null;
    youtube_video_id?: string | null;
    compatible_parts_count?: number | null;
  };
  nickname?: string | null;
  added_at?: string | null;
  is_owned?: boolean;
  current_km?: number | null;
  custom_photo_url?: string | null;
}

interface GarageScooterCarouselProps {
  scooters: GarageScooter[];
  onScooterChange?: (scooter: GarageScooter) => void;
  onDelete?: () => void;
  className?: string;
  mobileCleanMode?: boolean;
  floating?: boolean;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95
  })
};

const slideTransition = {
  x: { type: 'spring' as const, stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
  scale: { duration: 0.3 }
};

const GarageScooterCarousel = ({ scooters, onScooterChange, onDelete, className, mobileCleanMode = false, floating = false }: GarageScooterCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [showCustomPhoto, setShowCustomPhoto] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handlePrevious = () => {
    setDirection(-1);
    const newIndex = currentIndex === 0 ? scooters.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    setShowCustomPhoto(false);
    onScooterChange?.(scooters[newIndex]);
  };

  const handleNext = () => {
    setDirection(1);
    const newIndex = currentIndex === scooters.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    setShowCustomPhoto(false);
    onScooterChange?.(scooters[newIndex]);
  };

  const handleStripSelect = (scooter: GarageScooter) => {
    const newIndex = scooters.findIndex(s => s.id === scooter.id);
    if (newIndex !== -1) {
      setDirection(newIndex > currentIndex ? 1 : -1);
      setCurrentIndex(newIndex);
      setShowCustomPhoto(false);
      onScooterChange?.(scooter);
    }
  };

  useEffect(() => {
    setShowCustomPhoto(false);
    setImageError(false);
  }, [currentIndex]);

  // Reset index when scooters change (e.g. after delete)
  useEffect(() => {
    if (scooters.length > 0 && currentIndex >= scooters.length) {
      setCurrentIndex(scooters.length - 1);
    }
  }, [scooters.length, currentIndex]);

  if (!scooters || scooters.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white/40 rounded-3xl">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-mineral/10 mx-auto flex items-center justify-center mb-3">
            <span className="text-3xl">🛴</span>
          </div>
          <p className="text-carbon/60 font-medium text-sm">Aucune trottinette</p>
          <p className="text-carbon/40 text-xs mt-1">Ajoutez-en une depuis l'accueil</p>
        </div>
      </div>
    );
  }

  const currentScooter = scooters[currentIndex];
  
  if (!currentScooter?.scooter_model) {
    return (
      <div className="flex items-center justify-center h-full bg-white/40 rounded-3xl">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto flex items-center justify-center mb-3">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-carbon/60 font-medium text-sm">Données indisponibles</p>
        </div>
      </div>
    );
  }
  
  const model = currentScooter.scooter_model;
  const safeBrandName = (brand: unknown) => {
    if (typeof brand === "string") return brand;
    if (brand && typeof brand === "object" && "name" in (brand as any)) return (brand as any).name as string;
    return "Unknown";
  };
  const brandName = safeBrandName((model as any).brand);
  const displayName = currentScooter.nickname || `${brandName} ${model.name}`;
  const officialImage = model.image_url || '/placeholder.svg';
  const customPhoto = currentScooter.custom_photo_url;
  const displayImage = showCustomPhoto && customPhoto ? customPhoto : officialImage;
  const hasCustomPhoto = !!customPhoto;

  return (
    <div className={cn("relative flex flex-col gap-3", className)}>
      
      {/* Scooter Name - ABOVE image on mobile (only when NOT in cleanMode) */}
      {!mobileCleanMode && (
        <div className="md:hidden text-center shrink-0">
          <h2 className="font-display text-base text-carbon bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border-[0.5px] border-mineral/20 inline-block">
            {displayName}
          </h2>
        </div>
      )}

      {/* HERO Image Container — Ultra-Premium */}
      <div 
        className={cn(
          "relative rounded-3xl overflow-hidden shadow-2xl border border-white/10",
          mobileCleanMode ? "h-[360px] md:h-[500px]" : "h-[360px] md:h-[500px] lg:h-[550px]"
        )}
        style={{
          background: 'radial-gradient(ellipse 120% 80% at 50% 40%, rgba(147,181,161,0.08) 0%, rgba(58,58,58,1) 60%)',
        }}
      >
        {/* Garage floor texture */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'url(/garage-floor.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Studio Spotlight radial overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.06) 0%, transparent 60%)',
          }}
        />

        {/* Delete Button - Top Right */}
        <div className="absolute top-3 right-3 z-20">
          <DeleteScooterButton
            garageItemId={currentScooter.id}
            modelName={`${brandName} ${model.name}`}
            onDeleted={onDelete}
          />
        </div>

        {/* Brand Badge - Mobile Only */}
        <div className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border-[0.5px] border-mineral/20 shadow-sm md:hidden">
          <span className="text-xs font-semibold text-mineral uppercase tracking-wider">
            {brandName}
          </span>
        </div>

        {/* Desktop Identity Block */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 hidden md:flex">
          <ScooterIdentity
            brandName={brandName}
            modelName={model.name}
            nickname={currentScooter.nickname}
            variant="desktop"
          />
        </div>

        {/* Scooter Image */}
        <div className="absolute inset-0">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            {displayImage && !imageError ? (
              <motion.img
                key={`${currentScooter.id}-${showCustomPhoto ? 'custom' : 'official'}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                src={displayImage}
                alt={displayName}
                className="absolute inset-0 w-full h-full object-contain p-6 md:p-12 drop-shadow-[0_30px_60px_rgba(0,0,0,0.2)]"
                onError={() => setImageError(true)}
              />
            ) : (
              <ScooterPlaceholder />
            )}
          </AnimatePresence>

          {/* Floor shadow */}
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-20 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 100% 100% at center, rgba(0,0,0,0.08) 0%, transparent 70%)"
            }}
          />
        </div>

        {/* Upload Overlay — when no custom photo */}
        {!hasCustomPhoto && (
          <div className="absolute bottom-3 left-3 z-10">
            <CustomPhotoButton
              garageItemId={currentScooter.id}
              currentPhotoUrl={customPhoto}
              className="!px-4 !py-2.5 !text-sm !gap-2.5 !bg-white/90 !border-mineral/40 hover:!bg-white hover:!shadow-lg"
            />
          </div>
        )}

        {/* Photo Controls — when custom photo exists */}
        {hasCustomPhoto && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
            <CustomPhotoButton
              garageItemId={currentScooter.id}
              currentPhotoUrl={customPhoto}
            />
            <button
              onClick={() => setShowCustomPhoto(!showCustomPhoto)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full border shadow-sm text-sm font-medium transition-all",
                showCustomPhoto 
                  ? "bg-mineral text-white border-mineral"
                  : "bg-white/80 backdrop-blur-sm text-carbon border-mineral/30 hover:bg-white"
              )}
            >
              <ImageIcon className="w-4 h-4" />
              <span>{showCustomPhoto ? 'Officielle' : 'Ma photo'}</span>
            </button>
          </div>
        )}

        {/* Compatible Parts Link */}
        <div className="absolute bottom-3 right-3 z-10">
          <Link 
            to={`/catalogue?scooter=${model.id}`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-mineral/20 hover:bg-white hover:border-mineral/40 transition-all group text-sm"
          >
            <Wrench className="w-4 h-4 text-mineral" />
            <span className="text-carbon font-medium">Pièces</span>
            <span className="px-2 py-0.5 rounded-full bg-mineral text-white text-xs font-semibold">
              {model.compatible_parts_count || "?"}
            </span>
            <ArrowRight className="w-3 h-3 text-mineral opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>

        {/* Navigation Arrows */}
        {scooters.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-mineral/20 flex items-center justify-center hover:bg-white hover:border-mineral/40 transition-all duration-300 hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5 text-carbon" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-mineral/20 flex items-center justify-center hover:bg-white hover:border-mineral/40 transition-all duration-300 hover:scale-110"
            >
              <ChevronRight className="w-5 h-5 text-carbon" />
            </button>
          </>
        )}
      </div>

      {/* Horizontal Scooter Strip — BELOW Hero */}
      <HorizontalScooterStrip
        scooters={scooters}
        selectedScooterId={currentScooter.id}
        onScooterSelect={handleStripSelect}
      />
    </div>
  );
};

export default GarageScooterCarousel;
