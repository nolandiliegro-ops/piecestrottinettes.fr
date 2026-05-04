import { Zap, Timer, Activity, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatsRowProps = {
  voltage?: number | null;
  amperage?: number | null;
  powerWatts?: number | null;
  className?: string;
};

type StatCardProps = {
  icon: LucideIcon;
  value: number | null | undefined;
  unit: 'VOLT' | 'AMP' | 'WATT';
  gradient: string;
  ariaLabelFull: string;
  ariaLabelEmpty: string;
};

const StatCard = ({ icon: Icon, value, unit, gradient, ariaLabelFull, ariaLabelEmpty }: StatCardProps) => {
  const isEmpty = value === null || value === undefined;
  const display = isEmpty ? '—' : value;

  return (
    <div
      role="group"
      aria-label={isEmpty ? ariaLabelEmpty : ariaLabelFull}
      className={cn(
        'rounded-2xl p-4 md:p-5 text-white shadow-lg shadow-black/10 bg-gradient-to-br',
        gradient
      )}
    >
      <div className="w-8 h-8 rounded-full bg-white/25 grid place-items-center mb-3">
        <Icon size={16} className="text-white" />
      </div>
      <p className="font-black text-3xl md:text-4xl leading-none tracking-tight">
        {display}
      </p>
      <p className="text-[10px] md:text-xs font-bold tracking-widest uppercase opacity-85 mt-1">
        {unit}
      </p>
    </div>
  );
};

/**
 * StatsRow — 3 cartes statistiques (Volt / Amp / Watt) en gradient.
 * Composant statique pur, aucun appel data, aucune animation.
 * Empty state : "—" avec carte conservée (règle "zéro slot vide").
 */
const StatsRow = ({ voltage, amperage, powerWatts, className }: StatsRowProps) => {
  return (
    <div className={cn('grid grid-cols-3 gap-3 md:gap-4', className)}>
      <StatCard
        icon={Zap}
        value={voltage}
        unit="VOLT"
        gradient="from-orange-500 to-orange-600"
        ariaLabelFull={`Tension : ${voltage} volts`}
        ariaLabelEmpty="Tension non renseignée"
      />
      <StatCard
        icon={Timer}
        value={amperage}
        unit="AMP"
        gradient="from-blue-400 to-blue-600"
        ariaLabelFull={`Intensité : ${amperage} ampères`}
        ariaLabelEmpty="Intensité non renseignée"
      />
      <StatCard
        icon={Activity}
        value={powerWatts}
        unit="WATT"
        gradient="from-green-500 to-green-600"
        ariaLabelFull={`Puissance : ${powerWatts} watts`}
        ariaLabelEmpty="Puissance non renseignée"
      />
    </div>
  );
};

export default StatsRow;
