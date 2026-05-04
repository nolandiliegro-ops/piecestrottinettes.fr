import { useState } from 'react';
import { useActiveTheme } from '@/hooks/useActiveTheme';

const GarageBackground = () => {
  const { theme } = useActiveTheme();
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

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
      {/* Overlay sombre pour lisibilité */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
};

export default GarageBackground;
