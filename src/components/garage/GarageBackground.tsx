import { useState } from 'react';
import { useActiveTheme } from '@/hooks/useActiveTheme';

const GarageBackground = () => {
  const { theme } = useActiveTheme();
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
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      {/* Adaptive overlay for legibility */}
      <div className={`absolute inset-0 ${overlayClass}`} />
    </div>
  );
};

export default GarageBackground;
