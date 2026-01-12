import { motion } from 'framer-motion';
import { Package, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface Part {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock_quantity: number;
  category: {
    name: string;
  };
}

interface ProductsUsedProps {
  scooterId: string;
  scooterName: string;
  parts: Part[];
  loading?: boolean;
  className?: string;
}

const ProductsUsed = ({ scooterId, scooterName, parts, loading, className }: ProductsUsedProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/40 rounded-2xl">
        <div className="animate-spin w-8 h-8 border-4 border-mineral border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!parts || parts.length === 0) {
    return (
      <div className="bg-white/40 border border-mineral/20 rounded-2xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-mineral/10 mx-auto flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-mineral/50" />
          </div>
          <p className="text-carbon/60 font-medium mb-2">Aucune pièce compatible trouvée</p>
          <p className="text-carbon/40 text-sm">
            Explorez notre catalogue pour trouver des pièces pour votre {scooterName}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-mineral text-white rounded-full hover:bg-mineral/90 transition-colors text-sm font-medium"
          >
            Voir le catalogue
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mineral/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-mineral" />
          </div>
          <div>
            <h3 className="font-display text-xl text-carbon">PIÈCES COMPATIBLES</h3>
            <p className="text-xs text-carbon/50">
              {parts.length} {parts.length === 1 ? 'pièce disponible' : 'pièces disponibles'}
            </p>
          </div>
        </div>
        <Link
          to="/"
          className="text-sm text-mineral hover:text-mineral/80 transition-colors flex items-center gap-1"
        >
          Voir tout
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* Parts Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {parts.slice(0, 8).map((part, index) => (
          <motion.div
            key={part.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={cn(
              "group relative bg-white/60 border border-mineral/20 rounded-xl p-4",
              "hover:shadow-lg hover:border-mineral/40 transition-all duration-300",
              "cursor-pointer"
            )}
          >
            {/* Stock Badge */}
            {part.stock_quantity > 0 ? (
              <div className="absolute top-2 right-2 px-2 py-1 bg-mineral/10 rounded-full">
                <span className="text-xs font-semibold text-mineral">En Stock</span>
              </div>
            ) : (
              <div className="absolute top-2 right-2 px-2 py-1 bg-carbon/10 rounded-full">
                <span className="text-xs font-semibold text-carbon/50">Rupture</span>
              </div>
            )}

            {/* Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-greige/30 mb-3">
              {part.image ? (
                <img
                  src={part.image}
                  alt={part.name}
                  className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-carbon/20" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-2">
              {/* Category */}
              <p className="text-xs text-mineral font-medium uppercase tracking-wide">
                {part.category.name}
              </p>

              {/* Name */}
              <h4 className="text-sm font-semibold text-carbon line-clamp-2 leading-tight">
                {part.name}
              </h4>

              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-carbon">
                  {part.price.toFixed(2)}
                </span>
                <span className="text-xs text-carbon/50">€</span>
              </div>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 rounded-xl border-2 border-mineral opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* Show More Link */}
      {parts.length > 8 && (
        <div className="text-center pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/60 border border-mineral/20 rounded-full hover:bg-white hover:border-mineral/40 transition-all duration-300 text-sm font-medium text-carbon"
          >
            Voir les {parts.length - 8} autres pièces
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProductsUsed;
