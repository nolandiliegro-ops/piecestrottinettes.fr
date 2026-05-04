import { Share2, Link2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareBuildCardProps {
  viewCount?: number;
  className?: string;
}

const GLASS =
  'bg-white/[0.42] backdrop-blur-2xl backdrop-saturate-150 border border-white/35 rounded-3xl';
const GLASS_SHADOW = {
  boxShadow:
    '0 20px 50px -10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
};

const ShareBuildCard = ({ viewCount, className }: ShareBuildCardProps) => {
  return (
    <div
      className={cn(GLASS, 'p-4 md:p-5 text-center', className)}
      style={GLASS_SHADOW}
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-green-700 grid place-items-center">
          <Share2 size={11} className="text-white" />
        </div>
        <span className="text-[11px] font-extrabold tracking-widest uppercase text-gray-900">
          Partager mon build
        </span>
      </div>

      {/* Bouton */}
      <button
        type="button"
        disabled
        title="Bientôt disponible"
        onClick={() => {}}
        className={cn(
          'w-full bg-green-700 hover:bg-green-800',
          'disabled:bg-green-700/40 disabled:cursor-not-allowed',
          'text-white rounded-xl py-3 font-bold text-sm',
          'flex items-center justify-center gap-2'
        )}
      >
        <Link2 size={14} />
        Générer ma fiche
      </button>

      {/* Pill vues */}
      <div className="mt-3 inline-flex items-center gap-1.5 bg-white/50 rounded-full px-3 py-1">
        <Eye size={12} className="text-gray-500" />
        <span className="text-xs font-bold text-gray-700">
          {viewCount ?? 0} vues
        </span>
      </div>

      {/* Info */}
      <p className="mt-2 text-[10px] text-gray-500 leading-tight">
        Partage ton build avec la communauté pour gagner des XP
      </p>
    </div>
  );
};

export default ShareBuildCard;
