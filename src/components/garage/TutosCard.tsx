import { PlayCircle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScooterTutorials } from '@/hooks/useScooterTutorials';

interface TutosCardProps {
  scooterModelId?: string | null;
  className?: string;
}

const GLASS =
  'bg-white/[0.42] backdrop-blur-2xl backdrop-saturate-150 border border-white/35 rounded-3xl';
const GLASS_SHADOW = {
  boxShadow:
    '0 20px 50px -10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
};

const FALLBACK_GRADIENTS = [
  'bg-gradient-to-br from-slate-500 to-slate-700',
  'bg-gradient-to-br from-orange-700 to-amber-900',
  'bg-gradient-to-br from-emerald-600 to-emerald-800',
  'bg-gradient-to-br from-violet-600 to-violet-800',
];

const getDifficultyMeta = (level: number) => {
  if (level <= 2) return { label: 'Débutant', cls: 'bg-green-700' };
  if (level === 3) return { label: 'Moyen', cls: 'bg-orange-600' };
  return { label: 'Avancé', cls: 'bg-red-600' };
};

const TutosCard = ({ scooterModelId, className }: TutosCardProps) => {
  const { tutorials, isLoading } = useScooterTutorials(scooterModelId);
  const items = tutorials.slice(0, 4);

  return (
    <div
      className={cn(GLASS, 'p-4 md:p-5', className)}
      style={GLASS_SHADOW}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-red-600 grid place-items-center">
            <PlayCircle size={14} className="text-white" />
          </div>
          <span className="text-xs font-extrabold tracking-widest uppercase text-gray-900">
            Tutos sur mesure
          </span>
        </div>
        {!isLoading && items.length > 0 && (
          <span className="text-[11px] text-gray-500 font-semibold">
            {items.length} {items.length > 1 ? 'vidéos' : 'vidéo'}
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-video rounded-xl bg-white/30 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center py-6 text-center">
          <PlayCircle size={32} className="text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 font-medium">
            Pas de tutos disponibles
          </p>
          <p className="text-xs text-gray-400">
            On en ajoute bientôt pour ton modèle
          </p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {items.map((tuto, idx) => {
            const diff = getDifficultyMeta(tuto.difficulty);
            const thumb = `https://img.youtube.com/vi/${tuto.youtube_video_id}/mqdefault.jpg`;
            return (
              <a
                key={tuto.id}
                href={`https://www.youtube.com/watch?v=${tuto.youtube_video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'relative aspect-video rounded-xl overflow-hidden cursor-pointer',
                  'hover:scale-105 transition-transform duration-200',
                  FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length]
                )}
              >
                <img
                  src={thumb}
                  alt={tuto.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      'none';
                  }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                {/* Play */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/95 grid place-items-center">
                  <Play size={12} className="fill-current text-gray-900" />
                </div>
                {/* Meta */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 text-white text-[10px] font-bold leading-tight">
                  <span
                    className={cn(
                      'inline-block px-1.5 py-0.5 rounded-full text-[8px] mb-0.5',
                      diff.cls
                    )}
                  >
                    {diff.label}
                  </span>
                  <p className="line-clamp-2">{tuto.title}</p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TutosCard;
