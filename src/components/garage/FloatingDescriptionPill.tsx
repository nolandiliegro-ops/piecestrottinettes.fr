import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingDescriptionPillProps {
  description?: string | null;
  onClick?: () => void;
  className?: string;
}

/**
 * Bottom-center single-line glass pill showing a snippet of the personal
 * description. Click opens the full editor (parent decides which modal).
 */
const FloatingDescriptionPill = ({
  description,
  onClick,
  className,
}: FloatingDescriptionPillProps) => {
  const hasDescription = !!description?.trim();
  const display = hasDescription ? description : 'Ajouter une description perso…';

  return (
    <button
      onClick={onClick}
      className={cn(
        'group max-w-[520px] w-full flex items-center gap-2 px-4 py-2.5 rounded-full',
        'bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl',
        'hover:bg-white/25 transition-colors text-left',
        className
      )}
    >
      <MessageSquare className="w-3.5 h-3.5 text-white/80 shrink-0" />
      <span
        className={cn(
          'text-xs md:text-sm truncate flex-1',
          hasDescription ? 'text-white/95 italic' : 'text-white/60'
        )}
      >
        {display}
      </span>
    </button>
  );
};

export default FloatingDescriptionPill;
