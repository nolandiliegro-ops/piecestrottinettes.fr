import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

type Props = {
  user: User | null;
};

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

const GarageWeekCTA = ({ user }: Props) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const handleCreate = () => {
    if (user) {
      navigate("/garage");
    } else {
      navigate("/login");
    }
  };

  const handleViewFull = () => {
    if (user) {
      navigate("/garage");
    } else {
      toast.info("Connecte-toi pour voir le garage complet", {
        description: "Crée ton compte en 1 minute, c'est gratuit.",
      });
      navigate("/login");
    }
  };

  return (
    <div
      className="relative mx-auto max-w-5xl rounded-[28px] lg:rounded-[32px] overflow-hidden isolate"
      style={{
        background:
          "linear-gradient(135deg, #1F1F1F 0%, #161616 40%, #0F0F0F 80%, #2C2C2C 100%)",
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.06) inset, 0 24px 60px -12px rgba(0,0,0,0.45), 0 8px 24px -8px rgba(0,0,0,0.25)",
      }}
    >
      {/* Radial accents */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 15% 100%, rgba(74,124,89,0.22) 0%, transparent 65%), radial-gradient(ellipse 60% 70% at 90% 0%, rgba(255,102,0,0.20) 0%, transparent 65%)",
        }}
      />
      {/* Top shine */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
        }}
      />

      <div className="relative px-6 sm:px-8 lg:px-12 py-12 lg:py-16 text-center">
        <h3
          className="text-[28px] sm:text-4xl md:text-5xl lg:text-[56px] leading-[1.02] mb-4 lg:mb-5"
          style={{
            fontFamily: "'Anton', sans-serif",
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          Ton garage{" "}
          <span style={{ color: "#FF6600" }}>t'attend.</span>
        </h3>

        <p
          className="text-[14px] sm:text-base lg:text-lg max-w-xl mx-auto mb-7 lg:mb-9"
          style={{
            color: "rgba(255,255,255,0.7)",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            lineHeight: 1.55,
          }}
        >
          1 minute pour s'inscrire. Aucune carte requise.{" "}
          <span className="font-semibold" style={{ color: "#FFFFFF" }}>
            +50 XP offerts à la création.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-7 lg:mb-9">
          {/* Primary CTA — shimmer */}
          <motion.button
            type="button"
            onClick={handleCreate}
            aria-label="Créer mon garage et recevoir 50 XP"
            className="group relative inline-flex items-center gap-2.5 px-6 lg:px-7 py-3.5 lg:py-4 rounded-xl text-white font-bold transition-transform duration-200 min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.97] overflow-hidden"
            style={{
              backgroundColor: "#FF6600",
              backgroundImage:
                "linear-gradient(135deg, #FF7A1A 0%, #FF6600 50%, #E55A00 100%)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: "0.03em",
              fontSize: "14px",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.3) inset, 0 -1px 0 rgba(0,0,0,0.2) inset, 0 12px 28px -8px rgba(255,102,0,0.55), 0 4px 10px -3px rgba(0,0,0,0.3)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {/* Shimmer overlay */}
            {!reduceMotion && (
              <motion.span
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)",
                  backgroundSize: "200% 100%",
                  willChange: "background-position",
                }}
                animate={{
                  backgroundPosition: ["-100% 0", "200% 0", "200% 0"],
                }}
                transition={{
                  duration: 4,
                  times: [0, 0.6, 1],
                  repeat: Infinity,
                  ease: easeOutExpo,
                  repeatDelay: 1.5,
                }}
              />
            )}
            <span className="relative inline-flex items-center gap-2.5">
              <Sparkles className="w-4 h-4" strokeWidth={2.4} />
              <span>Créer mon garage</span>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold tracking-wider"
                style={{
                  backgroundColor: "rgba(255,255,255,0.22)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  backdropFilter: "blur(4px)",
                }}
              >
                +50 XP
              </span>
            </span>
          </motion.button>

          {/* Secondary ghost CTA */}
          <button
            type="button"
            onClick={handleViewFull}
            aria-label={`Voir le garage complet de Nolan`}
            className="group inline-flex items-center gap-2 px-5 lg:px-6 py-3.5 lg:py-4 rounded-xl font-bold transition-all duration-200 min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.97]"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "#FFFFFF",
              border: "1px solid rgba(255,255,255,0.18)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: "0.03em",
              fontSize: "14px",
              backdropFilter: "blur(8px)",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.10)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
            }}
          >
            <span>Voir le garage complet de Nolan</span>
            <ArrowRight
              className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5"
              strokeWidth={2.4}
            />
          </button>
        </div>

        <p
          className="text-[12px] sm:text-[12.5px] italic"
          style={{
            color: "rgba(255,255,255,0.45)",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Chaque semaine, un nouveau rider en vitrine. Le prochain — c'est peut-être toi.
        </p>
      </div>
    </div>
  );
};

export default GarageWeekCTA;
