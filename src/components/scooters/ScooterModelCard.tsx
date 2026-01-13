import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { getScooterImage } from "@/lib/scooterImageMapping";

interface ScooterModel {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  compatible_parts_count: number | null;
  brand?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ScooterModelCardProps {
  scooter: ScooterModel;
  index?: number;
}

const ScooterModelCard = ({ scooter, index = 0 }: ScooterModelCardProps) => {
  const displayImage = getScooterImage(scooter.slug, scooter.image_url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        to={`/scooter/${scooter.slug}`}
        className="group block bg-white/40 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden hover:shadow-xl hover:border-mineral/30 transition-all duration-300"
      >
        {/* Image Container */}
        <div className="relative aspect-square bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden">
          {displayImage ? (
            <motion.img
              src={displayImage}
              alt={scooter.name}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              whileHover={{ scale: 1.05 }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl opacity-20">🛴</span>
            </div>
          )}

          {/* Brand Badge */}
          {scooter.brand && (
            <div className="absolute top-3 left-3">
              <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-carbon uppercase tracking-wide">
                {scooter.brand.name}
              </span>
            </div>
          )}

          {/* Parts Count Badge */}
          {scooter.compatible_parts_count && scooter.compatible_parts_count > 0 && (
            <div className="absolute bottom-3 right-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-mineral/90 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                <Wrench className="w-3 h-3" />
                {scooter.compatible_parts_count} pièces
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-display text-lg lg:text-xl text-carbon group-hover:text-mineral transition-colors line-clamp-1">
            {scooter.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Voir les pièces compatibles →
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

export default ScooterModelCard;
