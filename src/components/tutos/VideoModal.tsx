import { motion, AnimatePresence } from "framer-motion";
import { X, Clock } from "lucide-react";

interface Tutorial {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  youtube_video_id: string;
  difficulty: number;
  duration_minutes: number;
  scooter_model_id: string | null;
  scooter?: {
    name: string;
    slug: string;
    brand?: {
      name: string;
    } | null;
  } | null;
}

interface VideoModalProps {
  tutorial: Tutorial | null;
  isOpen: boolean;
  onClose: () => void;
}

const DifficultyBadge = ({ level }: { level: number }) => {
  const labels = ['Débutant', 'Facile', 'Intermédiaire', 'Avancé', 'Expert'];
  const colors = [
    'bg-green-500/20 text-green-300 border-green-500/30',
    'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'bg-red-500/20 text-red-300 border-red-500/30'
  ];

  return (
    <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[level - 1]}`}>
      {labels[level - 1]}
    </div>
  );
};

const VideoModal = ({ tutorial, isOpen, onClose }: VideoModalProps) => {
  if (!tutorial) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay with 12px blur - z-100 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-carbon/80 backdrop-blur-[12px]"
          />
          
          {/* Modal Content - z-100 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 xl:inset-20 z-[100] flex flex-col bg-carbon rounded-2xl 
                       overflow-hidden shadow-2xl border border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/10 shrink-0">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg md:text-xl text-white tracking-wide truncate">
                  {tutorial.title}
                </h2>
                {tutorial.scooter && (
                  <p className="text-sm text-white/50 mt-1">
                    {tutorial.scooter.brand?.name} {tutorial.scooter.name}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="ml-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 
                           flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Video Player - Full Size with premium YouTube params */}
            <div className="flex-1 relative min-h-0">
              <iframe
                src={`https://www.youtube.com/embed/${tutorial.youtube_video_id}?autoplay=1&rel=0&modestbranding=1`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={tutorial.title}
              />
            </div>
            
            {/* Footer with Metadata */}
            <div className="px-4 md:px-6 py-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Clock className="w-4 h-4" />
                  {tutorial.duration_minutes} minutes
                </div>
                <DifficultyBadge level={tutorial.difficulty} />
              </div>
              
              {tutorial.description && (
                <p className="text-white/40 text-sm max-w-md line-clamp-1 hidden md:block">
                  {tutorial.description}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VideoModal;
