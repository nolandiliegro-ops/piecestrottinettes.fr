import { motion } from 'framer-motion';
import { forwardRef } from 'react';
import { Battery, Gauge, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScooterCardProps {
  scooter: {
    id: string;
    scooter_model: {
      id: string;
      name: string;
      brand: string;
      image?: string;
      max_speed_kmh?: number;
      max_range_km?: number;
      power_w?: number;
    };
    nickname?: string;
    added_at: string;
  };
  index: number;
  className?: string;
}

const ScooterCard = forwardRef<HTMLDivElement, ScooterCardProps>(
  ({ scooter, index, className }, ref) => {
    const model = scooter.scooter_model;
    const displayName = scooter.nickname || `${model.brand} ${model.name}`;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: index * 0.1,
        }}
        className={cn(
          "group relative rounded-2xl p-5 transition-all duration-300",
          "bg-white/60 border border-mineral/20",
          "hover:shadow-lg hover:border-mineral/40",
          className
        )}
      >
        {/* Brand Badge */}
        <div className="absolute top-4 left-4 px-3 py-1 bg-mineral/10 rounded-full border border-mineral/20">
          <span className="text-xs font-semibold text-mineral uppercase tracking-wider">
            {model.brand}
          </span>
        </div>

        {/* Image Container */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-greige/30 mb-4 mt-8">
          {model.image ? (
            <img
              src={model.image}
              alt={displayName}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl opacity-30">🛴</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Name */}
          <h3 className="font-display text-lg text-carbon">
            {displayName}
          </h3>

          {/* Model Name if nickname exists */}
          {scooter.nickname && (
            <p className="text-xs text-carbon/50">
              {model.brand} {model.name}
            </p>
          )}

          {/* Specs - Simple Grid */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-mineral/10">
            {/* Power */}
            {model.power_w && (
              <div className="flex flex-col items-center gap-1">
                <Zap className="w-4 h-4 text-mineral" />
                <span className="text-xs font-semibold text-carbon">
                  {model.power_w}W
                </span>
              </div>
            )}

            {/* Speed */}
            {model.max_speed_kmh && (
              <div className="flex flex-col items-center gap-1">
                <Gauge className="w-4 h-4 text-mineral" />
                <span className="text-xs font-semibold text-carbon">
                  {model.max_speed_kmh}km/h
                </span>
              </div>
            )}

            {/* Range */}
            {model.max_range_km && (
              <div className="flex flex-col items-center gap-1">
                <Battery className="w-4 h-4 text-mineral" />
                <span className="text-xs font-semibold text-carbon">
                  {model.max_range_km}km
                </span>
              </div>
            )}
          </div>

          {/* Added Date */}
          <div className="pt-2">
            <p className="text-xs text-carbon/40">
              Ajouté le {new Date(scooter.added_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }
);

ScooterCard.displayName = 'ScooterCard';

export default ScooterCard;
