import { motion } from "framer-motion";

interface Stat {
  name: string;
  value: number;
}

interface GamingStatBarProps {
  stats: Stat[];
}

const GamingStatBar = ({ stats }: GamingStatBarProps) => {
  return (
    <div className="space-y-3 max-w-md mx-auto w-full px-4">
      {stats.map((stat, index) => (
        <div key={stat.name} className="flex items-center gap-4">
          <span className="text-white/70 text-xs md:text-sm uppercase tracking-wider w-28 md:w-32">
            {stat.name}
          </span>
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, hsl(var(--mineral)) 0%, hsl(var(--mineral-glow)) 100%)",
                boxShadow: "0 0 10px rgba(147, 181, 161, 0.5)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${stat.value}%` }}
              transition={{ duration: 1, delay: 0.3 + index * 0.15, ease: "easeOut" }}
            />
          </div>
          <span className="text-mineral font-bold w-12 text-right text-sm">
            {stat.value}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default GamingStatBar;
