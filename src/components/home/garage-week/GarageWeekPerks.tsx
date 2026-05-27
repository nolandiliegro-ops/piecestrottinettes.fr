import { motion, useReducedMotion } from "framer-motion";
import {
  Zap,
  Palette,
  PlayCircle,
  Coins,
  Ticket,
  Wrench,
  Handshake,
} from "lucide-react";

type PerkStatus = "active" | "soon" | "vision";

type Perk = {
  Icon: typeof Zap;
  iconAccent: string;
  title: string;
  description: string;
  status: PerkStatus;
  large?: boolean;
};

const PERKS: Perk[] = [
  {
    Icon: Zap,
    iconAccent: "#FF6600",
    title: "Gagne de l'XP en continu",
    description:
      "Chaque action te rapporte : ajouter une trotti, partager un build, suivre une maintenance.",
    status: "active",
  },
  {
    Icon: Palette,
    iconAccent: "#4A7C59",
    title: "Wallpapers exclusifs",
    description:
      "Débloque des fonds d'écran premium réservés aux membres du garage.",
    status: "active",
  },
  {
    Icon: PlayCircle,
    iconAccent: "#FF6600",
    title: "Tutos sur mesure",
    description:
      "Des vidéos taillées pour ton modèle, ton niveau et tes pièces installées.",
    status: "active",
  },
  {
    Icon: Coins,
    iconAccent: "#E89A3A",
    title: "Points fidélité",
    description:
      "Tes commandes te rapportent des points convertibles en réductions sur tes prochaines pièces.",
    status: "soon",
  },
  {
    Icon: Ticket,
    iconAccent: "#E89A3A",
    title: "Offres membres",
    description:
      "Accès anticipé aux soldes et codes promo réservés aux riders inscrits.",
    status: "soon",
  },
  {
    Icon: Wrench,
    iconAccent: "#E89A3A",
    title: "Suivi maintenance auto",
    description:
      "Rappels automatiques sur l'usure de tes pièces, basés sur ton kilométrage et tes mods.",
    status: "soon",
  },
  {
    Icon: Handshake,
    iconAccent: "#FF6600",
    title: "Partenariats marques & visibilité",
    description:
      "Les riders les plus actifs pourront être mis en avant par les marques, recevoir du matériel à tester, et bénéficier de collaborations exclusives.",
    status: "vision",
    large: true,
  },
];

const STATUS_LABEL: Record<PerkStatus, { text: string; color: string; symbol: string }> = {
  active: { text: "Actif", color: "#4A7C59", symbol: "●" },
  soon: { text: "Bientôt", color: "#E89A3A", symbol: "◷" },
  vision: { text: "Vision long terme", color: "#FF6600", symbol: "★" },
};

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

const GarageWeekPerks = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8 lg:mb-12 max-w-2xl mx-auto">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
          style={{
            backgroundColor: "rgba(255,102,0,0.10)",
            border: "1px solid rgba(255,102,0,0.25)",
          }}
        >
          <span
            className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase"
            style={{
              color: "#FF6600",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Pourquoi créer ton garage
          </span>
        </div>
        <h3
          className="text-[26px] sm:text-3xl md:text-4xl lg:text-[42px] leading-[1.05] mb-3"
          style={{
            fontFamily: "'Anton', sans-serif",
            color: "#1A1A1A",
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          Une <span style={{ color: "#FF6600" }}>communauté</span>.
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> </span>
          De vrais avantages.
        </h3>
        <p
          className="text-[14px] sm:text-[15px] lg:text-base"
          style={{
            color: "#6B7280",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            lineHeight: 1.55,
          }}
        >
          Le garage c'est gratuit, mais ce que tu y gagnes ne l'est pas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {PERKS.map((perk, idx) => {
          const Icon = perk.Icon;
          const status = STATUS_LABEL[perk.status];
          const isVision = perk.status === "vision";
          const isSoon = perk.status === "soon";

          const cardStyle: React.CSSProperties = isVision
            ? {
                background:
                  "linear-gradient(135deg, #1F1F1F 0%, #141414 50%, #0A0A0A 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow:
                  "0 1px 0 rgba(255,255,255,0.06) inset, 0 20px 40px -16px rgba(0,0,0,0.45), 0 4px 12px -4px rgba(0,0,0,0.25)",
              }
            : isSoon
              ? {
                  background:
                    "linear-gradient(135deg, #FFF6EC 0%, #FFEED9 100%)",
                  border: "1px solid rgba(232,154,58,0.20)",
                  boxShadow:
                    "0 1px 0 rgba(255,255,255,0.8) inset, 0 8px 22px -10px rgba(232,154,58,0.25), 0 2px 6px -2px rgba(0,0,0,0.05)",
                }
              : {
                  background:
                    "linear-gradient(135deg, #FFFFFF 0%, #FAFAF8 100%)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow:
                    "0 1px 0 rgba(255,255,255,1) inset, 0 8px 22px -10px rgba(0,0,0,0.10), 0 2px 6px -2px rgba(0,0,0,0.04)",
                };

          const titleColor = isVision ? "#FFFFFF" : "#1A1A1A";
          const descColor = isVision ? "rgba(255,255,255,0.65)" : "#6B7280";

          return (
            <motion.div
              key={perk.title}
              className={`relative rounded-2xl p-5 lg:p-6 ${perk.large ? "lg:col-span-3" : ""}`}
              style={cardStyle}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: reduceMotion ? 0 : 0.6,
                delay: reduceMotion ? 0 : idx * 0.06,
                ease: easeOutExpo,
              }}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      y: -2,
                      transition: { duration: 0.3, ease: easeOutExpo },
                    }
              }
            >
              {/* Status */}
              <div className="absolute top-4 right-4 lg:top-5 lg:right-5">
                <span
                  className="inline-flex items-center gap-1 text-[9.5px] font-bold tracking-[0.14em] uppercase"
                  style={{
                    color: status.color,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  <span aria-hidden>{status.symbol}</span>
                  {status.text}
                </span>
              </div>

              <div className={`flex ${perk.large ? "items-start gap-5 lg:gap-7" : "flex-col"}`}>
                <div
                  className="w-12 h-12 lg:w-[52px] lg:h-[52px] rounded-xl flex items-center justify-center flex-shrink-0 mb-4 lg:mb-5"
                  style={
                    perk.large
                      ? {
                          background:
                            "linear-gradient(135deg, rgba(255,102,0,0.25) 0%, rgba(255,102,0,0.10) 100%)",
                          border: "1px solid rgba(255,102,0,0.35)",
                          marginBottom: 0,
                        }
                      : {
                          background: `linear-gradient(135deg, ${perk.iconAccent}25 0%, ${perk.iconAccent}10 100%)`,
                          border: `1px solid ${perk.iconAccent}30`,
                        }
                  }
                >
                  <Icon
                    className="w-5 h-5 lg:w-6 lg:h-6"
                    style={{ color: perk.iconAccent }}
                    strokeWidth={2.2}
                  />
                </div>

                <div className={perk.large ? "flex-1 pr-24 lg:pr-32" : ""}>
                  <h4
                    className={`mb-2 ${perk.large ? "text-xl lg:text-[26px]" : "text-[18px] lg:text-[22px]"}`}
                    style={{
                      fontFamily: "'Anton', sans-serif",
                      color: titleColor,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
                      textTransform: "uppercase",
                    }}
                  >
                    {perk.title}
                  </h4>
                  <p
                    className="text-[13px] lg:text-sm"
                    style={{
                      color: descColor,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      lineHeight: 1.55,
                    }}
                  >
                    {perk.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GarageWeekPerks;
