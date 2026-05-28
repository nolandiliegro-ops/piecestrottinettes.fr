import { motion, useReducedMotion } from "framer-motion";
import { Star, Clock, Eye, CalendarDays } from "lucide-react";

type FeaturedRider = {
  name: string;
  metrics: {
    lastUpdate: string;
    weekViews: string | number;
    nextRiderIn: string;
  };
};

type Props = {
  rider: FeaturedRider;
};


const GarageWeekHeader = ({ rider }: Props) => {
  const reduceMotion = useReducedMotion();

  const metaItems = [
    { icon: Clock, label: `Mis à jour ${rider.metrics.lastUpdate}` },
    { icon: Eye, label: `${rider.metrics.weekViews} visites cette semaine` },
    { icon: CalendarDays, label: `Prochain rider : ${rider.metrics.nextRiderIn}` },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 lg:gap-8">
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center self-start gap-2">
          <motion.span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase"
            style={{
              background:
                "linear-gradient(135deg, #FF7A1A 0%, #FF6600 50%, #E55A00 100%)",
              color: "#FFFFFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow:
                "0 4px 12px -2px rgba(255,102,0,0.45), 0 1px 0 rgba(255,255,255,0.25) inset, 0 -1px 0 rgba(0,0,0,0.15) inset",
            }}
            animate={
              reduceMotion
                ? undefined
                : {
                    boxShadow: [
                      "0 4px 12px -2px rgba(255,102,0,0.45), 0 1px 0 rgba(255,255,255,0.25) inset, 0 -1px 0 rgba(0,0,0,0.15) inset",
                      "0 6px 20px -2px rgba(255,102,0,0.65), 0 1px 0 rgba(255,255,255,0.35) inset, 0 -1px 0 rgba(0,0,0,0.15) inset",
                      "0 4px 12px -2px rgba(255,102,0,0.45), 0 1px 0 rgba(255,255,255,0.25) inset, 0 -1px 0 rgba(0,0,0,0.15) inset",
                    ],
                  }
            }
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Star className="w-3 h-3 fill-current" strokeWidth={0} />
            Rider de la semaine
          </motion.span>
        </div>

        <h3
          className="text-[26px] sm:text-3xl md:text-4xl lg:text-[40px] leading-[1.05]"
          style={{
            fontFamily: "'Anton', sans-serif",
            color: "#1A1A1A",
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          Le garage de{" "}
          <span style={{ color: "#FF6600" }}>{rider.name}</span>
        </h3>
      </div>

      <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-x-5 sm:gap-y-2 lg:items-center">
        {metaItems.map((m) => {
          const Icon = m.icon;
          return (
            <li
              key={m.label}
              className="flex items-center gap-2"
            >
              <span className="relative inline-flex items-center justify-center">
                <span
                  className="absolute inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: "rgba(74,124,89,0.35)" }}
                  aria-hidden
                />
                <motion.span
                  className="relative inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#4A7C59" }}
                  animate={
                    reduceMotion
                      ? undefined
                      : { opacity: [1, 0.4, 1] }
                  }
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  aria-hidden
                />
              </span>
              <Icon className="w-3.5 h-3.5" style={{ color: "#6B7280" }} strokeWidth={2} />
              <span
                className="text-[12px] sm:text-[13px]"
                style={{
                  color: "#6B7280",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {m.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default GarageWeekHeader;
