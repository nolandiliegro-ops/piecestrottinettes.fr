import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Wrench, ArrowRight, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getScooterImage } from '@/lib/scooterImageMapping';
import ScooterPlaceholder from './ScooterPlaceholder';
import CustomPhotoButton from './CustomPhotoButton';
import VerticalScooterThumbnails from './VerticalScooterThumbnails';
import ScooterIdentity from './ScooterIdentity';
import { getBrandColors } from '@/contexts/ScooterContext';

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
  className?: string;
  /** Mobile clean mode: hide title inside carousel (shown externally as Block 3) */
  mobileCleanMode?: boolean;
}

const GarageScooterCarousel = ({ scooters, onScooterChange, className, mobileCleanMode = false }: GarageScooterCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCustomPhoto, setShowCustomPhoto] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handlePrevious = () => {
    const newIndex = currentIndex === 0 ? scooters.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    setShowCustomPhoto(false);
    onScooterChange?.(scooters[newIndex]);
  };

  const handleNext = () => {
    const newIndex = currentIndex === scooters.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    setShowCustomPhoto(false);
    onScooterChange?.(scooters[newIndex]);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    setShowCustomPhoto(false);
    onScooterChange?.(scooters[index]);
  };

  // Reset custom photo view and image error when scooter changes
  useEffect(() => {
    setShowCustomPhoto(false);
    setImageError(false);
  }, [currentIndex]);

  if (!scooters || scooters.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white/40 rounded-2xl">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-mineral/10 mx-auto flex items-center justify-center mb-3">
            <span className="text-3xl">🛴</span>
          </div>
          <p className="text-carbon/60 font-medium text-sm">Aucune trottinette</p>
          <p className="text-carbon/40 text-xs mt-1">
            Ajoutez-en une depuis l'accueil
          </p>
        </div>
      </div>
    );
  }

  const currentScooter = scooters[currentIndex];
  
  // Safety check: if scooter_model is null, show fallback
  if (!currentScooter?.scooter_model) {
    return (
      <div className="flex items-center justify-center h-full bg-white/40 rounded-2xl">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto flex items-center justify-center mb-3">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-carbon/60 font-medium text-sm">Données indisponibles</p>
          <p className="text-carbon/40 text-xs mt-1">
            Le modèle de cette trottinette n'a pas pu être chargé
          </p>
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
  
  // Get HD image: DB image_url first, then local mapping
  const officialImage = getScooterImage(model.slug, model.image_url);
  const customPhoto = currentScooter.custom_photo_url;
  const displayImage = showCustomPhoto && customPhoto ? customPhoto : officialImage;
  const hasCustomPhoto = !!customPhoto;

  return (
    <div className={cn("relative h-full flex flex-col md:flex-row gap-2", className)}>
      
      {/* Scooter Name - ABOVE image container on mobile (only when NOT in cleanMode) */}
      {!mobileCleanMode && (
        <div className="md:hidden text-center shrink-0">
          <h2 className="font-display text-base text-carbon bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border-[0.5px] border-mineral/20 inline-block">
            {displayName}
          </h2>
        </div>
      )}

      {/* Main Image Container */}
      <div 
        className={cn(
          "relative flex-1 bg-[#3A3A3A] border-[0.5px] border-white/10 rounded-2xl overflow-hidden shadow-xl",
          mobileCleanMode ? "min-h-[260px]" : "min-h-[250px] md:min-h-0"
        )}
        style={{ 
          backgroundImage: 'url(/garage-floor.png)', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      >
        
        {/* Brand Badge - Mobile Only (desktop uses ScooterIdentity) */}
        <div className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border-[0.5px] border-mineral/20 shadow-sm md:hidden">
          <span className="text-xs font-semibold text-mineral uppercase tracking-wider">
            {brandName}
          </span>
        </div>

        {/* Desktop Identity Block - Replaces simple badge */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 hidden md:flex">
          <ScooterIdentity
            brandName={brandName}
            modelName={model.name}
            nickname={currentScooter.nickname}
            variant="desktop"
            brandColors={getBrandColors(brandName)}
          />
        </div>

        {/* Studio Spotlight Container */}
        <div className="absolute inset-0">

          {/* Scooter Image with Premium Shadow - 40% LARGER */}
          <AnimatePresence mode="wait">
            {displayImage && !imageError ? (
              <motion.img
                key={showCustomPhoto ? 'custom' : 'official'}
                src={displayImage}
                alt={displayName}
                className="absolute inset-0 w-full h-full object-contain p-4 md:p-8 drop-shadow-[0_25px_50px_rgba(0,0,0,0.15)]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ transform: 'scale(1.05)' }}
                onError={() => setImageError(true)}
              />
            ) : (
              <ScooterPlaceholder />
            )}
          </AnimatePresence>

          {/* Floor Reflection/Shadow - Subtle */}
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-16 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 100% 100% at center, rgba(0,0,0,0.05) 0%, transparent 70%)"
            }}
          />
        </div>

        {/* Photo Controls - Bottom Left */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
          <CustomPhotoButton
            garageItemId={currentScooter.id}
            currentPhotoUrl={customPhoto}
          />
          
          {hasCustomPhoto && (
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
          )}
        </div>

        {/* Compatible Parts Link - Bottom Right */}
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

        {/* Navigation Arrows - z-30 to prevent overlap */}
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

      {/* Vertical Thumbnails - DESKTOP ONLY */}
      {scooters.length > 1 && (
        <div className="hidden md:flex">
          <VerticalScooterThumbnails
            scooters={scooters}
            selectedScooterId={currentScooter.id}
            onScooterSelect={(scooter) => {
              const newIndex = scooters.findIndex(s => s.id === scooter.id);
              if (newIndex !== -1) {
                setCurrentIndex(newIndex);
                setShowCustomPhoto(false);
                onScooterChange?.(scooter);
              }
            }}
          />
        </div>
      )}
      
      {/* Horizontal Thumbnails - MOBILE ONLY */}
      {scooters.length > 1 && (
        <div className="flex md:hidden overflow-x-auto scrollbar-none gap-2 py-2 shrink-0">
          {scooters.map((scooter, index) => {
            const isSelected = scooter.id === currentScooter.id;
            const scooterModel = scooter.scooter_model;
            const image = getScooterImage(scooterModel.slug, scooterModel.image_url);

            return (
              <button
                key={scooter.id}
                onClick={() => handleDotClick(index)}
                className={cn(
                  "relative flex-shrink-0 w-16 h-14 rounded-lg overflow-hidden transition-all min-h-[44px]",
                  "border-[0.5px] bg-white/60 backdrop-blur-sm",
                  isSelected 
                    ? "border-mineral shadow-md" 
                    : "border-white/40 opacity-70"
                )}
              >
                {image ? (
                  <img src={image} alt={scooterModel.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="text-2xl flex items-center justify-center h-full">🛴</span>
                )}
                {scooterModel.voltage && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] px-1 py-0.5 bg-orange-100/90 text-orange-700 rounded">
                    {scooterModel.voltage}V
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GarageScooterCarousel;
