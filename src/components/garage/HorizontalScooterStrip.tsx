import { motion } from 'framer-motion';
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

interface HorizontalScooterStripProps {
  scooters: GarageScooter[];
  selectedScooterId: string | null;
  onScooterSelect: (scooter: GarageScooter) => void;
  className?: string;
}

const HorizontalScooterStrip = ({
  scooters,
  selectedScooterId,
  onScooterSelect,
  className,
}: HorizontalScooterStripProps) => {
  if (!scooters || scooters.length <= 1) return null;

  return (
    <div className={cn("w-full overflow-x-auto scrollbar-hide py-2", className)}>
      <div className="flex gap-3 px-1 justify-center">
        {scooters.map((scooter, index) => {
          const isSelected = scooter.id === selectedScooterId;
          const model = scooter.scooter_model;
          const image = model.image_url || '/placeholder.svg';

          return (
            <motion.button
              key={scooter.id}
              onClick={() => onScooterSelect(scooter)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              whileHover={{ scale: 1.08, y: -4 }}
              className={cn(
                "relative flex-shrink-0 w-28 rounded-xl overflow-hidden transition-all duration-300",
                "border bg-white/60 backdrop-blur-sm flex flex-col items-center",
                isSelected
                  ? "border-mineral shadow-lg scale-105 ring-2 ring-mineral/20"
                  : "border-white/40 opacity-70 hover:opacity-100 hover:shadow-md"
              )}
            >
              {/* Scooter image */}
              <div className="h-16 w-full flex items-center justify-center p-1.5">
                <img
                  src={image}
                  alt={model.name}
                  className="w-full h-full object-contain drop-shadow-sm"
                />
              </div>

              {/* Model name */}
              <div className="w-full px-1.5 pb-1.5">
                <p className="text-[9px] font-semibold text-carbon/70 text-center truncate leading-tight">
                  {model.name}
                </p>
                {model.voltage && (
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="text-[8px] px-1 py-px bg-orange-100/90 text-orange-700 rounded font-semibold">
                      {model.voltage}V
                    </span>
                  </div>
                )}
              </div>

              {/* Active indicator bar */}
              {isSelected && (
                <motion.div
                  layoutId="strip-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-mineral rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default HorizontalScooterStrip;
