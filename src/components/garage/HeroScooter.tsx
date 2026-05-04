import { ChevronLeft, ChevronRight, Bike } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HeroScooterProps = {
  imageUrl?: string | null;
  modelName?: string | null;
  scooterCount?: number;
  currentIndex?: number;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
};

/**
 * HeroScooter — Bloc visuel central de la colonne du milieu (Garage Rooftop).
 * Image trottinette posée sur socle béton, drop-shadow lourd, navigation
 * si plusieurs scooters dans le garage.
 *
 * Pas d'appel Supabase — toutes les données arrivent en props.
 */
const HeroScooter = ({
  imageUrl,
  modelName,
  scooterCount = 0,
  currentIndex = 0,
  onPrev,
  onNext,
  className,
}: HeroScooterProps) => {
  // Cas particulier : empty state global géré par GaragePreview
  if (scooterCount === 0) return null;

  const showNav = scooterCount > 1;
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= scooterCount - 1;

  return (
    <div
      role="region"
      aria-label="Visuel de la trottinette"
      className={cn(
        'relative w-full aspect-[4/3] flex items-end justify-center pb-8 md:pb-10 overflow-visible',
        className
      )}
    >
      {/* 1. SOCLE BÉTON */}
      <div
        aria-hidden="true"
        className={cn(
          'absolute bottom-2.5 left-1/2 -translate-x-1/2',
          'w-[70%] h-[26px] rounded-sm',
          'bg-gradient-to-b from-stone-400/70 to-stone-600/50',
          'shadow-md border-t border-white/30',
          // ombre de contact dessous
          "after:content-[''] after:absolute after:-bottom-2 after:left-[5%] after:right-[5%]",
          'after:h-2 after:bg-black/40 after:blur-md after:rounded-full'
        )}
      />

      {/* 2. IMAGE TROTTINETTE ou EMPTY STATE */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={modelName ?? 'Trottinette'}
          loading="eager"
          decoding="async"
          className={cn(
            'relative z-10 max-h-[75%] w-auto object-contain -translate-y-2.5',
            'drop-shadow-[0_30px_30px_rgba(0,0,0,0.5)]',
            'drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]'
          )}
        />
      ) : (
        <div className="relative z-10 max-h-[75%] flex flex-col items-center justify-end -translate-y-2.5">
          <Bike
            aria-hidden="true"
            className={cn(
              'w-32 h-32 md:w-40 md:h-40 text-gray-400/50',
              'drop-shadow-[0_15px_20px_rgba(0,0,0,0.3)]'
            )}
            strokeWidth={1.5}
          />
          <span className="mt-2 text-xs text-gray-500">
            Aucune image disponible
          </span>
        </div>
      )}

      {/* 3. FLÈCHES NAVIGATION */}
      {showNav && (
        <>
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirst}
            aria-label="Trottinette précédente"
            className={cn(
              'absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20',
              'w-10 h-10 md:w-11 md:h-11 rounded-full',
              'bg-white/85 backdrop-blur-md border border-white/60 shadow-md',
              'grid place-items-center',
              'hover:bg-white active:scale-95 transition',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/85'
            )}
          >
            <ChevronLeft size={20} color="#1A1A1A" />
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={isLast}
            aria-label="Trottinette suivante"
            className={cn(
              'absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20',
              'w-10 h-10 md:w-11 md:h-11 rounded-full',
              'bg-white/85 backdrop-blur-md border border-white/60 shadow-md',
              'grid place-items-center',
              'hover:bg-white active:scale-95 transition',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/85'
            )}
          >
            <ChevronRight size={20} color="#1A1A1A" />
          </button>

          {/* 4. INDICATEUR DE POSITION */}
          <div
            aria-live="polite"
            className={cn(
              'absolute bottom-1 left-1/2 -translate-x-1/2 z-20',
              'px-3 py-1 rounded-full bg-black/60 backdrop-blur',
              'text-white text-[11px] font-bold tracking-wider'
            )}
          >
            {currentIndex + 1} / {scooterCount}
          </div>
        </>
      )}
    </div>
  );
};

export default HeroScooter;
