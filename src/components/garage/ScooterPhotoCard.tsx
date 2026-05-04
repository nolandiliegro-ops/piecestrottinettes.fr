import { useState, useEffect } from 'react';
import { Camera, Plus, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import CustomPhotoButton from './CustomPhotoButton';

interface GarageItemLite {
  id: string;
  custom_photo_url?: string | null;
  scooter_model: {
    name: string;
    image_url?: string | null;
  };
}

interface ScooterPhotoCardProps {
  garageItem: GarageItemLite;
  onUpload?: () => void;
  mode?: 'official' | 'custom';
  onModeChange?: (mode: 'official' | 'custom') => void;
  className?: string;
}

/**
 * Rooftop variant photo card for the active scooter.
 * Two states: empty (CTA +50 XP) / filled (image with mode toggle).
 */
const ScooterPhotoCard = ({
  garageItem,
  onUpload,
  mode: controlledMode,
  onModeChange,
  className,
}: ScooterPhotoCardProps) => {
  const officialUrl = garageItem.scooter_model?.image_url || null;
  const customUrl = garageItem.custom_photo_url || null;

  // Default mode: custom if available, else official
  const defaultMode: 'official' | 'custom' = customUrl ? 'custom' : 'official';
  const [internalMode, setInternalMode] = useState<'official' | 'custom'>(defaultMode);
  const mode = controlledMode ?? internalMode;

  useEffect(() => {
    if (!controlledMode) setInternalMode(defaultMode);
  }, [defaultMode, controlledMode]);

  const setMode = (m: 'official' | 'custom') => {
    if (!controlledMode) setInternalMode(m);
    onModeChange?.(m);
  };

  const activeUrl = mode === 'custom' ? customUrl : officialUrl;
  const isEmpty = !activeUrl;

  return (
    <div
      className={cn('rounded-3xl p-4 shadow-2xl', className)}
      style={{
        background: 'rgba(255,255,255,0.42)',
        backdropFilter: 'blur(24px) saturate(140%)',
        WebkitBackdropFilter: 'blur(24px) saturate(140%)',
        border: '1px solid rgba(255,255,255,0.35)',
        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full"
          style={{ background: '#4A7C59' }}
        >
          <Camera className="w-3.5 h-3.5 text-white" />
        </span>
        <span
          className="font-display font-bold text-[11px] uppercase text-neutral-800"
          style={{ letterSpacing: '0.12em' }}
        >
          Ma trottinette en vrai
        </span>
      </div>

      {/* Image area */}
      <div className="relative" style={{ aspectRatio: '4 / 5' }}>
        {isEmpty ? (
          <button
            type="button"
            onClick={onUpload}
            className="group relative w-full h-full flex flex-col items-center justify-center gap-3 transition-transform hover:scale-[1.01]"
            style={{
              borderRadius: '18px',
              border: '2px dashed rgba(74,124,89,0.5)',
              background: `repeating-linear-gradient(45deg, rgba(74,124,89,0.06) 0 8px, transparent 8px 16px),
                           linear-gradient(135deg, rgba(74,124,89,0.15), rgba(255,102,0,0.15))`,
            }}
            aria-label="Ajouter une photo de ma trottinette"
          >
            <span
              className="flex items-center justify-center rounded-full shadow-lg"
              style={{ width: 56, height: 56, background: '#0A0A0A' }}
            >
              <Camera className="w-6 h-6 text-white" />
            </span>
            <span
              className="font-display font-extrabold text-[14px] uppercase text-neutral-900"
              style={{ letterSpacing: '0.05em' }}
            >
              Ajoute ta photo
            </span>
            <span className="text-[12px] text-neutral-600 px-6 text-center">
              Montre ta machine à la communauté
            </span>
            <span
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-white text-[11px] font-extrabold shadow-md"
              style={{ background: 'linear-gradient(135deg, #FF6600, #FFA64D)' }}
            >
              <Zap className="w-3 h-3" fill="currentColor" />
              +50 XP
            </span>
          </button>
        ) : (
          <div
            className="relative w-full h-full overflow-hidden"
            style={{
              borderRadius: '18px',
              boxShadow: '0 12px 30px -8px rgba(0,0,0,0.35)',
            }}
          >
            <img
              src={activeUrl}
              alt={garageItem.scooter_model?.name || 'Trottinette'}
              loading="lazy"
              className="w-full h-full object-cover"
            />

            {/* Badge mode top-left */}
            <span
              className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-md"
              style={{
                background: mode === 'official' ? '#4A7C59' : '#FF6600',
                letterSpacing: '0.08em',
              }}
            >
              {mode === 'official' ? 'Officielle' : 'Ma photo'}
            </span>

            {/* Modify button bottom-center (custom mode only) */}
            {mode === 'custom' && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <CustomPhotoButton
                  garageItemId={garageItem.id}
                  currentPhotoUrl={customUrl}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mode toggle thumbnails — only when at least one photo exists */}
      {!isEmpty && (officialUrl || customUrl) && (
        <div className="mt-3 flex items-center gap-3">
          {/* Official thumb */}
          {officialUrl && (
            <button
              type="button"
              onClick={() => setMode('official')}
              className="block w-12 h-12 rounded-lg overflow-hidden transition-all"
              style={{
                border: mode === 'official' ? '2px solid #4A7C59' : '2px solid transparent',
                opacity: mode === 'official' ? 1 : 0.6,
              }}
              aria-label="Voir la photo officielle"
              aria-pressed={mode === 'official'}
            >
              <img
                src={officialUrl}
                alt="Officielle"
                className="w-full h-full object-cover"
              />
            </button>
          )}

          {/* Custom thumb or "+ Ajouter" */}
          {customUrl ? (
            <button
              type="button"
              onClick={() => setMode('custom')}
              className="block w-12 h-12 rounded-lg overflow-hidden transition-all"
              style={{
                border: mode === 'custom' ? '2px solid #4A7C59' : '2px solid transparent',
                opacity: mode === 'custom' ? 1 : 0.6,
              }}
              aria-label="Voir ma photo"
              aria-pressed={mode === 'custom'}
            >
              <img
                src={customUrl}
                alt="Ma photo"
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={onUpload}
              className="flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors hover:bg-white/40"
              style={{ border: '2px dashed rgba(74,124,89,0.5)' }}
              aria-label="Ajouter ma photo"
            >
              <Plus className="w-4 h-4 text-neutral-700" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ScooterPhotoCard;
