import { motion } from "framer-motion";
import { Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { XPLevel } from "@/lib/xpLevels";

interface LevelUpToastProps {
  newLevel: XPLevel;
  previousLevel: XPLevel;
}

const LevelUpToast = ({ newLevel, previousLevel }: LevelUpToastProps) => {
  const LevelIcon = newLevel.LucideIcon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 100 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        duration: 0.6 
      }}
      className="relative overflow-hidden rounded-3xl p-6 min-w-[320px]"
      style={{
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
        border: `2px solid ${newLevel.glowColor}`,
        boxShadow: `0 0 40px ${newLevel.glowColor}, 0 0 80px ${newLevel.glowColor}`,
      }}
    >
      {/* Floating sparkles */}
      <motion.div
        className="absolute top-2 right-4"
        animate={{ 
          y: [0, -8, 0], 
          rotate: [0, 15, -15, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className="w-5 h-5 text-amber-400" />
      </motion.div>
      
      <motion.div
        className="absolute bottom-4 left-4"
        animate={{ 
          y: [0, 5, 0], 
          rotate: [0, -10, 10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
      >
        <Sparkles className="w-4 h-4 text-yellow-300" />
      </motion.div>

      {/* Crown icon + "LEVEL UP" text */}
      <motion.div 
        className="flex items-center gap-2 mb-4"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Crown className="w-5 h-5 text-amber-400" />
        </motion.div>
        <span className="text-amber-400 font-display text-lg tracking-widest uppercase">
          Level Up!
        </span>
      </motion.div>

      {/* New level display */}
      <motion.div 
        className="flex items-center gap-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
      >
        <motion.div 
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center",
            newLevel.bgColor
          )}
          animate={{ 
            boxShadow: [
              `0 0 20px ${newLevel.glowColor}`,
              `0 0 40px ${newLevel.glowColor}`,
              `0 0 20px ${newLevel.glowColor}`
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <LevelIcon className={cn("w-8 h-8", newLevel.color)} />
        </motion.div>
        <div>
          <p className="text-sm text-white/50">Nouveau grade</p>
          <motion.p 
            className={cn("font-display text-3xl font-bold", newLevel.color)}
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            {newLevel.name}
          </motion.p>
        </div>
      </motion.div>

      {/* Previous level indicator */}
      <motion.p 
        className="mt-4 text-xs text-white/40 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {previousLevel.name} → {newLevel.name}
      </motion.p>
    </motion.div>
  );
};

export default LevelUpToast;
