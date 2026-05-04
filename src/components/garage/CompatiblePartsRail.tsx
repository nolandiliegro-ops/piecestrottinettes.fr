import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/formatPrice';

interface Part {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock_quantity: number;
  slug?: string | null;
  category: { name: string };
}

interface CompatiblePartsRailProps {
  parts: Part[];
  loading?: boolean;
  className?: string;
}

/**
 * Horizontal snap-scroll rail of compact part chips.
 * Used in the bottom-left zone of the GaragePreview hero.
 */
const CompatiblePartsRail = ({ parts, loading, className }: CompatiblePartsRailProps) => {
  if (loading) {
    return (
      <div className={cn('flex gap-2 overflow-hidden', className)}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-[72px] h-[72px] rounded-xl bg-white/10 backdrop-blur-md animate-pulse shrink-0"
          />
        ))}
      </div>
    );
  }

  if (!parts || parts.length === 0) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 shadow-xl',
          className
        )}
      >
        <Package className="w-3.5 h-3.5 text-white/80" />
        <span className="text-xs text-white/85">Aucune pièce compatible</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory',
        className
      )}
    >
      {parts.slice(0, 12).map((part, i) => (
        <motion.div
          key={part.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
          className="snap-start shrink-0"
        >
          <Link
            to={part.slug ? `/piece/${part.slug}` : '#'}
            className="block w-[72px] h-[72px] rounded-xl overflow-hidden
                       bg-white/15 backdrop-blur-xl border border-white/25 shadow-xl
                       hover:scale-105 hover:bg-white/25 transition-all relative group"
            title={`${part.name} — ${formatPrice(part.price)}`}
          >
            {part.image ? (
              <img
                src={part.image}
                alt={part.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white/60" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 px-1 py-0.5 bg-black/50 backdrop-blur-sm">
              <p className="text-[9px] text-white font-bold text-center truncate">
                {formatPrice(part.price)}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export default CompatiblePartsRail;
