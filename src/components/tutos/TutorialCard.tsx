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
  const colors = [
    'bg-green-100/90 text-green-700 border-green-200/50',
    'bg-blue-100/90 text-blue-700 border-blue-200/50',
    'bg-amber-100/90 text-amber-700 border-amber-200/50',
    'bg-orange-100/90 text-orange-700 border-orange-200/50',
    'bg-red-100/90 text-red-700 border-red-200/50'
  ];

  return (
    <div className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${colors[level - 1]}`}>
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
      <div className="bg-white/60 backdrop-blur-md border border-white/30 rounded-2xl overflow-hidden 
                      shadow-lg hover:shadow-2xl hover:shadow-mineral/10 transition-all duration-500">
        
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
                            bg-mineral/10 text-mineral text-xs font-medium mb-3">
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
