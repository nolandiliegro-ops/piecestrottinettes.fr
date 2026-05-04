import { useEffect, useRef, useState } from 'react';
import { Pencil, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdatePersonalDescription } from '@/hooks/useGarage';

interface DescriptionCardProps {
  garageId: string;
  initialDescription?: string | null;
  className?: string;
}

const GLASS =
  'bg-white/[0.42] backdrop-blur-2xl backdrop-saturate-150 border border-white/35 rounded-3xl';
const GLASS_SHADOW = {
  boxShadow:
    '0 20px 50px -10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
};

const MAX = 500;
const DEBOUNCE_MS = 600;
const SAVED_LABEL_MS = 2000;

const DescriptionCard = ({
  garageId,
  initialDescription,
  className,
}: DescriptionCardProps) => {
  const [value, setValue] = useState(initialDescription ?? '');
  const [showSaved, setShowSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>(initialDescription ?? '');

  const mutation = useUpdatePersonalDescription();

  // Sync if initial value changes externally
  useEffect(() => {
    setValue(initialDescription ?? '');
    lastSavedRef.current = initialDescription ?? '';
  }, [initialDescription]);

  // Debounced auto-save
  useEffect(() => {
    if (value === lastSavedRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      mutation.mutate(
        { garageItemId: garageId, description: value },
        {
          onSuccess: () => {
            lastSavedRef.current = value;
            setShowSaved(true);
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
            savedTimerRef.current = setTimeout(
              () => setShowSaved(false),
              SAVED_LABEL_MS
            );
          },
        }
      );
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, garageId]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const overWarn = value.length > 450;

  return (
    <div
      className={cn(GLASS, 'p-4 md:p-5', className)}
      style={GLASS_SHADOW}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Pencil size={14} className="text-gray-500" />
          <span className="text-[11px] font-extrabold tracking-widest uppercase text-gray-900">
            Ma description
          </span>
        </div>
        <div aria-live="polite" className="min-h-[14px]">
          {mutation.isPending && (
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <Loader2 size={11} className="animate-spin" />
              Enregistrement…
            </span>
          )}
          {!mutation.isPending && showSaved && (
            <span className="flex items-center gap-1 text-[10px] text-green-700">
              <Check size={11} />
              Enregistré
            </span>
          )}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        aria-label="Description personnelle de la trottinette"
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX))}
        maxLength={MAX}
        placeholder="Décris ta trottinette : modifications, usage, anecdotes…"
        className={cn(
          'w-full bg-white/55 border border-white/60 rounded-xl',
          'px-3 py-2.5 text-sm text-gray-900 font-sans',
          'placeholder:italic placeholder:text-gray-500/80',
          'min-h-[80px] md:min-h-[90px] resize-none',
          'focus:outline-none focus:ring-2 focus:ring-green-700/40'
        )}
      />

      {/* Compteur */}
      <div className="mt-1 flex justify-end">
        <span
          className={cn(
            'text-[10px]',
            overWarn ? 'text-orange-600' : 'text-gray-500'
          )}
        >
          {value.length}/{MAX}
        </span>
      </div>
    </div>
  );
};

export default DescriptionCard;
