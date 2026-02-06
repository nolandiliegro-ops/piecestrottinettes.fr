import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Zap } from 'lucide-react';

interface Tutorial {
  id: string;
  title: string;
  youtube_video_id: string;
  difficulty: number;
  duration_minutes: number;
  description?: string | null;
}

interface GarageVideoModalProps {
  tutorial: Tutorial | null;
  isOpen: boolean;
  onClose: () => void;
}

const GarageVideoModal = ({ tutorial, isOpen, onClose }: GarageVideoModalProps) => {
  // Handle ESC key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!tutorial) return null;

  const difficultyLabels = ['', 'Débutant', 'Facile', 'Intermédiaire', 'Avancé', 'Expert'];
  const difficultyColors = ['', 'text-green-500', 'text-emerald-500', 'text-amber-500', 'text-orange-500', 'text-red-500'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-[12px]" />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-4xl mx-4 bg-carbon/95 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-white/10">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-white font-display font-semibold text-lg leading-tight truncate">
                  {tutorial.title}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-white/60 text-xs">
                    <Clock className="w-3 h-3" />
                    {tutorial.duration_minutes} min
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${difficultyColors[tutorial.difficulty] || 'text-white/60'}`}>
                    <Zap className="w-3 h-3" />
                    {difficultyLabels[tutorial.difficulty] || 'N/A'}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            
            {/* Video */}
            <div className="relative aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${tutorial.youtube_video_id}?autoplay=1&rel=0&modestbranding=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={tutorial.title}
              />
            </div>
            
            {/* Footer with description (if available) */}
            {tutorial.description && (
              <div className="p-4 border-t border-white/10">
                <p className="text-white/70 text-sm leading-relaxed line-clamp-2">
                  {tutorial.description}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GarageVideoModal;
