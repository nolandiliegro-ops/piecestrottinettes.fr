import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveTheme, type GarageTheme } from '@/hooks/useActiveTheme';
import { useEstrade } from '@/components/garage/v3/StandTrott';

/** themeKey fourni = garage public d'un autre rider (/rider/:username) : on affiche SON wallpaper. */
/** `remonte` : même décalage que l'estrade (StandTrott) sur téléphone ; le bas découvert est fondu en carbone. */
const GarageBackground = ({ themeKey, remonte = false }: { themeKey?: string | null; remonte?: boolean } = {}) => {
  const pos = useEstrade(remonte);
  const decale = remonte && !!pos && pos.vw < 1024;
  const { theme: ownTheme } = useActiveTheme();
  const { data: otherTheme } = useQuery({
    queryKey: ['garage-themes', 'by-key', themeKey ?? null],
    enabled: themeKey !== undefined,
    staleTime: 60_000,
    queryFn: async () => {
      if (themeKey) {
        const { data } = await supabase.from('garage_themes').select('*').eq('key', themeKey).eq('is_active', true).maybeSingle();
        if (data) return data as GarageTheme;
      }
      const { data: first } = await supabase.from('garage_themes').select('*').eq('is_active', true).order('display_order', { ascending: true }).limit(1).maybeSingle();
      return (first as GarageTheme) ?? null;
    },
  });
  const theme = themeKey !== undefined ? otherTheme : ownTheme;
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Adaptive overlay: lighter on already-dark themes, stronger on bright/beige ones.
  const themeName = (theme?.name || '').toLowerCase();
  const isAlreadyDark =
    themeName.includes('loft') ||
    themeName.includes('biblio') ||
    themeName.includes('night') ||
    themeName.includes('sombre');

  const overlayClass = isAlreadyDark
    ? 'bg-gradient-to-b from-black/10 via-black/15 to-black/25'
    : 'bg-gradient-to-b from-black/25 via-black/35 to-black/55';

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Skeleton flou pendant chargement */}
      {!loaded && !errored && (
        <div className="absolute inset-0 bg-[hsl(0_0%_10%)] animate-pulse" />
      )}
      {/* Fallback gradient si erreur */}
      {errored && (
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_0%_10%)] via-[hsl(0_0%_15%)] to-[hsl(0_0%_8%)]" />
      )}
      {theme?.image_url && !errored && (
        <img
          src={theme.image_url}
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`absolute ${decale ? '' : 'inset-0 w-full h-full object-cover'} transition-opacity duration-700 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={decale && pos ? { left: pos.offX, top: pos.offY, width: pos.dispW, height: pos.dispH, maxWidth: 'none' } : undefined}
        />
      )}
      {decale && pos && (
        <div className="absolute inset-x-0 bottom-0" style={{ top: pos.offY + pos.dispH - pos.vh * 0.08, background: 'linear-gradient(180deg, rgba(26,26,26,0) 0%, #1A1A1A 60%)' }} />
      )}
      {/* Adaptive overlay for legibility */}
      <div className={`absolute inset-0 ${overlayClass}`} />
    </div>
  );
};

export default GarageBackground;
