import { motion } from 'framer-motion';
import { Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceWidgetProps {
  points: number;
  displayName: string;
  className?: string;
}

const PerformanceWidget = ({ points, displayName, className }: PerformanceWidgetProps) => {
  // Calculate performance level based on points
  const getPerformanceLevel = (pts: number) => {
    if (pts >= 1000) return { label: 'EXPERT', color: 'text-amber-500' };
    if (pts >= 500) return { label: 'AVANCÉ', color: 'text-mineral' };
    if (pts >= 100) return { label: 'INTERMÉDIAIRE', color: 'text-blue-500' };
    return { label: 'DÉBUTANT', color: 'text-slate-500' };
  };

  const level = getPerformanceLevel(points);
  const progressToNextLevel = Math.min((points % 500) / 5, 100);
  const pointsToNext = 500 - (points % 500);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={cn(
        "relative bg-white/60 border border-mineral/20 rounded-2xl p-6",
        "hover:shadow-lg hover:border-mineral/30 transition-all duration-300",
        className
      )}
    >
      {/* Horizontal Layout */}
      <div className="flex items-center justify-between gap-6">
        
        {/* Left: Icon and Title */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-mineral/10 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-mineral" />
          </div>
          <div>
            <h2 className="font-display text-xl text-carbon tracking-wide">
              PERFORMANCE
            </h2>
            <p className="text-xs text-carbon/50 mt-1">
              {displayName}
            </p>
          </div>
        </div>

        {/* Center: Points Display */}
        <div className="flex items-baseline gap-2">
          <motion.span
            className={cn("font-display text-5xl font-bold", level.color)}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {points.toLocaleString('fr-FR')}
          </motion.span>
          <span className="text-sm text-carbon/60">pts</span>
        </div>

        {/* Right: Level Badge and Progress */}
        <div className="flex flex-col items-end gap-3 min-w-[180px]">
          <div className="px-4 py-2 rounded-full border-2 border-mineral/30 bg-white/50">
            <span className={cn("font-display text-sm font-bold", level.color)}>
              {level.label}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full space-y-1">
            <div className="flex items-center justify-between text-xs text-carbon/50">
              <span>Progression</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-mineral" />
                <span className="text-mineral font-semibold">{Math.floor(progressToNextLevel)}%</span>
              </div>
            </div>
            <div className="h-2 bg-greige/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextLevel}%` }}
                transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
                className="h-full bg-mineral rounded-full"
              />
            </div>
            <p className="text-xs text-carbon/40 text-right">
              {pointsToNext} pts jusqu'au prochain niveau
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default PerformanceWidget;
