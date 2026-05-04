import { MapPin, Trophy, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getXPLevel, getProgressToNextLevel } from '@/lib/xpLevels';
import RiderAvatar from './RiderAvatar';

interface RiderProfileCardProps {
  profile: {
    display_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    rider_location?: string | null;
    performance_points?: number | null;
  } | null;
  variant?: 'mobile' | 'desktop' | 'rooftop';
  onAvatarClick?: () => void;
  showXPBar?: boolean;
  showPublicProfileLink?: boolean;
  onPublicProfileClick?: () => void;
  className?: string;
}

/**
 * Glassmorphism social card showing the rider's identity, level and XP.
 * - mobile: full width, inline at top of flow.
 * - desktop: rendered absolute top-4 right-4 by parent.
 */
const RiderProfileCard = ({
  profile,
  variant = 'desktop',
  onAvatarClick,
  showXPBar = false,
  showPublicProfileLink = false,
  onPublicProfileClick,
  className,
}: RiderProfileCardProps) => {
  const points = profile?.performance_points || 0;
  const level = getXPLevel(points);
  const displayName = profile?.display_name || 'Rider';
  const bio = profile?.bio?.trim();
  const location = profile?.rider_location?.trim();

  if (variant === 'rooftop') {
    const progress = getProgressToNextLevel(points);
    return (
      <div
        className={cn(
          'rounded-3xl p-5 shadow-2xl',
          'bg-white/40 border border-white/50',
          'backdrop-blur-2xl backdrop-saturate-150',
          className
        )}
        style={{ boxShadow: '0 20px 50px -10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)' }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onAvatarClick}
            aria-label="Modifier mon profil rider"
            className="relative shrink-0 rounded-full ring-4 ring-white/70 hover:ring-white transition shadow-xl"
          >
            <RiderAvatar
              url={profile?.avatar_url || null}
              name={displayName}
              size="lg"
            />
            <span
              className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #FF6600, #FFA64D)' }}
            >
              LVL {level.level}
            </span>
          </button>

          <div className="flex-1 min-w-0">
            <h3
              className="font-display font-black uppercase tracking-tight text-[22px] leading-none truncate text-neutral-900"
              style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
            >
              {displayName}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <level.LucideIcon className="w-3.5 h-3.5 text-neutral-700" />
              <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-widest">
                {level.name}
              </span>
              <span className="mx-1 text-neutral-400">·</span>
              <Trophy className="w-3 h-3 text-amber-600" />
              <span className="text-[11px] font-bold text-neutral-800">
                {points.toLocaleString('fr-FR')} XP
              </span>
            </div>
            {location && (
              <div className="flex items-center gap-1 mt-1 text-[11px] text-neutral-700">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>
        </div>

        {showXPBar && progress.nextLevel && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                Progression
              </span>
              <span className="text-[10px] font-semibold text-neutral-600">
                {progress.pointsToNext.toLocaleString('fr-FR')} XP → {progress.nextLevel.name}
              </span>
            </div>
            <div className="relative h-2 rounded-full overflow-hidden bg-white/50 border border-white/60">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{
                  width: `${progress.percentage}%`,
                  background: 'linear-gradient(90deg, #FF6600, #FFA64D)',
                  boxShadow: '0 0 12px rgba(255,102,0,0.6)',
                }}
              />
            </div>
          </div>
        )}

        {showXPBar && !progress.nextLevel && (
          <div className="mt-4 text-center text-[11px] font-bold uppercase tracking-widest text-amber-700">
            🏆 Niveau maximum atteint
          </div>
        )}

        {bio && (
          <p className="mt-3 text-xs italic text-neutral-700 line-clamp-2 leading-snug">
            "{bio}"
          </p>
        )}

        {showPublicProfileLink && (
          <button
            onClick={onPublicProfileClick}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/40 hover:bg-white/60 border border-white/60 text-[11px] font-bold uppercase tracking-wider text-neutral-800 transition"
          >
            Voir mon profil public
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  const avatarSize = variant === 'mobile' ? 'sm' : 'md';

  return (
    <div
      className={cn(
        'bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl',
        'p-4',
        variant === 'desktop' ? 'w-[260px]' : 'w-full',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onAvatarClick}
          aria-label="Modifier mon profil rider"
          className="shrink-0 rounded-full ring-2 ring-white/30 hover:ring-white/60 transition"
        >
          <RiderAvatar
            url={profile?.avatar_url || null}
            name={displayName}
            size={avatarSize}
          />
        </button>

        <div className="flex-1 min-w-0">
          <button
            onClick={onAvatarClick}
            className="block text-left w-full group"
          >
            <h3 className="font-display font-black text-white uppercase tracking-tight text-base md:text-lg leading-tight truncate group-hover:text-white/90">
              {displayName}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <level.LucideIcon className="w-3 h-3 text-white/80" />
              <span className="text-[11px] md:text-xs font-semibold text-white/80 uppercase tracking-wider">
                {level.name} · LVL {level.level}
              </span>
            </div>
          </button>
        </div>
      </div>

      {bio && (
        <p className="mt-3 text-xs md:text-sm italic text-white/85 line-clamp-2 leading-snug">
          “{bio}”
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        {location ? (
          <div className="flex items-center gap-1 text-[11px] md:text-xs text-white/75 min-w-0">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
          <Trophy className="w-3 h-3 text-amber-300" />
          <span className="text-xs font-bold text-white">
            {points.toLocaleString('fr-FR')}
          </span>
          <span className="text-[10px] text-white/70">XP</span>
        </div>
      </div>
    </div>
  );
};

export default RiderProfileCard;
