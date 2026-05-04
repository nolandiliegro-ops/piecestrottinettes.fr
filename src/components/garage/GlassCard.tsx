import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'tinted';
}

/**
 * Reusable glassmorphism wrapper for Garage V1.1.
 * - default: bg-white/15 backdrop-blur-xl border border-white/20
 * - tinted: lets children keep their own colored background while adding subtle border + shadow
 */
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = 'default', className, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl shadow-2xl',
          variant === 'default' &&
            'bg-white/15 backdrop-blur-xl border border-white/20',
          variant === 'tinted' && 'border border-white/15',
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
