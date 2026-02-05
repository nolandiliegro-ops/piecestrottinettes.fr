import { motion } from "framer-motion";
import { Zap, Gauge, Battery, Route } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ScooterDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  scooterName: string;
  brandName: string;
  description: string;
  specs?: {
    power_watts?: number | null;
    range_km?: number | null;
    max_speed_kmh?: number | null;
    voltage?: number | null;
  };
}

const ScooterDescriptionModal = ({
  isOpen,
  onClose,
  scooterName,
  brandName,
  description,
  specs
}: ScooterDescriptionModalProps) => {
  const hasSpecs = specs && (specs.power_watts || specs.range_km || specs.max_speed_kmh || specs.voltage);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white/95 backdrop-blur-xl border-mineral/20">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-mineral/10 text-mineral text-xs font-semibold rounded-full uppercase tracking-wider">
              {brandName}
            </span>
          </div>
          <DialogTitle className="font-display text-2xl text-carbon">
            {scooterName}
          </DialogTitle>
        </DialogHeader>

        {/* Description complète */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4"
        >
          <p className="text-carbon/80 leading-relaxed whitespace-pre-line">
            {description}
          </p>
        </motion.div>

        {/* Quick Specs Grid */}
        {hasSpecs && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 grid grid-cols-2 gap-3"
          >
            {specs.power_watts && (
              <div className="flex items-center gap-3 p-3 bg-greige/50 rounded-xl border border-carbon/5">
                <div className="w-10 h-10 rounded-full bg-mineral/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-mineral" />
                </div>
                <div>
                  <p className="text-[10px] text-carbon/50 uppercase tracking-wider">Puissance</p>
                  <p className="font-semibold text-carbon">{specs.power_watts}W</p>
                </div>
              </div>
            )}
            
            {specs.range_km && (
              <div className="flex items-center gap-3 p-3 bg-greige/50 rounded-xl border border-carbon/5">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Route className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] text-carbon/50 uppercase tracking-wider">Autonomie</p>
                  <p className="font-semibold text-carbon">{specs.range_km} km</p>
                </div>
              </div>
            )}
            
            {specs.max_speed_kmh && (
              <div className="flex items-center gap-3 p-3 bg-greige/50 rounded-xl border border-carbon/5">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] text-carbon/50 uppercase tracking-wider">Vitesse max</p>
                  <p className="font-semibold text-carbon">{specs.max_speed_kmh} km/h</p>
                </div>
              </div>
            )}
            
            {specs.voltage && (
              <div className="flex items-center gap-3 p-3 bg-greige/50 rounded-xl border border-carbon/5">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Battery className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-carbon/50 uppercase tracking-wider">Voltage</p>
                  <p className="font-semibold text-carbon">{specs.voltage}V</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScooterDescriptionModal;
