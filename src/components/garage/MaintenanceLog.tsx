import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaintenanceSpec {
  part: string;
  torque: string;
  priority: 'high' | 'medium' | 'low';
  icon?: string;
}

interface SelectedScooter {
  id: string;
  scooter_model: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    voltage?: number;
  };
  nickname?: string;
}

interface MaintenanceLogProps {
  selectedScooter: SelectedScooter | null;
  className?: string;
}

// Maintenance specifications mapping by scooter slug
// Scalable: Can be moved to Supabase later
const maintenanceSpecs: Record<string, MaintenanceSpec[]> = {
  // Xiaomi Models (8.5", 36V, lighter build)
  "mi-pro-2": [
    { part: 'Guidon', torque: '18-22 Nm', priority: 'high', icon: '🔧' },
    { part: 'Roues 8.5"', torque: '20-25 Nm', priority: 'high', icon: '⚙️' },
    { part: 'Frein arrière', torque: '6-8 Nm', priority: 'medium', icon: '🛑' },
    { part: 'Plateau pliable', torque: '15-18 Nm', priority: 'high', icon: '📐' },
  ],
  "mi-3": [
    { part: 'Guidon', torque: '18-22 Nm', priority: 'high', icon: '🔧' },
    { part: 'Roues 8.5"', torque: '20-25 Nm', priority: 'high', icon: '⚙️' },
    { part: 'Frein à disque', torque: '8-10 Nm', priority: 'medium', icon: '🛑' },
    { part: 'Plateau', torque: '15-18 Nm', priority: 'medium', icon: '📐' },
  ],
  "mi-essential": [
    { part: 'Guidon', torque: '15-18 Nm', priority: 'high', icon: '🔧' },
    { part: 'Roues 8.5"', torque: '18-22 Nm', priority: 'high', icon: '⚙️' },
    { part: 'Frein', torque: '5-7 Nm', priority: 'medium', icon: '🛑' },
    { part: 'Plateau', torque: '12-15 Nm', priority: 'medium', icon: '📐' },
  ],

  // Ninebot/Segway Models (10", higher power, reinforced)
  "g30-max": [
    { part: 'Guidon renforcé', torque: '25-30 Nm', priority: 'high', icon: '🔧' },
    { part: 'Roues 10"', torque: '30-35 Nm', priority: 'high', icon: '⚙️' },
    { part: 'Frein à tambour', torque: '10-12 Nm', priority: 'high', icon: '🛑' },
    { part: 'Plateau renforcé', torque: '20-25 Nm', priority: 'medium', icon: '📐' },
    { part: 'Béquille', torque: '12-15 Nm', priority: 'low', icon: '🦵' },
  ],
  "max-g2": [
    { part: 'Guidon', torque: '25-28 Nm', priority: 'high', icon: '🔧' },
    { part: 'Roues 10"', torque: '28-32 Nm', priority: 'high', icon: '⚙️' },
    { part: 'Frein régénératif', torque: '8-10 Nm', priority: 'medium', icon: '🛑' },
    { part: 'Plateau', torque: '18-22 Nm', priority: 'medium', icon: '📐' },
  ],
  "f40": [
    { part: 'Guidon', torque: '22-26 Nm', priority: 'high', icon: '🔧' },
    { part: 'Roues 10"', torque: '28-32 Nm', priority: 'high', icon: '⚙️' },
    { part: 'Frein électrique', torque: '8-10 Nm', priority: 'medium', icon: '🛑' },
    { part: 'Plateau', torque: '18-22 Nm', priority: 'medium', icon: '📐' },
  ],
  "p100s": [
    { part: 'Guidon', torque: '28-32 Nm', priority: 'high', icon: '🔧' },
    { part: 'Roues 11"', torque: '35-40 Nm', priority: 'high', icon: '⚙️' },
    { part: 'Freins à disque x2', torque: '12-15 Nm', priority: 'high', icon: '🛑' },
    { part: 'Plateau renforcé', torque: '22-26 Nm', priority: 'medium', icon: '📐' },
  ],

  // Kaabo Models (Performance, heavy-duty)
  "mantis-pro": [
    { part: 'Guidon double', torque: '30-35 Nm', priority: 'high', icon: '🔧' },
    { part: 'Roues 10"', torque: '35-40 Nm', priority: 'high', icon: '⚙️' },
    { part: 'Freins hydrauliques', torque: '15-18 Nm', priority: 'high', icon: '🛑' },
    { part: 'Suspension avant', torque: '25-30 Nm', priority: 'high', icon: '🔩' },
    { part: 'Suspension arrière', torque: '25-30 Nm', priority: 'high', icon: '🔩' },
  ],
  "wolf-warrior": [
    { part: 'Guidon renforcé', torque: '35-40 Nm', priority: 'high', icon: '🔧' },
    { part: 'Roues 11"', torque: '40-45 Nm', priority: 'high', icon: '⚙️' },
    { part: 'Freins hydrauliques', torque: '18-22 Nm', priority: 'high', icon: '🛑' },
    { part: 'Suspension double', torque: '30-35 Nm', priority: 'high', icon: '🔩' },
    { part: 'Châssis', torque: '35-40 Nm', priority: 'medium', icon: '🛡️' },
  ],

  // Dualtron Models (Extreme performance)
  "thunder": [
    { part: 'Guidon EY3', torque: '35-40 Nm', priority: 'high', icon: '🔧' },
    { part: 'Roues 11"', torque: '45-50 Nm', priority: 'high', icon: '⚙️' },
    { part: 'Freins hydrauliques', torque: '20-25 Nm', priority: 'high', icon: '🛑' },
    { part: 'Suspension caoutchouc', torque: '30-35 Nm', priority: 'high', icon: '🔩' },
    { part: 'Batterie', torque: '8-10 Nm', priority: 'medium', icon: '🔋' },
  ],
  "victor": [
    { part: 'Guidon', torque: '32-38 Nm', priority: 'high', icon: '🔧' },
    { part: 'Roues 10"', torque: '40-45 Nm', priority: 'high', icon: '⚙️' },
    { part: 'Freins à disque', torque: '18-22 Nm', priority: 'high', icon: '🛑' },
    { part: 'Suspension', torque: '28-32 Nm', priority: 'high', icon: '🔩' },
  ],

  // Default fallback
  "default": [
    { part: 'Guidon', torque: '20-25 Nm', priority: 'high', icon: '🔧' },
    { part: 'Roues', torque: '25-30 Nm', priority: 'high', icon: '⚙️' },
    { part: 'Frein', torque: '8-12 Nm', priority: 'medium', icon: '🛑' },
    { part: 'Plateau', torque: '15-20 Nm', priority: 'medium', icon: '📐' },
  ],
};

