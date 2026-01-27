import { motion } from "framer-motion";

interface Part {
  id: string;
  name: string;
  image_url: string | null;
}

interface GamingThumbnailsProps {
  parts: Part[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

const GamingThumbnails = ({ parts, currentIndex, onSelect }: GamingThumbnailsProps) => {
  // Show max 7 thumbnails centered around current
  const maxVisible = 7;
  const halfVisible = Math.floor(maxVisible / 2);
  
  let startIndex = Math.max(0, currentIndex - halfVisible);
  let endIndex = Math.min(parts.length, startIndex + maxVisible);
  
  // Adjust if we're near the end
  if (endIndex - startIndex < maxVisible) {
    startIndex = Math.max(0, endIndex - maxVisible);
  }
  
  const visibleParts = parts.slice(startIndex, endIndex);

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3 mt-8 px-4">
      {visibleParts.map((part, idx) => {
        const actualIndex = startIndex + idx;
        const isActive = actualIndex === currentIndex;
        
        return (
          <motion.button
            key={part.id}
            onClick={() => onSelect(actualIndex)}
            className="relative flex-shrink-0 overflow-hidden transition-all duration-300"
            style={{
              width: isActive ? "60px" : "50px",
              height: isActive ? "60px" : "50px",
              background: isActive 
                ? "rgba(147, 181, 161, 0.2)" 
                : "rgba(255, 255, 255, 0.05)",
              border: isActive 
                ? "2px solid rgba(147, 181, 161, 0.8)" 
                : "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              boxShadow: isActive 
                ? "0 0 20px rgba(147, 181, 161, 0.5)" 
                : "none",
            }}
            whileHover={{ 
              scale: 1.1,
              boxShadow: "0 0 15px rgba(147, 181, 161, 0.4)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            {part.image_url ? (
              <img
                src={part.image_url}
                alt={part.name}
                className="w-full h-full object-contain p-1"
                style={{
                  filter: isActive ? "none" : "grayscale(50%)",
                  opacity: isActive ? 1 : 0.6,
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
                ?
              </div>
            )}
            
            {/* Active indicator dot */}
            {isActive && (
              <motion.div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-mineral"
                layoutId="activeThumbnail"
                style={{
                  boxShadow: "0 0 8px rgba(147, 181, 161, 0.8)",
                }}
              />
            )}
          </motion.button>
        );
      })}
      
      {/* Indicator for more items */}
      {parts.length > maxVisible && (
        <span className="text-white/40 text-xs ml-2">
          +{parts.length - maxVisible}
        </span>
      )}
    </div>
  );
};

export default GamingThumbnails;
