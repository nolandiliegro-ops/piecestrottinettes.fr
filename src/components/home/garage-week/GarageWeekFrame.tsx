import { motion, useReducedMotion } from "framer-motion";
import {
  Play,
  Share2,
  CheckCircle2,
  Wrench,
  Calendar,
  Bike,
  Lock,
  Palette,
  Ticket,
  Handshake,
} from "lucide-react";
import RooftopBackground from "@/components/garage/RooftopBackground";
import RiderProfileCard from "@/components/garage/RiderProfileCard";
import StatsRow from "@/components/garage/StatsRow";
import HeroScooter from "@/components/garage/HeroScooter";
import GlassCard from "@/components/garage/GlassCard";
import type { FeaturedRider } from "../GarageOfTheWeekSection";

type Props = {
  rider: FeaturedRider;
};

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

const XP_PARTICLES = [
  { value: "+25 XP", color: "orange" as const, left: "16%", delay: 0, drift: 14 },
  { value: "+50 XP", color: "sage" as const, left: "58%", delay: 1.3, drift: -10 },
  { value: "+10 XP", color: "orange" as const, left: "80%", delay: 2.7, drift: 8 },
  { value: "+15 XP", color: "sage" as const, left: "36%", delay: 4.1, drift: -16 },
];

const NEXT_BONUSES = [
  { Icon: Palette, label: "Wallpaper Skatepark", level: 3, accent: "#4A7C59" },
  { Icon: Ticket, label: "-10% sur consommables", level: 4, accent: "#FF6600" },
  { Icon: Handshake, label: "Test produit gratuit", level: 5, accent: "#E89A3A" },
];

const TUTOS_PREVIEW = [
  {
    title: "Régler ses freins",
    badge: "Débutant",
    badgeBg: "#4A7C59",
    gradient: "linear-gradient(135deg, #3F6B4A 0%, #243F2E 100%)",
  },
  {
    title: "Changer une chambre",
    badge: "Moyen",
    badgeBg: "#FF6600",
    gradient: "linear-gradient(135deg, #8B3A20 0%, #4F1F10 100%)",
  },
];

