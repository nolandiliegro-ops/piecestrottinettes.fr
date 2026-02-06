import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Youtube, Play, Share2, Link2, ExternalLink, Clock, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScooterTutorials } from '@/hooks/useScooterTutorials';
import GarageVideoModal from './GarageVideoModal';
import { toast } from '@/hooks/use-toast';

interface Tutorial {
  id: string;
  title: string;
  youtube_video_id: string;
  difficulty: number;
  duration_minutes: number;
  description: string | null;
  slug: string;
}

interface MediaSidebarProps {
  scooterModelId?: string | null;
  scooterName: string;
  userId?: string;
  className?: string;
}

// YouTube thumbnail URL helper
const getYouTubeThumbnail = (videoId: string) => 
  `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

// Difficulty badge component
const DifficultyBadge = ({ level }: { level: number }) => {
  const labels = ['', 'Débutant', 'Facile', 'Moyen', 'Avancé', 'Expert'];
  const colors = [
    '',
    'bg-green-500/20 text-green-400 border-green-500/30',
    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'bg-red-500/20 text-red-400 border-red-500/30',
  ];
  
  return (
    <span className={cn(
      "text-[8px] px-1 py-0.5 rounded border font-medium",
      colors[level] || 'bg-white/10 text-white/60 border-white/20'
    )}>
      {labels[level] || 'N/A'}
    </span>
  );
};

// Thumbnail button component
const ThumbnailButton = ({ 
  tutorial, 
  onClick 
}: { 
  tutorial: Tutorial; 
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="relative aspect-video rounded-lg overflow-hidden group bg-carbon/20"
  >
    <img 
      src={getYouTubeThumbnail(tutorial.youtube_video_id)} 
      alt={tutorial.title}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
    
    {/* Overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent 
                    opacity-80 group-hover:opacity-100 transition-opacity" />
    
    {/* Play button */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center
                      group-hover:scale-110 transition-transform shadow-lg">
        <Play className="w-4 h-4 text-carbon fill-carbon ml-0.5" />
      </div>
    </div>
    
    {/* Info overlay */}
    <div className="absolute bottom-0 left-0 right-0 p-1.5">
      <p className="text-[9px] text-white font-medium leading-tight line-clamp-2 mb-1">
        {tutorial.title}
      </p>
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-0.5 text-[8px] text-white/70">
          <Clock className="w-2.5 h-2.5" />
          {tutorial.duration_minutes}m
        </span>
        <DifficultyBadge level={tutorial.difficulty} />
      </div>
    </div>
  </motion.button>
);

// Social button component
const SocialButton = ({ 
  icon, 
  label, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center 
               hover:bg-white hover:shadow-md transition-all group"
    title={label}
  >
    <span className="text-carbon/70 group-hover:text-carbon transition-colors">
      {icon}
    </span>
  </button>
);

const MediaSidebar = ({ scooterModelId, scooterName, userId, className }: MediaSidebarProps) => {
  const navigate = useNavigate();
  const { tutorials, isLoading, modelSpecificCount } = useScooterTutorials(scooterModelId);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const openVideo = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setShowVideoModal(true);
  };

  const copyLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Lien copié !",
        description: "Le lien de votre garage a été copié dans le presse-papiers.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateCard = () => {
    toast({
      title: "Bientôt disponible",
      description: "La génération de fiches partageables arrive très prochainement !",
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* YouTube Playlist Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white/60 backdrop-blur-sm border border-mineral/20 rounded-xl p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-600/10 flex items-center justify-center">
              <Youtube className="w-3.5 h-3.5 text-red-600" />
            </div>
            <h3 className="text-sm font-semibold text-carbon">Tutos sur mesure</h3>
          </div>
          {tutorials.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 bg-mineral/10 text-mineral rounded-full font-medium">
              {tutorials.length} vidéo{tutorials.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Model-specific indicator */}
        {modelSpecificCount > 0 && (
          <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 bg-mineral/5 rounded-lg">
            <Zap className="w-3 h-3 text-mineral" />
            <span className="text-[10px] text-mineral font-medium">
              {modelSpecificCount} tuto{modelSpecificCount > 1 ? 's' : ''} spécifique{modelSpecificCount > 1 ? 's' : ''} pour {scooterName}
            </span>
          </div>
        )}
        
        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-mineral" />
          </div>
        ) : tutorials.length === 0 ? (
          <div className="text-center py-6">
            <Youtube className="w-8 h-8 text-carbon/20 mx-auto mb-2" />
            <p className="text-xs text-carbon/50">Aucun tutoriel disponible</p>
          </div>
        ) : (
          <>
            {/* Thumbnails Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto scrollbar-hide">
              {tutorials.slice(0, 6).map((tutorial) => (
                <ThumbnailButton 
                  key={tutorial.id} 
                  tutorial={tutorial} 
                  onClick={() => openVideo(tutorial)} 
                />
              ))}
            </div>
            
            {/* Link to Academy */}
            {tutorials.length > 6 && (
              <button
                onClick={() => navigate('/tutos')}
                className="w-full mt-3 py-2 text-xs text-mineral hover:text-mineral/80 
                         flex items-center justify-center gap-1.5 
                         bg-mineral/5 hover:bg-mineral/10 rounded-lg transition-colors"
              >
                Voir tous les tutos ({tutorials.length})
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </>
        )}
      </motion.div>

      {/* Social Share Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white/60 backdrop-blur-sm border border-mineral/20 rounded-xl p-4"
      >
        <h3 className="text-sm font-semibold text-carbon mb-3 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-mineral" />
          Partager mon Build
        </h3>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerateCard}
          className="w-full px-4 py-3 bg-mineral text-white rounded-xl font-medium
                    hover:bg-mineral/90 transition-all hover:shadow-lg
                    flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Générer ma fiche
        </motion.button>
        
        <div className="flex items-center justify-center gap-3 mt-4">
          <SocialButton 
            icon={<Link2 className="w-4 h-4" />} 
            label="Copier le lien" 
            onClick={copyLink} 
          />
        </div>
        
        <p className="text-[10px] text-carbon/40 text-center mt-3">
          Partagez votre configuration avec la communauté
        </p>
      </motion.div>

      {/* Video Modal */}
      <GarageVideoModal
        tutorial={selectedTutorial}
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />
    </div>
  );
};

export default MediaSidebar;
