import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Youtube, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScooterVideoSectionProps {
  youtubeVideoId?: string | null;
  scooterName: string;
  className?: string;
}

const ScooterVideoSection = ({ youtubeVideoId, scooterName, className }: ScooterVideoSectionProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const defaultSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(scooterName + ' review')}`;

  // Reset playing state when scooter changes
  const videoKey = youtubeVideoId || 'no-video';

  if (!youtubeVideoId) {
    return (
      <div className={cn(
        "bg-white/60 border border-mineral/20 rounded-xl p-4 h-full flex flex-col items-center justify-center",
        className
      )}>
        <Youtube className="w-8 h-8 text-carbon/20 mb-2" />
        <p className="text-xs text-carbon/40 text-center mb-2">Aucune vidéo</p>
        <a
          href={defaultSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-mineral hover:text-mineral/80 transition-colors"
        >
          Rechercher <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white/60 border border-mineral/20 rounded-xl overflow-hidden h-full",
      className
    )}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-mineral/10 flex items-center gap-2">
        <Youtube className="w-4 h-4 text-red-600" />
        <span className="text-xs font-medium text-carbon">Vidéo</span>
      </div>

      {/* Video Container */}
      <div className="relative aspect-video bg-carbon/5">
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.iframe
              key={`playing-${videoKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <motion.div
              key={`thumbnail-${videoKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-pointer group"
              onClick={() => setIsPlaying(true)}
            >
              {/* YouTube Thumbnail */}
              <img
                src={`https://img.youtube.com/vi/${youtubeVideoId}/mqdefault.jpg`}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ScooterVideoSection;
