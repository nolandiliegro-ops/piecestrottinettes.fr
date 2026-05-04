import { motion } from 'framer-motion';
import { Zap, Gauge, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatTrioCardProps {
  voltage?: number | null;
  amperage?: number | null;
  power?: number | null;
  className?: string;
}

/**
 * Top-center trio of KPIs (Volt / Amp / Watt) in floating glass style.
 * Mockup-driven: 3 stat cards horizontal, dominant on desktop, scrollable on mobile.
 */
const Stat = ({
  icon: Icon,
  value,
  label,
  gradient,
  delay,
}: {
  icon: typeof Zap;
  value: number | string;
  label: string;
  gradient: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className={cn(
      'relative overflow-hidden rounded-2xl px-4 py-3 md:px-6 md:py-4',
      'bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl',
      'min-w-[90px] md:min-w-[110px]'
    )}
  >
    <div className="flex flex-col items-center gap-1">
      <div className={cn('w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center', gradient)}>
        <Icon className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-white" />
      </div>
      <p className="text-xl md:text-3xl font-black text-white leading-none">{value}</p>
      <p className="text-[9px] md:text-[10px] text-white/80 font-bold uppercase tracking-[0.2em]">
        {label}
      </p>
    </div>
  </motion.div>
);

const StatTrioCard = ({ voltage, amperage, power, className }: StatTrioCardProps) => {
  return (
    <div className={cn('flex items-center gap-2 md:gap-3', className)}>
      <Stat
        icon={Zap}
        value={voltage ?? '—'}
        label="Volt"
        gradient="bg-gradient-to-br from-orange-500 to-orange-300"
        delay={0.1}
      />
      <Stat
        icon={Gauge}
        value={amperage ?? '—'}
        label="Amp"
        gradient="bg-gradient-to-br from-blue-500 to-cyan-400"
        delay={0.2}
      />
      <Stat
        icon={Activity}
        value={power ?? '—'}
        label="Watt"
        gradient="bg-gradient-to-br from-emerald-500 to-teal-400"
        delay={0.3}
      />
    </div>
  );
};

export default StatTrioCard;
