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
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {/* Voltage - Amber/Orange */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center"
      >
        <Zap className="w-5 h-5 text-amber-600 mx-auto mb-1" />
        <p className="text-2xl font-bold text-amber-700">{voltage || '-'}</p>
        <p className="text-xs text-amber-600/70 font-medium uppercase tracking-wide">V</p>
      </motion.div>

      {/* Amperage - Blue */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center"
      >
        <Gauge className="w-5 h-5 text-blue-600 mx-auto mb-1" />
        <p className="text-2xl font-bold text-blue-700">{amperage || '-'}</p>
        <p className="text-xs text-blue-600/70 font-medium uppercase tracking-wide">Ah</p>
      </motion.div>

      {/* Power - Emerald/Green */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center"
      >
        <Activity className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
        <p className="text-2xl font-bold text-emerald-700">{power || '-'}</p>
        <p className="text-xs text-emerald-600/70 font-medium uppercase tracking-wide">W</p>
      </motion.div>
    </div>
  );
};

export default TechnicalSpecs;
