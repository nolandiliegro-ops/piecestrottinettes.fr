import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Wrench, Trophy, Package, MessageCircle, Sparkles } from 'lucide-react';
import { useGarageModifications } from '@/hooks/useGarageModifications';
import DifficultyIndicator from '@/components/parts/DifficultyIndicator';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface GarageTimelineProps {
  garageItemId: string;
  className?: string;
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Timeline Card Component
const TimelineCard = ({ 
  modification, 
  index, 
  isFirst 
}: { 
  modification: any; 
  index: number; 
  isFirst: boolean;
}) => {
  // Detect if this was a first-in-category installation (bonus XP indicator)
  const hasFirstBonus = modification.xp_earned >= 30;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="relative"
    >
      {/* Timeline dot */}
      <div className={cn(
        "absolute -left-[1.35rem] w-3 h-3 rounded-full border-2 border-white shadow-sm",
        isFirst ? "bg-mineral" : "bg-mineral/50"
      )} />

      {/* Card */}
      <motion.div
        whileHover={{ scale: 1.01, x: 4 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="bg-white/80 backdrop-blur-sm border border-carbon/10 rounded-xl p-4
                   hover:shadow-lg hover:border-mineral/30 transition-all cursor-pointer"
      >
        <div className="flex gap-4">
          {/* Part Image */}
          <div className="w-16 h-16 rounded-lg bg-greige overflow-hidden flex-shrink-0">
            {modification.part?.image_url ? (
              <img 
                src={modification.part.image_url} 
                alt={modification.part.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-carbon/20" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name & XP */}
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-carbon text-sm line-clamp-2">
                {modification.part?.name || 'Pièce inconnue'}
              </h4>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* First in category badge */}
                {hasFirstBonus && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full">
                    <Sparkles className="w-2.5 h-2.5 text-amber-800" />
                    <span className="text-[9px] font-bold text-amber-800">First!</span>
                  </div>
                )}
                {/* XP Badge */}
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-full">
                  <Trophy className="w-3 h-3 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700">
                    +{modification.xp_earned} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Date & Difficulty */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs text-carbon/50">
                <Calendar className="w-3 h-3" />
                {formatDate(modification.installed_at)}
              </div>
              {modification.difficulty_level && (
                <DifficultyIndicator 
                  level={modification.difficulty_level} 
                  variant="compact" 
                />
              )}
            </div>

            {/* Notes */}
            {modification.notes && (
              <div className="mt-2 flex items-start gap-1.5">
                <MessageCircle className="w-3 h-3 text-carbon/30 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-carbon/60 italic line-clamp-2">
                  "{modification.notes}"
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="w-48 h-4" />
        <Skeleton className="w-24 h-3" />
      </div>
    </div>
    <div className="pl-4 border-l-2 border-mineral/20 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative">
          <Skeleton className="absolute -left-[1.35rem] w-3 h-3 rounded-full" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

// Empty State
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/60 backdrop-blur-sm border border-mineral/20 rounded-2xl p-8 text-center"
  >
    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-mineral/10 to-mineral/5
                    flex items-center justify-center">
      <Sparkles className="w-8 h-8 text-mineral/40" />
    </div>
    <h3 className="font-display text-sm text-carbon mb-2 uppercase tracking-wide">
      Aucune modification enregistrée
    </h3>
    <p className="text-xs text-carbon/50 max-w-[250px] mx-auto">
      Installez des pièces et documentez vos modifications pour gagner des XP
    </p>
  </motion.div>
);

// Main Component
const GarageTimeline = ({ garageItemId, className }: GarageTimelineProps) => {
  const { data: modifications, isLoading } = useGarageModifications(garageItemId);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!modifications || modifications.length === 0) {
    return <EmptyState />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("space-y-4", className)}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mineral/20 to-mineral/5 
                        flex items-center justify-center">
          <Wrench className="w-5 h-5 text-mineral" />
        </div>
        <div>
          <h3 className="font-display text-sm text-carbon uppercase tracking-wide">
            Historique des Modifications
          </h3>
          <p className="text-xs text-carbon/50">
            {modifications.length} pièce{modifications.length > 1 ? 's' : ''} installée{modifications.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-4 border-l-2 border-mineral/20 space-y-4">
        <AnimatePresence>
          {modifications.map((mod, index) => (
            <TimelineCard 
              key={mod.id} 
              modification={mod} 
              index={index}
              isFirst={index === 0}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default GarageTimeline;
