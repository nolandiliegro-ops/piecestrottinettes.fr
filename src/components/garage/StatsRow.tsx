import { Zap, Timer, Activity, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatsRowProps = {
  voltage?: number | null;
  amperage?: number | null;
  powerWatts?: number | null;
  className?: string;
};

type StatColor = {
  rgb: string;
  iconClass: string;
};

const COLORS: Record<'orange' | 'blue' | 'green', StatColor> = {
  orange: { rgb: '255, 102, 0', iconClass: 'text-orange-300' },
  blue: { rgb: '59, 130, 246', iconClass: 'text-blue-300' },
  green: { rgb: '34, 197, 94', iconClass: 'text-emerald-300' },
};

type StatCardProps = {
  icon: LucideIcon;
  value: number | null | undefined;
  unit: 'VOLT' | 'AMP' | 'WATT';
  color: StatColor;
  ariaLabelFull: string;
  ariaLabelEmpty: string;
};

const StatCard = ({ icon: Icon, value, unit, color, ariaLabelFull, ariaLabelEmpty }: StatCardProps) => {
  const isEmpty = value === null || value === undefined;
  const display = isEmpty ? '—' : value;
  const { rgb, iconClass } = color;

  return (
    <div
      role="group"
      aria-label={isEmpty ? ariaLabelEmpty : ariaLabelFull}
      className="stats-glass rounded-3xl p-4 md:p-5 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, rgba(0,0,0,0.15), rgba(0,0,0,0.05)), rgba(255,255,255,0.12)',
        backdropFilter: 'blur(var(--stats-blur, 24px)) saturate(140%)',
        WebkitBackdropFilter: 'blur(var(--stats-blur, 24px)) saturate(140%)',
        border: '1px solid rgba(255,255,255,0.25)',
        boxShadow:
          '0 20px 50px -10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.4)',
      }}
    >
      {/* Pastille icône — accent couleur */}
      <div
        className="w-8 h-8 rounded-full grid place-items-center mb-3"
        style={{
          background: `rgba(${rgb}, 0.20)`,
          border: `1px solid rgba(${rgb}, 0.35)`,
        }}
      >
        <Icon size={18} className={iconClass} />
      </div>

      {/* Chiffre principal — blanc + glow couleur subtil */}
      <p
        className="font-black text-3xl md:text-4xl leading-none tracking-tight text-white"
        style={!isEmpty ? { textShadow: `0 0 24px rgba(${rgb}, 0.30)` } : undefined}
      >
        {display}
      </p>

      {/* Label */}
      <p className="text-[10px] md:text-xs font-semibold tracking-widest uppercase text-white/70 mt-1">
        {unit}
      </p>
    </div>
  );
};

/**
 * StatsRow — 3 cartes statistiques (Volt / Amp / Watt) en glassmorphism premium.
 * Aligné Phase A Rooftop Sunset : fond visible, accents couleur sur l'icône uniquement.
 * Empty state : "—" avec carte conservée (règle "zéro slot vide").
 */
const StatsRow = ({ voltage, amperage, powerWatts, className }: StatsRowProps) => {
  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .stats-glass { --stats-blur: 12px; }
        }
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .stats-glass {
            background: rgba(20, 20, 20, 0.55) !important;
          }
        }
      `}</style>
      <div className={cn('grid grid-cols-3 gap-3 md:gap-4', className)}>
        <StatCard
          icon={Zap}
          value={voltage}
          unit="VOLT"
          color={COLORS.orange}
          ariaLabelFull={`Tension : ${voltage} volts`}
          ariaLabelEmpty="Tension non renseignée"
        />
        <StatCard
          icon={Timer}
          value={amperage}
          unit="AMP"
          color={COLORS.blue}
          ariaLabelFull={`Intensité : ${amperage} ampères`}
          ariaLabelEmpty="Intensité non renseignée"
        />
        <StatCard
          icon={Activity}
          value={powerWatts}
          unit="WATT"
          color={COLORS.green}
          ariaLabelFull={`Puissance : ${powerWatts} watts`}
          ariaLabelEmpty="Puissance non renseignée"
        />
      </div>
    </>
  );
};

export default StatsRow;
