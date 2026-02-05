import { Trophy, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface XPPreviewProps {
  difficultyLevel: number | null;
  categoryName: string | null;
  isFirstInCategory?: boolean;
}

// Category multipliers matching the RPC function
const CATEGORY_MULTIPLIERS: Record<string, number> = {
  'Batteries': 2.0,
  'Freinage': 1.5,
  'Pneus': 1.3,
  'Chambres à Air': 1.2,
};

// Base XP by difficulty matching the RPC function
const DIFFICULTY_XP: Record<number, number> = {
  1: 10,
  2: 15,
  3: 25,
  4: 40,
  5: 60,
};

const XPPreview = ({ difficultyLevel, categoryName, isFirstInCategory = false }: XPPreviewProps) => {
  const difficulty = difficultyLevel || 2;
  const baseXP = DIFFICULTY_XP[difficulty] || 15;
  const multiplier = categoryName ? (CATEGORY_MULTIPLIERS[categoryName] || 1.0) : 1.0;
  
  const calculatedXP = Math.round(baseXP * multiplier);
  const minXP = calculatedXP;
  const maxXP = Math.min(calculatedXP + 20, 100); // +20 if first in category, capped at 100

  const showRange = !isFirstInCategory;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-4 py-3 bg-amber-50/80 border border-amber-200/50 rounded-xl backdrop-blur-sm"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Trophy className="w-5 h-5 text-amber-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-800">
              XP estimés : {showRange ? `${minXP}–${maxXP}` : maxXP} points
            </span>
            {isFirstInCategory && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full text-[10px] font-bold text-amber-900 uppercase"
              >
                <Sparkles className="w-3 h-3" />
                First!
              </motion.span>
            )}
          </div>
          
          <p className="text-xs text-amber-600/80 mt-1">
            {isFirstInCategory ? (
              <>Première pièce de cette catégorie ! <span className="font-medium">+20 XP bonus inclus</span></>
            ) : (
              <>+20 XP bonus si première pièce {categoryName ? `"${categoryName}"` : 'de cette catégorie'}</>
            )}
          </p>

          {/* XP Breakdown */}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-amber-600/70">
            <span>Base: {baseXP} XP</span>
            {multiplier > 1 && (
              <span className="flex items-center gap-1">
                × {multiplier} <span className="text-amber-700 font-medium">({categoryName})</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default XPPreview;
