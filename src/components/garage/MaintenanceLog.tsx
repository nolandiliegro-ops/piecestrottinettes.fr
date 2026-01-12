import { motion } from 'framer-motion';
import { Wrench, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaintenanceLogProps {
  scooters: Array<{
    id: string;
    scooter_model: {
      id: string;
      name: string;
      brand: string;
    };
    nickname?: string;
  }>;
  className?: string;
}

const MaintenanceLog = ({ scooters, className }: MaintenanceLogProps) => {
  // Common torque recommendations for scooter maintenance
  const torqueRecommendations = [
    { part: 'Guidon', torque: '15-20 Nm', priority: 'high' },
    { part: 'Roues', torque: '25-30 Nm', priority: 'high' },
    { part: 'Frein', torque: '8-12 Nm', priority: 'medium' },
    { part: 'Plateau', torque: '12-15 Nm', priority: 'medium' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={cn(
        "bg-white/60 border border-mineral/20 rounded-2xl p-6",
        "hover:shadow-lg hover:border-mineral/30 transition-all duration-300",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-mineral/10 flex items-center justify-center">
          <Wrench className="w-6 h-6 text-mineral" />
        </div>
        <div>
          <h2 className="font-display text-xl text-carbon tracking-wide">
            MAINTENANCE
          </h2>
          <p className="text-xs text-carbon/50">
            Couples de serrage recommandés
          </p>
        </div>
      </div>

      {/* Content */}
      {scooters.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-10 h-10 text-carbon/20 mx-auto mb-2" />
            <p className="text-carbon/40 text-sm">
              Ajoutez une trottinette pour voir les recommandations
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {torqueRecommendations.map((item, index) => (
            <motion.div
              key={item.part}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              className={cn(
                "group relative rounded-xl p-4 transition-all duration-300",
                "bg-greige/30 hover:bg-white/70",
                "border border-mineral/10 hover:border-mineral/30"
              )}
            >
              {/* Priority Indicator */}
              <div className="absolute top-3 right-3">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    item.priority === 'high' ? "bg-mineral" : "bg-mineral/40"
                  )}
                />
              </div>

              {/* Part Name */}
              <div className="mb-3">
                <h3 className="font-semibold text-carbon text-sm">
                  {item.part}
                </h3>
              </div>

              {/* Torque Value */}
              <div className="flex items-center gap-2">
                <span className="text-lg">⚙️</span>
                <div className="flex-1">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-bold text-mineral text-lg">
                      {item.torque}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer Note */}
      {scooters.length > 0 && (
        <div className="mt-6 pt-4 border-t border-mineral/10">
          <p className="text-xs text-carbon/40 text-center">
            Valeurs recommandées • Vérifiez toujours votre manuel d'utilisation
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default MaintenanceLog;
