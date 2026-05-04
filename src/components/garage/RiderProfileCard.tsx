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
  className,
}: RiderProfileCardProps) => {
  const points = profile?.performance_points || 0;
  const level = getXPLevel(points);
  const displayName = profile?.display_name || 'Rider';
  const bio = profile?.bio?.trim();
  const location = profile?.rider_location?.trim();

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
