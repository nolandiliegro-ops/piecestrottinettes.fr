import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getXPLevel, getProgressToNextLevel } from '@/lib/xpLevels';
import { Progress } from '@/components/ui/progress';

interface PerformanceWidgetProps {
  points: number;
  displayName: string;
  className?: string;
}

const PerformanceWidget = ({ points, displayName, className }: PerformanceWidgetProps) => {
  const level = getXPLevel(points);
  const progress = getProgressToNextLevel(points);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={cn(
        "relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl",
        "hover:shadow-lg hover:border-mineral/30 transition-all duration-300",
        className
      )}
    >
      {/* Horizontal Layout */}
      <div className="flex items-center justify-between gap-6">
        
        {/* Left: Icon and Level Info */}
        <div className="flex items-center gap-4">
          <motion.div 
            className={cn("w-14 h-14 rounded-xl flex items-center justify-center", level.bgColor)}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Trophy className={cn("w-7 h-7", level.color)} />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("font-display text-xl font-bold", level.color)}>
                {level.name}
              </span>
              <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
                LVL {level.level}
              </span>
            </div>
            <p className="text-xs text-white/50 mt-1">
              {displayName}
            </p>
          </div>
        </div>

        {/* Center: Points Display */}
        <div className="flex items-baseline gap-2">
          <motion.span
            className={cn("font-display text-4xl md:text-5xl font-bold", level.color)}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {points.toLocaleString('fr-FR')}
          </motion.span>
          <span className="text-sm text-white/60">XP</span>
        </div>

        {/* Right: Progress Bar */}
        <div className="flex flex-col items-end gap-3 min-w-[200px]">
          {/* Progress Header */}
          <div className="w-full flex items-center justify-between text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Progression
            </span>
            <span className={cn("font-semibold", level.color)}>
              {progress.percentage}%
            </span>
          </div>
          
          {/* Animated Progress Bar */}
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                level.level === 1 && "bg-slate-500",
                level.level === 2 && "bg-blue-500",
                level.level === 3 && "bg-mineral",
                level.level === 4 && "bg-gradient-to-r from-amber-500 to-yellow-400"
              )}
            />
          </div>
          
          {/* Next Level Info */}
          {progress.nextLevel ? (
            <p className="text-xs text-white/40 text-right">
              Plus que <span className="text-white/70 font-semibold">{progress.pointsToNext} XP</span> avant{' '}
              <span className={cn("font-semibold", progress.nextLevel.color)}>
                {progress.nextLevel.name}
              </span>
            </p>
          ) : (
            <p className="text-xs text-amber-400/80 text-right flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Niveau maximum atteint !
            </p>
          )}
        </div>

      </div>
    </motion.div>
  );
};

export default PerformanceWidget;
