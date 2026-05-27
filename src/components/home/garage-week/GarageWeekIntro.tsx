import { motion, useReducedMotion } from "framer-motion";

const GarageWeekIntro = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mx-auto max-w-[760px] text-center">
      <motion.div
        className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full mb-5 lg:mb-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(74,124,89,0.14) 0%, rgba(74,124,89,0.06) 100%)",
          border: "1px solid rgba(74,124,89,0.30)",
          boxShadow: "0 4px 14px -4px rgba(74,124,89,0.20)",
        }}
        animate={
          reduceMotion
            ? undefined
            : {
                boxShadow: [
                  "0 4px 14px -4px rgba(74,124,89,0.20)",
                  "0 4px 22px -4px rgba(74,124,89,0.40)",
                  "0 4px 14px -4px rgba(74,124,89,0.20)",
                ],
              }
        }
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="relative inline-flex items-center justify-center" aria-hidden>
          <span
            className="absolute inline-flex h-2.5 w-2.5 rounded-full opacity-75 animate-ping"
            style={{ backgroundColor: "#4A7C59" }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{
              backgroundColor: "#4A7C59",
              boxShadow: "0 0 8px rgba(74,124,89,0.7)",
            }}
          />
        </span>
        <span
          className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase"
          style={{
            color: "#2C5A3F",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          + de 8 000 riders nous font confiance
        </span>
      </motion.div>

      <h2
        id="garage-of-the-week-title"
        className="text-[30px] sm:text-4xl md:text-5xl lg:text-[58px] leading-[1.02] mb-5 lg:mb-6"
        style={{
          fontFamily: "'Anton', sans-serif",
          color: "#1A1A1A",
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
        }}
      >
        Ton espace rider.
        <br />
        <span className="relative inline-block">
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-[0.10em] h-[0.55em] -z-0 rounded-[2px]"
            style={{
              backgroundColor: "rgba(255,102,0,0.22)",
              transform: "skewX(-4deg)",
            }}
          />
          <span className="relative z-10" style={{ color: "#FF6600" }}>
            Ta communauté.
          </span>
        </span>
      </h2>

      <div
        className="max-w-2xl mx-auto space-y-1.5"
        style={{
          color: "#6B7280",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <p className="text-[15px] sm:text-base lg:text-lg leading-[1.55]">
          Crée ton profil. Personnalise ton garage.{" "}
          <span className="font-semibold" style={{ color: "#1A1A1A" }}>
            Suis ta machine en temps réel.
          </span>
        </p>
        <p className="text-[14px] sm:text-[15px] lg:text-base leading-[1.55]">
          Gagne de l'XP à chaque action, débloque des wallpapers exclusifs,
          accède à des offres réservées membres.
        </p>
        <p className="text-[13px] sm:text-sm lg:text-[15px] leading-[1.55] italic pt-1">
          Le meilleur de la communauté mobilité électrique —{" "}
          <span className="not-italic font-bold" style={{ color: "#4A7C59" }}>
            gratuit, fun, addictif.
          </span>
        </p>
      </div>
    </div>
  );
};

export default GarageWeekIntro;
