import { motion } from 'framer-motion';
import { Zap, Gauge, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TechnicalSpecsProps {
  voltage?: number | null;
  amperage?: number | null;
  power?: number | null;
  className?: string;
}

const TechnicalSpecs = ({ voltage, amperage, power, className }: TechnicalSpecsProps) => {
  return (
    <div className={cn("grid grid-cols-3 gap-2 md:gap-3", className)}>
      {/* Voltage - Orange to Peach Gradient */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative bg-gradient-to-br from-orange-500/90 to-orange-300/80 rounded-xl md:rounded-2xl p-2 md:p-4 text-center overflow-hidden shadow-lg"
      >
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/20 mx-auto mb-1 md:mb-2 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
          </div>
          <p className="text-xl md:text-3xl font-bold text-white mb-0.5">{voltage || '-'}</p>
          <p className="text-[9px] md:text-xs text-white/80 font-semibold uppercase tracking-wider">VOLT</p>
        </div>
      </motion.div>

      {/* Amperage - Blue to Cyan Gradient */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="relative bg-gradient-to-br from-blue-500/90 to-cyan-400/80 rounded-xl md:rounded-2xl p-2 md:p-4 text-center overflow-hidden shadow-lg"
      >
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/20 mx-auto mb-1 md:mb-2 flex items-center justify-center">
            <Gauge className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
          </div>
          <p className="text-xl md:text-3xl font-bold text-white mb-0.5">{amperage || '-'}</p>
          <p className="text-[9px] md:text-xs text-white/80 font-semibold uppercase tracking-wider">AMP</p>
        </div>
      </motion.div>

      {/* Power - Green to Teal Gradient */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="relative bg-gradient-to-br from-emerald-500/90 to-teal-400/80 rounded-xl md:rounded-2xl p-2 md:p-4 text-center overflow-hidden shadow-lg"
      >
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/20 mx-auto mb-1 md:mb-2 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
          </div>
          <p className="text-xl md:text-3xl font-bold text-white mb-0.5">{power || '-'}</p>
          <p className="text-[9px] md:text-xs text-white/80 font-semibold uppercase tracking-wider">WATT</p>
        </div>
      </motion.div>
    </div>
  );
};

export default TechnicalSpecs;
