import { History, Plus, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useGarageModifications } from '@/hooks/useGarageModifications';
import { cn } from '@/lib/utils';

interface ModificationsPreviewCardProps {
  garageItemId: string;
  onOpenFullHistory: () => void;
  onAddModification: () => void;
  className?: string;
}

const containerCls =
  'rounded-3xl p-5 bg-white/[0.42] backdrop-blur-2xl backdrop-saturate-150 border border-white/35';
const containerStyle = {
  boxShadow:
    '0 20px 50px -10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
};

const ModificationsPreviewCard = ({
  garageItemId,
  onOpenFullHistory,
  onAddModification,
  className,
}: ModificationsPreviewCardProps) => {
  const { data, isLoading } = useGarageModifications(garageItemId);
  const previewModifs = (data ?? []).slice(0, 3);

  return (
    <div className={cn(containerCls, className)} style={containerStyle}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-green-700 grid place-items-center">
          <History size={13} className="text-white" />
        </div>
        <h3 className="text-xs font-extrabold tracking-widest uppercase text-gray-900">
          Dernières modifications
        </h3>
      </div>

      {/* States */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-12 rounded-xl bg-white/40 animate-pulse"
            />
          ))}
        </div>
      ) : previewModifs.length === 0 ? (
        <div className="flex flex-col items-center text-center py-4">
          <Sparkles size={32} className="text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-700">
            Aucune modification enregistrée
          </p>
          <p className="text-xs text-gray-500 mb-4 px-4 mt-1">
            Installe des pièces et documente tes modifs pour gagner des XP
          </p>
          <button
            onClick={onAddModification}
            className="bg-green-700 hover:bg-green-800 text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Ajouter une modification
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {previewModifs.map((modif) => (
              <li
                key={modif.id}
                className="flex items-center gap-3 p-2 rounded-xl bg-white/40 border border-white/40"
              >
                {modif.part?.image_url ? (
                  <img
                    src={modif.part.image_url}
                    alt={modif.part?.name || ''}
                    className="w-10 h-10 rounded-lg object-cover bg-white/60 flex-shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/60 flex-shrink-0 grid place-items-center">
                    <Sparkles size={16} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {modif.part?.name ?? 'Pièce inconnue'}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {formatDistanceToNow(new Date(modif.installed_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
                {modif.xp_earned > 0 && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full bg-green-700/15 text-green-800 border border-green-700/30 flex-shrink-0">
                    +{modif.xp_earned} XP
                  </span>
                )}
              </li>
            ))}
          </ul>

          <button
            onClick={onOpenFullHistory}
            className="mt-4 w-full text-center text-xs font-bold uppercase tracking-widest text-gray-700 hover:text-gray-900 transition-colors"
          >
            Voir tout l'historique →
          </button>
        </>
      )}
    </div>
  );
};

export default ModificationsPreviewCard;
