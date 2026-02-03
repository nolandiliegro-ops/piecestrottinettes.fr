import { motion } from "framer-motion";
import { Trophy, Sparkles, Zap } from "lucide-react";

interface XPToastProps {
  points: number;
  action: string;
}

const XPToast = ({ points, action }: XPToastProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -50 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.5,
      }}
      className="relative overflow-hidden rounded-2xl p-5 shadow-2xl min-w-[280px]"
      style={{
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
        border: "1px solid rgba(255, 215, 0, 0.3)",
      }}
    >
      {/* Animated glow background */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.4) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, rgba(255, 215, 0, 0.4) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.4) 0%, transparent 50%)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating sparkles */}
      <motion.div
        className="absolute top-3 right-3"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Sparkles className="w-5 h-5 text-amber-400" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex items-center gap-4">
        {/* Trophy Icon with pulsing glow */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
          className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center relative"
          style={{
            background: "linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)",
            border: "1px solid rgba(255, 215, 0, 0.4)",
          }}
        >
          <Trophy className="w-7 h-7 text-amber-400" />

          {/* Pulsing glow effect */}
          <motion.div
            className="absolute inset-0 rounded-xl"
            animate={{
              boxShadow: [
                "0 0 15px rgba(255, 215, 0, 0.3)",
                "0 0 30px rgba(255, 215, 0, 0.5)",
                "0 0 15px rgba(255, 215, 0, 0.3)",
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Text Content */}
        <div className="flex-1 space-y-1">
          {/* Points with animation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-display text-2xl font-bold text-amber-400">
              +{points} XP
            </span>
          </motion.div>

          {/* Action description */}
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-sm text-white/70"
          >
            {action}
          </motion.p>
        </div>
      </div>

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.1) 50%, transparent 100%)",
        }}
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
    </motion.div>
  );
};

export default XPToast;
