import { motion } from 'framer-motion';
import { Wallpaper } from 'lucide-react';

interface WallpaperFABProps {
  onClick: () => void;
}

/**
 * Secondary FAB to open the ThemePickerSheet.
 * Positioned to the LEFT of the primary "+" FAB to avoid collision.
 */
const WallpaperFAB = ({ onClick }: WallpaperFABProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      title="Changer le fond"
      aria-label="Changer le fond du garage"
      className="fixed bottom-24 md:bottom-8 right-24 z-40 w-14 h-14
                 rounded-full bg-white/20 backdrop-blur-2xl border border-white/30
                 shadow-2xl flex items-center justify-center
                 hover:bg-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]
                 transition-colors"
    >
      <Wallpaper className="w-6 h-6 text-white" />
    </motion.button>
  );
};

export default WallpaperFAB;
