import { Wrench, CircleDollarSign, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserTotalInvested } from '@/hooks/useUserStats';
import { useUpdateLastMaintenance } from '@/hooks/useUpdateLastMaintenance';

export type SuiviExpertCardProps = {
  garageId: string;
  performancePoints?: number | null;
  voltage?: number | null;
  amperage?: number | null;
  powerWatts?: number | null;
  className?: string;
};

const SuiviExpertCard = ({
  garageId,
  performancePoints,
  voltage,
  amperage,
  powerWatts,
  className,
}: SuiviExpertCardProps) => {
  const { totalInvested, isLoading } = useUserTotalInvested();
  const { mutate: markRevised, isPending } = useUpdateLastMaintenance();

  return (
    <div
      role="region"
      aria-label="Suivi expert de la trottinette"
      className={cn(
        'rounded-3xl p-5 md:p-6',
        'bg-white/[0.42] backdrop-blur-2xl backdrop-saturate-150',
        'border border-white/35',
        'shadow-[0_20px_50px_-10px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.6)]',
        className
      )}
    >
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-green-700 grid place-items-center">
          <Wrench size={13} className="text-white" />
        </div>
        <span className="text-xs font-extrabold tracking-widest uppercase text-gray-900">
          Suivi Expert
        </span>
      </div>

      {/* GRID 2 COLONNES */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
        {/* TOTAL INVESTI */}
        <div className="bg-white/55 border border-white/60 rounded-2xl p-3.5 md:p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <CircleDollarSign size={12} className="text-gray-500" />
            <span className="text-[11px] font-semibold text-gray-500">
              Total investi
            </span>
          </div>
          <div className="font-black text-2xl md:text-3xl tracking-tight text-gray-900 leading-none">
            {isLoading ? '—' : Math.round(totalInvested)}
            <span className="text-lg opacity-60 ml-0.5">€</span>
          </div>
        </div>

        {/* POINTS COCKPIT */}
        <div className="bg-white/55 border border-white/60 rounded-2xl p-3.5 md:p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={12} className="text-gray-500" />
            <span className="text-[11px] font-semibold text-gray-500">
              Points cockpit
            </span>
          </div>
          <div className="font-black text-2xl md:text-3xl tracking-tight text-gray-900 leading-none">
            {performancePoints ?? 0}
          </div>
        </div>
      </div>

      {/* BOUTON MARQUER COMME RÉVISÉE */}
      <div className="flex justify-center">
        <button
          type="button"
          disabled={isPending}
          aria-label={
            isPending
              ? 'Enregistrement de la révision en cours'
              : 'Marquer la trottinette comme révisée'
          }
          aria-busy={isPending}
          onClick={() => markRevised(garageId)}
          className={cn(
            'bg-green-700 hover:bg-green-800',
            'disabled:bg-green-700/60 disabled:cursor-not-allowed',
            'text-white rounded-xl px-6 py-2.5 max-w-xs w-full',
            'font-bold text-sm tracking-wide',
            'flex items-center justify-center gap-2',
            'transition-colors'
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              En cours...
            </>
          ) : (
            <>
              <Wrench className="w-4 h-4" />
              Marquer comme révisée
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SuiviExpertCard;