const MaintenanceLog = ({ selectedScooter, className }: MaintenanceLogProps) => {
  // Get specs for this model
  const slug = selectedScooter?.scooter_model?.slug || 'default';
  const specs = maintenanceSpecs[slug] || maintenanceSpecs['default'];
  const modelName = selectedScooter?.scooter_model 
    ? `${selectedScooter.scooter_model.brand} ${selectedScooter.scooter_model.name}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={cn(
        "bg-white/60 border border-mineral/20 rounded-2xl p-4 flex flex-col",
        "hover:shadow-lg hover:border-mineral/30 transition-all duration-300",
        className
      )}
    >
      {/* Header - Compact */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-mineral/10 flex items-center justify-center">
          <Wrench className="w-4 h-4 text-mineral" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-sm text-carbon tracking-wide">
            MAINTENANCE
          </h2>
          <AnimatePresence mode="wait">
            <motion.p 
              key={modelName || 'default'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-carbon/50 truncate"
            >
              {modelName ? modelName : 'Couples de serrage'}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!selectedScooter ? (
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-carbon/20 mx-auto mb-2" />
              <p className="text-carbon/40 text-xs">
                Ajoutez une trottinette
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={slug}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              {specs.map((item, index) => (
                <motion.div
                  key={`${slug}-${item.part}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={cn(
                    "group relative rounded-lg p-2.5 transition-all duration-300",
                    "bg-greige/30 hover:bg-white/70",
                    "border border-mineral/10 hover:border-mineral/30"
                  )}
                >
                  {/* Compact Layout */}
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.icon || '⚙️'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-carbon text-xs truncate">
                        {item.part}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-mineral text-sm">
                        {item.torque}
                      </span>
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          item.priority === 'high' ? "bg-mineral" : 
                          item.priority === 'medium' ? "bg-mineral/50" : "bg-mineral/30"
                        )}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Footer Note - Compact */}
      {selectedScooter && (
        <div className="mt-2 pt-2 border-t border-mineral/10 shrink-0">
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3 text-carbon/30 flex-shrink-0" />
            <p className="text-[10px] text-carbon/40 truncate">
              Vérifiez votre manuel
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MaintenanceLog;
