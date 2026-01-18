import { motion } from "framer-motion";
import { Play, Zap, Clock } from "lucide-react";

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

interface TutorialCardProps {
  tutorial: Tutorial;
  index: number;
  onClick: () => void;
}

const DifficultyBadge = ({ level }: { level: number }) => {
  const labels = ['Débutant', 'Facile', 'Intermédiaire', 'Avancé', 'Expert'];
  // LED Effect: 15% opacity backgrounds with full color text
  const colors = [
    'bg-emerald-500/15 text-emerald-600 border-emerald-500/20',
    'bg-blue-500/15 text-blue-600 border-blue-500/20',
    'bg-amber-500/15 text-amber-600 border-amber-500/20',
    'bg-orange-500/15 text-orange-600 border-orange-500/20',
    'bg-red-500/15 text-red-600 border-red-500/20'
  ];

  return (
    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm 
                     border-[0.5px] ${colors[level - 1]} shadow-sm`}>
      {labels[level - 1]}
    </div>
  );
};

const TutorialCard = ({ tutorial, index, onClick }: TutorialCardProps) => {
  const thumbnailUrl = `https://img.youtube.com/vi/${tutorial.youtube_video_id}/maxresdefault.jpg`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      {/* Monaco Design: 0.5px borders + Glassmorphism */}
      <div className="bg-white/70 backdrop-blur-xl border-[0.5px] border-white/20 rounded-2xl overflow-hidden 
                      shadow-lg hover:shadow-2xl hover:shadow-mineral/15 transition-all duration-500
                      ring-1 ring-carbon/5">
        
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={tutorial.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              // Fallback to lower quality thumbnail if maxres doesn't exist
              e.currentTarget.src = `https://img.youtube.com/vi/${tutorial.youtube_video_id}/hqdefault.jpg`;
            }}
          />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-carbon/30 flex items-center justify-center 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-16 h-16 rounded-full bg-mineral flex items-center justify-center 
                          shadow-xl shadow-mineral/40"
            >
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </motion.div>
          </div>
          
          {/* Duration Badge */}
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-carbon/80 backdrop-blur-sm 
                          text-white text-xs font-medium flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {tutorial.duration_minutes} min
          </div>
          
          {/* Difficulty Badge */}
          <div className="absolute top-3 left-3">
            <DifficultyBadge level={tutorial.difficulty} />
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          {/* Scooter Model Tag */}
          {tutorial.scooter && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                            bg-mineral/15 text-mineral text-xs font-semibold mb-3
                            border-[0.5px] border-mineral/20">
              <Zap className="w-3 h-3" />
              {tutorial.scooter.brand?.name} {tutorial.scooter.name}
            </div>
          )}
          
          {/* Title */}
          <h3 className="font-display text-lg text-carbon group-hover:text-mineral 
                         transition-colors line-clamp-2 mb-2 tracking-wide">
            {tutorial.title}
          </h3>
          
          {/* Description */}
          {tutorial.description && (
            <p className="text-sm text-carbon/60 line-clamp-2">
              {tutorial.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TutorialCard;
