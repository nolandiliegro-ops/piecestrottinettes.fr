import { motion } from "framer-motion";

/**
 * Premium placeholder silhouette for scooters without images.
 * Displays an elegant SVG silhouette with subtle lighting effects.
 */
const ScooterPlaceholder = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Subtle ambient glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(147,181,161,0.06) 0%, transparent 70%)"
        }}
      />
      
      {/* Premium Scooter Silhouette SVG */}
      <motion.svg 
        className="w-3/4 h-3/4 text-carbon/[0.08]"
        viewBox="0 0 200 150"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Simplified elegant scooter silhouette */}
        <g fill="currentColor">
          {/* Front wheel */}
          <circle cx="40" cy="120" r="22" />
          <circle cx="40" cy="120" r="12" fill="#F5F3F0" />
          
          {/* Back wheel */}
          <circle cx="160" cy="120" r="22" />
          <circle cx="160" cy="120" r="12" fill="#F5F3F0" />
          
          {/* Deck */}
          <rect x="35" y="105" width="130" height="8" rx="4" />
          
          {/* Stem */}
          <rect x="38" y="35" width="8" height="75" rx="2" />
          
          {/* Handlebar */}
          <rect x="20" y="30" width="45" height="6" rx="3" />
          <circle cx="20" cy="33" r="5" />
          <circle cx="65" cy="33" r="5" />
          
          {/* Battery/Motor area */}
          <rect x="130" y="95" width="35" height="12" rx="4" />
        </g>
      </motion.svg>
      
      {/* Floating badge */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <span className="px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-mineral/10 text-carbon/40 text-xs font-medium tracking-wide">
          Image bientôt disponible
        </span>
      </motion.div>
    </div>
  );
};

export default ScooterPlaceholder;
