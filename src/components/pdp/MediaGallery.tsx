import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageOff, ChevronLeft, ChevronRight } from "lucide-react";
import { getAllImages, type ImageEntry } from "@/lib/entityImage";

interface MediaGalleryProps {
  imageUrl: string | null;
  images?: unknown;
  productName: string;
}

const MediaGallery = ({ imageUrl, images, productName }: MediaGalleryProps) => {
  const allImages: ImageEntry[] = getAllImages(images, imageUrl);
  const hasGallery = allImages.length > 1;
  const [currentIdx, setCurrentIdx] = useState(0);
  const current = allImages[currentIdx];

  const goPrev = () => setCurrentIdx((i) => (i - 1 + allImages.length) % allImages.length);
  const goNext = () => setCurrentIdx((i) => (i + 1) % allImages.length);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="h-full bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg overflow-hidden flex flex-col group"
    >
      {current ? (
        <div className="relative flex-1 flex items-center justify-center p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.img
              key={current.url}
              src={current.url}
              alt={current.alt || productName}
              loading="lazy"
              decoding="async"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent pointer-events-none" />

          {hasGallery && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Photo précédente"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 flex items-center justify-center hover:bg-white transition-colors shadow-md"
              >
                <ChevronLeft className="w-5 h-5 text-carbon" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Photo suivante"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 flex items-center justify-center hover:bg-white transition-colors shadow-md"
              >
                <ChevronRight className="w-5 h-5 text-carbon" />
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-carbon/30 p-8">
          <ImageOff className="w-16 h-16 mb-4" />
          <p className="font-display text-lg uppercase tracking-wide">Image à venir</p>
        </div>
      )}

      {hasGallery && (
        <div className="flex justify-center gap-2 flex-wrap p-4 border-t border-white/30 bg-white/20">
          {allImages.map((img, idx) => (
            <button
              key={`${img.url}-${idx}`}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              aria-label={`Voir photo ${idx + 1}`}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 bg-white/60 transition-all ${
                idx === currentIdx
                  ? "border-mineral shadow-md scale-105"
                  : "border-white/40 opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={img.url}
                alt={img.alt || `${productName} ${idx + 1}`}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MediaGallery;
