import { motion } from 'framer-motion';
import { getScooterImage } from '@/lib/scooterImageMapping';
import { cn } from '@/lib/utils';

interface GarageScooter {
  id: string;
  scooter_model: {
    id: string;
    name: string;
    slug?: string;
    brand: string;
    image_url?: string | null;
    voltage?: number | null;
    amperage?: number | null;
  };
  nickname?: string | null;
  custom_photo_url?: string | null;
}

interface VerticalScooterThumbnailsProps {
  scooters: GarageScooter[];
  selectedScooterId: string | null;
  /** Callback now includes the index for sync */
  onScooterSelect: (scooter: GarageScooter, index: number) => void;
  className?: string;
}

const VerticalScooterThumbnails = ({ 
  scooters, 
  selectedScooterId, 
  onScooterSelect,
  className 
}: VerticalScooterThumbnailsProps) => {
  
  if (!scooters || scooters.length <= 1) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {scooters.map((scooter, index) => {
        const isSelected = scooter.id === selectedScooterId;
        const model = scooter.scooter_model;
        const image = getScooterImage(model.slug, model.image_url);

        return (
          <motion.button
            key={scooter.id}
            onClick={() => onScooterSelect(scooter, index)}
            className={cn(
              "relative w-24 h-20 rounded-lg overflow-hidden transition-all duration-300",
              "border-2 bg-white/60 backdrop-blur-sm",
              isSelected 
                ? "border-mineral shadow-md scale-105" 
                : "border-white/40 hover:border-mineral/40 hover:shadow-sm opacity-70 hover:opacity-100"
            )}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isSelected ? 1 : 0.7, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
          >
            {/* Background with garage floor effect */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'url(/garage-floor.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />

            {/* Scooter Image */}
            <div className="relative h-full flex items-center justify-center p-1">
              {image ? (
                <img
                  src={image}
                  alt={model.name}
                  className="w-full h-full object-contain drop-shadow-sm"
                />
              ) : (
                <div className="text-2xl">🛴</div>
              )}
            </div>

            {/* Voltage Badge */}
            {model.voltage && (
              <div className="absolute bottom-1 left-1 right-1">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[9px] px-1 py-0.5 bg-orange-100/90 text-orange-700 rounded font-semibold">
                    {model.voltage}V
                  </span>
                  {model.amperage && (
                    <span className="text-[9px] px-1 py-0.5 bg-blue-100/90 text-blue-700 rounded font-semibold">
                      {model.amperage}Ah
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Selected Indicator */}
            {isSelected && (
              <div className="absolute inset-0 border-2 border-mineral rounded-lg pointer-events-none" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default VerticalScooterThumbnails;