const GarageWeekFrame = ({ rider }: Props) => {
  const reduceMotion = useReducedMotion();

  const syntheticProfile = {
    display_name: rider.name,
    avatar_url: rider.avatarUrl,
    bio: rider.quote,
    rider_location: rider.location,
    performance_points: rider.xp,
  };

  return (
    <div
      className="relative w-full rounded-[28px] lg:rounded-[32px] overflow-hidden isolate"
      style={{
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 60px -12px rgba(0,0,0,0.30), 0 8px 24px -8px rgba(0,0,0,0.20), 0 2px 6px -2px rgba(0,0,0,0.15)",
      }}
    >
      {/* LAYER 0 — Wallpaper rooftop sunset (prod component) */}
      <RooftopBackground />

      {/* Top legibility overlay (very subtle) */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 z-[1] pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, transparent 100%)",
        }}
      />

      {/* LAYER 1 — XP particles (desktop only) */}
      {!reduceMotion && (
        <div
          aria-hidden
          className="hidden lg:block absolute inset-0 z-[2] pointer-events-none overflow-hidden"
        >
          {XP_PARTICLES.map((p) => (
            <motion.div
              key={p.value + p.left}
              className="absolute px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider"
              style={{
                left: p.left,
                bottom: "12%",
                color: "#FFFFFF",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background:
                  p.color === "orange"
                    ? "linear-gradient(135deg, rgba(255,122,26,0.95) 0%, rgba(255,102,0,0.95) 100%)"
                    : "linear-gradient(135deg, rgba(95,150,108,0.95) 0%, rgba(74,124,89,0.95) 100%)",
                boxShadow:
                  p.color === "orange"
                    ? "0 4px 14px -2px rgba(255,102,0,0.50), 0 1px 0 rgba(255,255,255,0.30) inset"
                    : "0 4px 14px -2px rgba(74,124,89,0.50), 0 1px 0 rgba(255,255,255,0.30) inset",
                willChange: "transform, opacity",
              }}
              initial={{ y: 20, x: 0, opacity: 0, rotate: -2 }}
              animate={{
                y: [-10, -320],
                x: [0, p.drift, p.drift * 0.5, 0],
                opacity: [0, 1, 1, 0],
                rotate: [-2, 1, -1, 2],
              }}
              transition={{
                duration: 6,
                delay: p.delay,
                repeat: Infinity,
                ease: easeOutExpo,
                times: [0, 0.15, 0.75, 1],
              }}
            >
              {p.value}
            </motion.div>
          ))}
        </div>
      )}

      {/* LAYER 2 — Sparkles décoratifs */}
      {!reduceMotion && (
        <div aria-hidden className="hidden lg:block absolute inset-0 z-[2] pointer-events-none">
          {[
            { top: "12%", left: "8%", delay: 0 },
            { top: "20%", right: "10%", delay: 1.4 },
            { top: "50%", left: "4%", delay: 2.1 },
            { top: "30%", right: "5%", delay: 3.0 },
            { top: "70%", right: "8%", delay: 0.8 },
          ].map((s, i) => (
            <motion.span
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                ...s,
                backgroundColor: "#FFFFFF",
                boxShadow: "0 0 8px rgba(255,255,255,0.9), 0 0 14px rgba(255,200,140,0.6)",
              }}
              animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.6] }}
              transition={{
                duration: 3.5,
                delay: s.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* LAYER 3 — Content */}
      <div className="relative z-[3] p-5 sm:p-6 lg:p-8">
        <div className="grid gap-5 lg:gap-7 lg:grid-cols-[320px_1fr_320px] lg:min-h-[560px]">
          {/* COL LEFT — Rider profile */}
          <div className="flex flex-col gap-4">
            <RiderProfileCard
              profile={syntheticProfile}
              variant="rooftop"
              showXPBar
            />
          </div>

          {/* COL CENTER — Stats + Hero scooter */}
          <div className="flex flex-col gap-4 lg:gap-5 min-w-0">
            <StatsRow
              voltage={rider.scooter.volt}
              amperage={rider.scooter.amp}
              powerWatts={rider.scooter.watt}
            />

            <div className="relative flex-1 flex flex-col items-center justify-end">
              <HeroScooter
                imageUrl={rider.scooter.imageUrl}
                modelName={`${rider.scooter.brand} ${rider.scooter.name}`}
                scooterCount={1}
                currentIndex={0}
                className="!aspect-[4/3] !pb-6"
              />

              <div className="flex flex-col items-center gap-2 -mt-2">
                <div
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.96)",
                    boxShadow:
                      "0 8px 22px -6px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.6) inset",
                  }}
                >
                  <CheckCircle2
                    className="w-3.5 h-3.5"
                    style={{ color: "#4A7C59" }}
                    strokeWidth={2.6}
                    aria-hidden
                  />
                  <span
                    className="text-[11px] sm:text-[12px]"
                    style={{
                      fontFamily: "'Anton', sans-serif",
                      color: "#1A1A1A",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {rider.scooter.brand} {rider.scooter.name}
                  </span>
                </div>

                <p
                  className="text-[11px] sm:text-[12px] font-medium text-center"
                  style={{
                    color: "rgba(255,255,255,0.92)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    textShadow: "0 1px 4px rgba(0,0,0,0.45)",
                  }}
                >
                  {rider.scooter.partsInstalled} pièces installées · Dernière révision il y a{" "}
                  {rider.scooter.lastServiceDays} jours
                </p>
              </div>
            </div>
          </div>

          {/* COL RIGHT — Tutos, Share, Next bonuses */}
          <div className="flex flex-col gap-3.5">
            {/* Tutos */}
            <GlassCard
              className="p-4"
              style={{
                background: "rgba(255,255,255,0.42)",
                backdropFilter: "blur(24px) saturate(160%)",
                WebkitBackdropFilter: "blur(24px) saturate(160%)",
                border: "1px solid rgba(255,255,255,0.50)",
                boxShadow:
                  "0 20px 50px -10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.7)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-flex items-center justify-center w-5 h-5 rounded-md"
                    style={{
                      background: "linear-gradient(135deg, #FF7A1A 0%, #E55A00 100%)",
                      boxShadow: "0 2px 6px -1px rgba(255,102,0,0.50)",
                    }}
                  >
                    <Play
                      className="w-2.5 h-2.5 text-white fill-white ml-0.5"
                      strokeWidth={0}
                    />
                  </span>
                  <span
                    className="text-[10.5px] font-extrabold tracking-[0.16em] uppercase"
                    style={{
                      color: "#1A1A1A",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    Tutos sur mesure
                  </span>
                </div>
                <span
                  className="text-[10px] font-bold tracking-wider"
                  style={{
                    color: "rgba(0,0,0,0.55)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {rider.tutorials} VIDÉOS
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TUTOS_PREVIEW.map((v) => (
                  <div
                    key={v.title}
                    className="group relative aspect-video rounded-xl overflow-hidden"
                    style={{ background: v.gradient }}
                  >
                    <span
                      className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8.5px] font-bold tracking-wider uppercase"
                      style={{
                        backgroundColor: v.badgeBg,
                        color: "#FFFFFF",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {v.badge}
                    </span>
                    <span
                      aria-hidden
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.95)",
                          boxShadow: "0 4px 12px -2px rgba(0,0,0,0.45)",
                        }}
                      >
                        <Play
                          className="w-3 h-3 fill-current ml-0.5"
                          style={{ color: "#1A1A1A" }}
                          strokeWidth={0}
                        />
                      </span>
                    </span>
                    <span
                      className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-semibold text-white text-left leading-tight"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                      }}
                    >
                      {v.title}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Share build — green hero card */}
            <div
              className="relative rounded-2xl p-4 overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #5F9E73 0%, #4A7C59 50%, #2C5A3F 100%)",
                boxShadow:
                  "0 1px 0 rgba(255,255,255,0.25) inset, 0 16px 32px -10px rgba(44,90,63,0.55), 0 4px 10px -4px rgba(0,0,0,0.3)",
              }}
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.20) 0%, transparent 55%)",
                }}
              />
              <div className="relative flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.28)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <Share2 className="w-4 h-4 text-white" strokeWidth={2.2} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span
                      className="text-[14.5px]"
                      style={{
                        fontFamily: "'Anton', sans-serif",
                        color: "#FFFFFF",
                        letterSpacing: "-0.01em",
                        textTransform: "uppercase",
                      }}
                    >
                      Partager mon build
                    </span>
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider uppercase"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.95)",
                        color: "#2C5A3F",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      Gratuit
                    </span>
                  </div>
                  <div
                    className="text-[11.5px]"
                    style={{
                      color: "rgba(255,255,255,0.80)",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    +15 XP par partage
                  </div>
                </div>
              </div>
            </div>

            {/* Next bonuses */}
            <GlassCard
              className="p-4"
              style={{
                background: "rgba(255,255,255,0.42)",
                backdropFilter: "blur(24px) saturate(160%)",
                WebkitBackdropFilter: "blur(24px) saturate(160%)",
                border: "1px solid rgba(255,255,255,0.50)",
                boxShadow:
                  "0 20px 50px -10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.7)",
              }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <span
                  aria-hidden
                  className="inline-flex items-center justify-center w-5 h-5 rounded-md"
                  style={{
                    background: "linear-gradient(135deg, #FFD58A 0%, #FFA64D 100%)",
                    boxShadow: "0 2px 6px -1px rgba(255,166,77,0.50)",
                  }}
                >
                  <Lock className="w-2.5 h-2.5 text-white" strokeWidth={2.6} />
                </span>
                <span
                  className="text-[10.5px] font-extrabold tracking-[0.16em] uppercase"
                  style={{
                    color: "#1A1A1A",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Prochains bonus à débloquer
                </span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {NEXT_BONUSES.map((b) => {
                  const Icon = b.Icon;
                  return (
                    <li
                      key={b.label}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.40)",
                        border: "1px solid rgba(255,255,255,0.45)",
                      }}
                    >
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${b.accent}25 0%, ${b.accent}10 100%)`,
                          border: `1px solid ${b.accent}40`,
                        }}
                      >
                        <Icon
                          className="w-3.5 h-3.5"
                          style={{ color: b.accent }}
                          strokeWidth={2.2}
                        />
                      </span>
                      <span
                        className="flex-1 text-[12px] font-semibold truncate"
                        style={{
                          color: "#1A1A1A",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        {b.label}
                      </span>
                      <span
                        className="text-[9.5px] font-extrabold tracking-wider uppercase flex-shrink-0 px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: "#1A1A1A",
                          color: "#FF6600",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        LVL {b.level}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </GlassCard>
          </div>
        </div>

        {/* BOTTOM BAND — 3 mini stats horizontales */}
        <div
          className="mt-5 lg:mt-7 rounded-2xl px-4 py-3 lg:px-5 lg:py-3.5"
          style={{
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(20px) saturate(150%)",
            WebkitBackdropFilter: "blur(20px) saturate(150%)",
            border: "1px solid rgba(255,255,255,0.30)",
            boxShadow:
              "0 8px 22px -8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.40)",
          }}
        >
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-8">
            {[
              { Icon: Wrench, value: `${rider.modCount} mods installées` },
              { Icon: Calendar, value: `Membre depuis ${rider.memberSince}` },
              { Icon: Bike, value: `${rider.scooterCount} trotti dans le garage` },
            ].map((s, idx, arr) => {
              const Icon = s.Icon;
              return (
                <li key={s.value} className="flex items-center gap-2">
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: "rgba(255,255,255,0.85)" }}
                    strokeWidth={2.2}
                    aria-hidden
                  />
                  <span
                    className="text-[12px] sm:text-[13px] font-semibold"
                    style={{
                      color: "#FFFFFF",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      textShadow: "0 1px 3px rgba(0,0,0,0.35)",
                    }}
                  >
                    {s.value}
                  </span>
                  {idx < arr.length - 1 && (
                    <span
                      className="hidden sm:inline-block w-1 h-1 rounded-full ml-3"
                      style={{ backgroundColor: "rgba(255,255,255,0.45)" }}
                      aria-hidden
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GarageWeekFrame;
