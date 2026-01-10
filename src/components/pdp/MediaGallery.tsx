import { motion } from "framer-motion";
import { ImageOff } from "lucide-react";

interface MediaGalleryProps {
  imageUrl: string | null;
  productName: string;
}

const MediaGallery = ({ imageUrl, productName }: MediaGalleryProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="h-full bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden flex items-center justify-center group"
    >
      {imageUrl ? (
        <div className="relative w-full h-full flex items-center justify-center p-6 md:p-10">
          <img
            src={imageUrl}
            alt={productName}
            className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent pointer-events-none" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-carbon/30 p-8">
          <ImageOff className="w-16 h-16 mb-4" />
          <p className="font-display text-lg uppercase tracking-wide">
            Image à venir
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default MediaGallery;
