import { motion } from "framer-motion";
import { 
  Disc, 
  CircleDot, 
  Circle, 
  PlugZap, 
  BatteryFull, 
  Sparkles,
  LucideIcon
} from "lucide-react";

interface CategoryConfig {
  icon: LucideIcon;
  color: string;
}

const categoryConfig: Record<string, CategoryConfig> = {
  'Freinage': { icon: Disc, color: '#D50000' },
  'Pneus': { icon: CircleDot, color: '#37474F' },
  'Chambres à Air': { icon: Circle, color: '#40C4FF' },
  'Chargeurs': { icon: PlugZap, color: '#2962FF' },
  'Batteries': { icon: BatteryFull, color: '#00C853' },
  'Accessoires': { icon: Sparkles, color: '#FFAB00' },
};

// Helper to convert hex to RGB values
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 171, b: 0 }; // Default to gold
};

interface CategoryBadgeProps {
  categoryName: string;
}

const CategoryBadge = ({ categoryName }: CategoryBadgeProps) => {
  // Find matching category or default to Accessoires
  const config = categoryConfig[categoryName] || categoryConfig['Accessoires'];
  const Icon = config.icon;
  const rgb = hexToRgb(config.color);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{ 
        delay: 0.1, 
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="absolute top-0 left-1/2 -translate-x-1/2 mt-4 z-30"
    >
      <div 
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 shadow-lg"
        style={{
          backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: `0 4px 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`,
        }}
      >
        <Icon className="h-5 w-5 text-white" strokeWidth={2} />
        <span className="text-white text-sm font-semibold tracking-wider uppercase">
          {categoryName}
        </span>
      </div>
    </motion.div>
  );
};

export default CategoryBadge;
