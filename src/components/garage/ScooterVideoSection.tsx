import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';

// Demo fallback video - Kaabo maintenance tutorial
const DEMO_VIDEO_ID = 'pD0e_L2tX_s';

interface ScooterVideoSectionProps {
  youtubeVideoId?: string | null;
  scooterName: string;
  className?: string;
}

const ScooterVideoSection = ({ youtubeVideoId, scooterName, className }: ScooterVideoSectionProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Use demo video if no specific video available
  const videoId = youtubeVideoId || DEMO_VIDEO_ID;
  const isDemo = !youtubeVideoId;

  // Reset playing state when scooter/video changes
  useEffect(() => {
    setIsPlaying(false);
  }, [youtubeVideoId, scooterName]);

  return (
    <div className={cn(
      "bg-white/60 border border-mineral/20 rounded-xl overflow-hidden h-full flex flex-col",
      className
    )}>
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-mineral/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Youtube className="w-3.5 h-3.5 text-red-600" />
          <span className="text-[11px] font-medium text-carbon">Studio</span>
        </div>
        
        {/* Demo Badge */}
        {isDemo && (
          <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
            Démo
          </span>
        )}
      </div>

      {/* Video Container */}
      <div className="relative flex-1 min-h-0 bg-carbon/5">
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.iframe
              key={`playing-${videoId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <motion.div
              key={`thumbnail-${videoId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-pointer group"
              onClick={() => setIsPlaying(true)}
            >
              {/* YouTube Thumbnail */}
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to medium quality if maxres not available
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                }}
              />
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
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
