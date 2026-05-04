import { cn } from '@/lib/utils';

export type ScooterIdPillProps = {
  brand?: string | null;
  modelName?: string | null;
  year?: number | string | null;
  nickname?: string | null;
  className?: string;
};

const pillBase = cn(
  'inline-flex items-center gap-3 max-w-[90vw]',
  'rounded-full px-5 py-2.5 md:px-6 md:py-3',
  'bg-white/85 backdrop-blur-xl border border-white/60',
  'shadow-lg shadow-black/15'
);

/**
 * ScooterIdPill — pill flottante au-dessus du HeroScooter.
 * Affiche : BRAND MODEL YEAR | — NICKNAME.
 * Ne retourne JAMAIS null (placeholder garanti).
 */
const ScooterIdPill = ({ brand, modelName, year, nickname, className }: ScooterIdPillProps) => {
  const hasBrandModel = Boolean(brand && modelName);
  const hasYear = year !== null && year !== undefined && year !== '';
  const hasNickname = Boolean(nickname && nickname.trim().length > 0);

  // Cas 4 : tout est null
  if (!hasBrandModel && !hasYear && !hasNickname) {
    return (
      <div
        role="status"
        aria-label="Aucune trottinette enregistrée"
        className={cn(pillBase, className)}
      >
        <span className="text-sm md:text-base italic text-gray-500 truncate">
          AJOUTE TA TROTTINETTE
        </span>
      </div>
    );
  }

  // aria-label complet
  const ariaParts: string[] = ['Trottinette :'];
  if (hasBrandModel) ariaParts.push(`${brand} ${modelName}`);
  else ariaParts.push('modèle non renseigné');
  if (hasYear) ariaParts.push(String(year));
  if (hasNickname) ariaParts.push(`surnom ${nickname}`);
  const ariaLabel = ariaParts.join(' ');

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={cn(pillBase, className)}
    >
      <span className="font-black text-sm md:text-base tracking-tight text-gray-900 truncate">
        {hasBrandModel ? `${brand} ${modelName}` : 'TROTTINETTE'}
        {hasYear && (
          <>
            {' '}
            <span className="text-green-700">{year}</span>
          </>
        )}
      </span>

      {hasNickname && (
        <>
          <span className="w-px h-4 bg-black/20 shrink-0" aria-hidden="true" />
          <span className="text-[11px] md:text-xs font-bold tracking-wider uppercase text-green-700 truncate">
            — {nickname!.toUpperCase()}
          </span>
        </>
      )}
    </div>
  );
};

export default ScooterIdPill;
