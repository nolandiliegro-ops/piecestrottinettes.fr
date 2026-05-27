import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bike,
  Camera,
  ChevronLeft,
  ChevronRight,
  Gauge,
  MapPin,
  Palette,
  Play,
  Sparkles,
  Star,
  Trophy,
  Wallet,
  Zap,
} from "lucide-react";
import { getXPLevel, getProgressToNextLevel } from "@/lib/xpLevels";
import RiderAvatar from "@/components/garage/RiderAvatar";
import { useScooterTutorials } from "@/hooks/useScooterTutorials";
import type { RiderBundle, RiderScooter } from "../GarageOfTheWeekSection";

type Props = {
  ridersBundle: RiderBundle[];
  currentRiderIndex: number;
  currentScooterIndex: number;
  onPrevRider: () => void;
  onNextRider: () => void;
  onGoToRider: (idx: number) => void;
  onGoToScooter: (idx: number) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

const XP_PARTICLES = [
  { value: "+25 XP", color: "orange" as const, left: "12%", delay: 0, drift: 14 },
  { value: "+50 XP", color: "sage" as const, left: "48%", delay: 1.3, drift: -10 },
  { value: "+10 XP", color: "orange" as const, left: "78%", delay: 2.7, drift: 8 },
];

const PERKS = [
  {
    Icon: Zap,
    label: "+50 XP à l'inscription, puis à chaque action",
    status: "active" as const,
  },
  {
    Icon: Palette,
    label: "Wallpapers exclusifs débloqués par niveau",
    status: "active" as const,
  },
  {
    Icon: Play,
    label: "Tutos sur mesure pour TON modèle",
    status: "active" as const,
  },
  {
    Icon: Wallet,
    label: "Points fidélité · Offres membres · Événements",
    status: "soon" as const,
  },
];

// Glass-light style cohérent pour toutes les cards in-visual (mirror prod /garage)
const GLASS_LIGHT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.42)",
  backdropFilter: "blur(24px) saturate(140%)",
  WebkitBackdropFilter: "blur(24px) saturate(140%)",
  border: "1px solid rgba(255,255,255,0.35)",
  boxShadow:
    "0 20px 50px -10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)",
};

const GarageWeekFrame = ({
  ridersBundle,
  currentRiderIndex,
  currentScooterIndex,
  onPrevRider,
  onNextRider,
  onGoToRider,
  onGoToScooter,
  isLoading,
  isAuthenticated,
}: Props) => {
  const reduceMotion = useReducedMotion();
  const touchStartXRef = useRef<number | null>(null);

  const currentRider = ridersBundle[currentRiderIndex];
  const currentScooter: RiderScooter | undefined =
    currentRider?.scooters[currentScooterIndex];

  const level = useMemo(
    () => (currentRider ? getXPLevel(currentRider.performance_points) : null),
    [currentRider]
  );
  const xpProgress = useMemo(
    () =>
      currentRider
        ? getProgressToNextLevel(currentRider.performance_points)
        : null,
    [currentRider]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) onNextRider();
      else onPrevRider();
    }
    touchStartXRef.current = null;
  };

  if (isLoading) {
    return (
      <div
        className="w-full rounded-[28px] lg:rounded-[32px] overflow-hidden shadow-2xl animate-pulse"
        style={{ minHeight: 600, background: "rgba(0,0,0,0.08)" }}
        aria-label="Chargement du garage de la semaine"
      />
    );
  }
  if (!ridersBundle.length || !currentRider) {
    return (
      <div
        className="w-full rounded-[28px] lg:rounded-[32px] overflow-hidden shadow-2xl flex items-center justify-center"
        style={{
          minHeight: 600,
          background: "linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)",
          color: "#FFFFFF",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <p className="text-sm opacity-70">
          Aucun rider en vitrine pour le moment.
        </p>
      </div>
    );
  }

  const totalRiders = ridersBundle.length;
  const totalScooters = currentRider.scooters.length;
  const themeLower = (currentRider.wallpaper_name || "").toLowerCase();
  const isAlreadyDark =
    themeLower.includes("loft") ||
    themeLower.includes("biblio") ||
    themeLower.includes("night") ||
    themeLower.includes("sombre");
  const overlayGradient = isAlreadyDark
    ? "linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.45) 100%)"
    : "linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.55) 100%)";

  // Photo détourée prioritaire (officielle), custom en fallback
  const scooterImage =
    currentScooter?.scooter_model.image_url || currentScooter?.custom_photo_url || null;
  const scooterMainName =
    currentScooter?.nickname || currentScooter?.scooter_model.name || "—";
  const scooterEyebrow = currentScooter?.nickname
    ? currentScooter.scooter_model.name
    : currentScooter?.scooter_model.brand || "";

  const createGarageHref = isAuthenticated ? "/garage" : "/login";

  return (
    <div
      className="
        relative w-full rounded-[28px] lg:rounded-[32px] overflow-hidden isolate
        grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]
      "
      style={{
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 60px -12px rgba(0,0,0,0.30), 0 8px 24px -8px rgba(0,0,0,0.20)",
        minHeight: 600,
      }}
    >
      {/* ============ LEFT VISUAL ============ */}
      <div
        className="relative overflow-hidden lg:min-h-[600px] min-h-[560px] group"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Wallpaper crossfade par rider */}
        <AnimatePresence initial={false}>
          {currentRider.wallpaper_url ? (
            <motion.img
              key={currentRider.id}
              src={currentRider.wallpaper_url}
              alt=""
              aria-hidden="true"
              loading="eager"
              fetchPriority="high"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          ) : (
            <motion.div
              key={`${currentRider.id}-fallback`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.6 }}
              className="absolute inset-0 z-0"
              style={{
                background:
                  "linear-gradient(135deg, #2C5A3F 0%, #4A7C59 50%, #1A1A1A 100%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Overlay legibility */}
        <div
          aria-hidden
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: overlayGradient }}
        />

        {/* Particules XP — desktop only */}
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
                  bottom: "16%",
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
                initial={{ y: 20, opacity: 0, rotate: -2 }}
                animate={{
                  y: [-10, -240],
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

        {/* Content layer */}
        <div className="relative z-[3] h-full flex flex-col p-4 sm:p-5 lg:p-6">
          {/* Pill RIDER X/N — top floating */}
          <div className="mb-3 lg:mb-4 flex justify-start">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: "linear-gradient(135deg, #FF7A1A 0%, #E55A00 100%)",
                boxShadow:
                  "0 6px 16px -4px rgba(255,102,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              <Star
                className="w-3 h-3 text-white"
                strokeWidth={2.6}
                fill="currentColor"
                aria-hidden
              />
              <span
                className="text-[10.5px] font-extrabold tracking-[0.12em] uppercase text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Rider {currentRiderIndex + 1}/{totalRiders}
              </span>
            </div>
          </div>

          {/* TOP ROW — grid 3 colonnes desktop, stack mobile avec orders */}
          <div
            className="
              grid grid-cols-1 gap-3
              lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:gap-5
              items-start
            "
          >
            {/* COL 1 — Photo perso card (order-5 mobile, order-1 desktop) */}
            <div className="order-5 lg:order-1">
              <ScooterPhotoMiniCard
                customPhotoUrl={currentScooter?.custom_photo_url ?? null}
                scooterName={currentScooter?.scooter_model.name ?? ""}
              />
            </div>

            {/* COL 2 — Stats + Hero stacked (contents pattern pour mobile order) */}
            <div className="contents lg:flex lg:flex-col lg:gap-4 lg:order-2 lg:min-w-0">
              <div className="order-2 lg:order-none">
                <StatsTrioInline
                  voltage={currentScooter?.scooter_model.voltage ?? null}
                  amperage={currentScooter?.scooter_model.amperage ?? null}
                  power={currentScooter?.scooter_model.power_watts ?? null}
                  riderId={currentRider.id}
                  scooterId={currentScooter?.id ?? ""}
                />
              </div>

              {/* Hero scooter centré */}
              <div className="order-3 lg:order-none lg:flex-1 lg:flex lg:items-center lg:justify-center lg:min-h-[260px] relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`scooter-${currentRider.id}-${currentScooter?.id ?? "none"}`}
                    initial={{ opacity: 0, x: reduceMotion ? 0 : 90 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: reduceMotion ? 0 : -90 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.5,
                      ease: easeOutExpo,
                    }}
                    className="relative w-full max-w-[440px] aspect-[4/3] flex items-end justify-center"
                  >
                    {/* Socle béton */}
                    <div
                      aria-hidden
                      className="
                        absolute bottom-2.5 left-1/2 -translate-x-1/2
                        w-[70%] h-[26px] rounded-sm
                        bg-gradient-to-b from-stone-400/70 to-stone-600/50
                        shadow-md border-t border-white/30
                        after:content-[''] after:absolute after:-bottom-2 after:left-[5%] after:right-[5%]
                        after:h-2 after:bg-black/40 after:blur-md after:rounded-full
                      "
                    />
                    {scooterImage ? (
                      <motion.img
                        src={scooterImage}
                        alt={scooterMainName}
                        loading="eager"
                        decoding="async"
                        className="relative z-10 max-h-[78%] w-auto object-contain -translate-y-2.5"
                        style={{
                          filter:
                            "drop-shadow(0 30px 30px rgba(0,0,0,0.5)) drop-shadow(0 10px 10px rgba(0,0,0,0.3))",
                        }}
                        animate={
                          reduceMotion
                            ? undefined
                            : { y: [-10, -14, -10] }
                        }
                        transition={
                          reduceMotion
                            ? undefined
                            : {
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }
                        }
                      />
                    ) : (
                      <div className="relative z-10 max-h-[78%] flex flex-col items-center justify-end -translate-y-2.5 opacity-70">
                        <Bike
                          aria-hidden
                          className="w-28 h-28 text-white/70 drop-shadow-[0_15px_20px_rgba(0,0,0,0.3)]"
                          strokeWidth={1.5}
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* COL 3 — Rider card + Tutos card stacked */}
            <div className="contents lg:flex lg:flex-col lg:gap-3 lg:order-3">
              <div className="order-1 lg:order-none">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`rider-card-${currentRider.id}`}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: reduceMotion ? 0 : 0.4 }}
                  >
                    <RiderCardLarge
                      avatarUrl={currentRider.avatar_url}
                      displayName={currentRider.display_name}
                      bio={currentRider.bio}
                      location={currentRider.rider_location}
                      level={level}
                      points={currentRider.performance_points}
                      xpProgress={xpProgress}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="order-4 lg:order-none">
                <TutosMiniCard
                  scooterModelId={currentScooter?.scooter_model.id ?? null}
                />
              </div>
            </div>
          </div>

          {/* Spacer pour pousser le bottom vers le bas en desktop */}
          <div className="hidden lg:block flex-1 min-h-2" />

          {/* Flèches navigation rider (latérales) */}
          {totalRiders > 1 && (
            <>
              <button
                type="button"
                onClick={onPrevRider}
                aria-label="Rider précédent"
                className="
                  absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20
                  w-10 h-10 rounded-full grid place-items-center
                  text-white border border-white/20
                  transition-all duration-200
                  lg:opacity-0 lg:group-hover:opacity-100
                  hover:scale-105 active:scale-95
                "
                style={{
                  background: "rgba(15,15,15,0.55)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "0 6px 16px -4px rgba(0,0,0,0.4)",
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={onNextRider}
                aria-label="Rider suivant"
                className="
                  absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20
                  w-10 h-10 rounded-full grid place-items-center
                  text-white border border-white/20
                  transition-all duration-200
                  lg:opacity-0 lg:group-hover:opacity-100
                  hover:scale-105 active:scale-95
                "
                style={{
                  background: "rgba(15,15,15,0.55)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "0 6px 16px -4px rgba(0,0,0,0.4)",
                }}
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* BOTTOM bar — brand eyebrow + nickname + counter + scooter dots */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`bottom-${currentRider.id}-${currentScooter?.id ?? "none"}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: reduceMotion ? 0 : 0.4, ease: easeOutExpo }}
              className="
                relative z-[3] rounded-2xl mt-3 lg:mt-4
                flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between
                px-4 py-3
              "
              style={{
                background: "rgba(15,15,15,0.55)",
                backdropFilter: "blur(18px) saturate(140%)",
                WebkitBackdropFilter: "blur(18px) saturate(140%)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 14px 32px -10px rgba(0,0,0,0.5)",
              }}
            >
              <div className="min-w-0">
                <p
                  className="text-[9.5px] font-bold uppercase tracking-[0.18em] mb-0.5"
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {scooterEyebrow}
                </p>
                <h4
                  className="text-[20px] sm:text-[22px] leading-none text-white truncate"
                  style={{
                    fontFamily: "'Anton', sans-serif",
                    letterSpacing: "-0.01em",
                    textTransform: "uppercase",
                  }}
                >
                  {scooterMainName}
                </h4>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                {totalScooters > 1 && (
                  <div
                    className="flex items-center gap-1.5"
                    role="tablist"
                    aria-label="Trottinettes du rider"
                  >
                    {currentRider.scooters.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        role="tab"
                        aria-selected={i === currentScooterIndex}
                        aria-label={`Trotti ${i + 1}`}
                        onClick={() => onGoToScooter(i)}
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: i === currentScooterIndex ? 18 : 6,
                          height: 6,
                          background:
                            i === currentScooterIndex
                              ? "#FF6600"
                              : "rgba(255,255,255,0.45)",
                          boxShadow:
                            i === currentScooterIndex
                              ? "0 0 10px rgba(255,102,0,0.6)"
                              : "none",
                        }}
                      />
                    ))}
                  </div>
                )}
                <span
                  className="text-[11px] font-bold tracking-wider tabular-nums"
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {currentScooterIndex + 1}/{totalScooters}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Rider dots */}
          {totalRiders > 1 && (
            <div
              className="relative z-[3] flex items-center justify-center gap-2 mt-3"
              role="tablist"
              aria-label="Riders en vitrine"
            >
              {ridersBundle.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={i === currentRiderIndex}
                  aria-label={`Rider ${r.display_name}`}
                  onClick={() => onGoToRider(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === currentRiderIndex ? 26 : 8,
                    height: 8,
                    background:
                      i === currentRiderIndex
                        ? "#FF6600"
                        : "rgba(255,255,255,0.40)",
                    boxShadow:
                      i === currentRiderIndex
                        ? "0 0 12px rgba(255,102,0,0.7)"
                        : "none",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============ RIGHT PANEL — softened ============ */}
      <aside
        className="relative overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 100%)",
        }}
      >
        {/* Ambient radials — opacity divisée par 2 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 80% 0%, rgba(255,102,0,0.06) 0%, transparent 65%), radial-gradient(ellipse 50% 35% at 0% 100%, rgba(74,124,89,0.05) 0%, transparent 60%)",
          }}
        />

        <div className="relative z-[1] flex flex-col gap-4 lg:gap-5 p-6 lg:p-7 flex-1">
          {/* Eyebrow */}
          <span
            className="inline-flex items-center gap-1.5 self-start text-[10px] font-extrabold tracking-[0.20em] uppercase"
            style={{
              color: "#FF8533",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <Sparkles className="w-3 h-3" strokeWidth={2.6} aria-hidden />
            L'expérience rider
          </span>

          {/* H3 */}
          <h3
            className="text-[26px] lg:text-[30px] leading-[1.04] text-white"
            style={{
              fontFamily: "'Anton', sans-serif",
              letterSpacing: "-0.015em",
              textTransform: "uppercase",
            }}
          >
            Ce n'est pas qu'un site.
            <br />
            Une <span style={{ color: "#FF8533" }}>communauté</span>.
          </h3>

          {/* Description — texte adouci */}
          <p
            className="text-[13px] leading-[1.55]"
            style={{
              color: "rgba(255,255,255,0.85)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Crée ton profil, personnalise ton garage avec tes propres wallpapers,
            et débloque des avantages exclusifs.
          </p>

          {/* Perks list */}
          <ul className="flex flex-col gap-2 mt-1">
            {PERKS.map((perk) => {
              const Icon = perk.Icon;
              const active = perk.status === "active";
              return (
                <li
                  key={perk.label}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0"
                    style={{
                      background: active
                        ? "linear-gradient(135deg, rgba(74,124,89,0.28) 0%, rgba(74,124,89,0.12) 100%)"
                        : "linear-gradient(135deg, rgba(255,133,51,0.26) 0%, rgba(255,133,51,0.10) 100%)",
                      border: active
                        ? "1px solid rgba(74,124,89,0.45)"
                        : "1px solid rgba(255,133,51,0.45)",
                    }}
                  >
                    <Icon
                      className="w-3.5 h-3.5"
                      style={{ color: active ? "#9CD2AC" : "#FFB47A" }}
                      strokeWidth={2.4}
                      aria-hidden
                    />
                  </span>
                  <span
                    className="flex-1 text-[11.5px] leading-snug"
                    style={{
                      color: "rgba(255,255,255,0.92)",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {perk.label}
                  </span>
                  <span
                    className="text-[8.5px] font-extrabold tracking-wider uppercase flex-shrink-0 px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: active
                        ? "rgba(74,124,89,0.20)"
                        : "rgba(255,133,51,0.20)",
                      color: active ? "#A8E0B5" : "#FFD58A",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {active ? "Actif" : "Bientôt"}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* CTAs */}
          <div className="flex flex-col gap-2.5 mt-auto pt-2">
            <Link
              to={createGarageHref}
              className="
                relative overflow-hidden
                inline-flex items-center justify-center gap-2
                rounded-xl px-4 py-3
                text-white font-extrabold text-[13px] tracking-wide uppercase
                transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]
              "
              style={{
                background: "linear-gradient(135deg, #FF7A1A 0%, #E55A00 100%)",
                boxShadow:
                  "0 10px 24px -6px rgba(255,102,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {!reduceMotion && (
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 -left-1/3 w-1/3 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                    transform: "skewX(-18deg)",
                  }}
                  animate={{ x: ["-30%", "320%"] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatDelay: 1.4,
                  }}
                />
              )}
              <Zap className="w-3.5 h-3.5" fill="currentColor" />
              <span className="relative z-[1]">Créer mon garage +50 XP</span>
              <ArrowRight className="w-3.5 h-3.5 relative z-[1]" />
            </Link>

            <button
              type="button"
              disabled
              aria-disabled="true"
              className="
                inline-flex items-center justify-center gap-1.5
                rounded-xl px-4 py-2.5
                text-[11.5px] font-bold uppercase tracking-wider
                pointer-events-none
              "
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "rgba(255,255,255,0.65)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <span className="truncate">
                Voir le garage complet de{" "}
                <span style={{ color: "#FFFFFF" }}>
                  {currentRider.display_name}
                </span>
              </span>
              <ArrowRight className="w-3 h-3 flex-shrink-0" />
            </button>
          </div>

          {/* Footer */}
          <p
            className="text-[10.5px] italic text-center mt-1"
            style={{
              color: "rgba(255,255,255,0.55)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Chaque semaine, un nouveau rider en vitrine
          </p>
        </div>
      </aside>
    </div>
  );
};

// ============ SUB-COMPONENTS ============

// === Mini-card "Ma trottinette en vrai" — top-left in visual ===
const ScooterPhotoMiniCard = ({
  customPhotoUrl,
  scooterName,
}: {
  customPhotoUrl: string | null;
  scooterName: string;
}) => {
  return (
    <div className="rounded-3xl p-3.5" style={GLASS_LIGHT_STYLE}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full"
          style={{ background: "#4A7C59" }}
          aria-hidden
        >
          <Camera className="w-3 h-3 text-white" strokeWidth={2.4} />
        </span>
        <span
          className="font-bold text-[10px] uppercase tracking-[0.14em]"
          style={{
            color: "#1A1A1A",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Ma trottinette en vrai
        </span>
      </div>

      {/* Image area */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: "4 / 5",
          borderRadius: "16px",
          boxShadow: "0 12px 30px -8px rgba(0,0,0,0.35)",
        }}
      >
        {customPhotoUrl ? (
          <>
            <img
              src={customPhotoUrl}
              alt={scooterName || "Trottinette"}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <span
              className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-[9px] font-bold uppercase tracking-wider shadow-md"
              style={{ background: "#FF6600", letterSpacing: "0.08em" }}
            >
              Ma photo
            </span>
          </>
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-3"
            style={{
              background: `
                repeating-linear-gradient(45deg, rgba(74,124,89,0.06) 0 8px, transparent 8px 16px),
                linear-gradient(135deg, rgba(74,124,89,0.20), rgba(255,102,0,0.18))
              `,
              border: "1.5px dashed rgba(74,124,89,0.45)",
              borderRadius: "16px",
            }}
          >
            <span
              className="flex items-center justify-center rounded-full shadow-lg"
              style={{ width: 48, height: 48, background: "#0A0A0A" }}
            >
              <Camera className="w-5 h-5 text-white" strokeWidth={2.2} />
            </span>
            <p
              className="text-[11px] italic"
              style={{
                color: "#1A1A1A",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Mets ta vraie photo ici
            </p>
            <p
              className="text-[9px]"
              style={{
                color: "rgba(0,0,0,0.55)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Personnalise ton garage
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// === StatsTrioInline — 3 cards séparées Volt/Amp/Watt en ligne ===
const StatBox = ({
  Icon,
  value,
  label,
  iconGradient,
}: {
  Icon: typeof Zap;
  value: number | null;
  label: string;
  iconGradient: string;
}) => (
  <div
    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 sm:py-4 flex-1 min-w-0"
    style={GLASS_LIGHT_STYLE}
  >
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-full"
      style={{ background: iconGradient }}
    >
      <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2.4} aria-hidden />
    </span>
    <p
      className="leading-none"
      style={{
        fontFamily: "'Anton', sans-serif",
        fontSize: "clamp(26px, 3.2vw, 36px)",
        color: "#1A1A1A",
        letterSpacing: "-0.02em",
      }}
    >
      {value ?? "—"}
    </p>
    <p
      className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.16em]"
      style={{
        color: "rgba(0,0,0,0.55)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {label}
    </p>
  </div>
);

const StatsTrioInline = ({
  voltage,
  amperage,
  power,
  riderId,
  scooterId,
}: {
  voltage: number | null;
  amperage: number | null;
  power: number | null;
  riderId: string;
  scooterId: string;
}) => {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`stats-${riderId}-${scooterId}`}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: reduceMotion ? 0 : 0.35 }}
        className="flex items-stretch gap-2 sm:gap-3 w-full"
      >
        <StatBox
          Icon={Zap}
          value={voltage}
          label="Volt"
          iconGradient="linear-gradient(135deg, #FFA64D 0%, #FF6600 100%)"
        />
        <StatBox
          Icon={Gauge}
          value={amperage}
          label="Amp"
          iconGradient="linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)"
        />
        <StatBox
          Icon={Activity}
          value={power}
          label="Watt"
          iconGradient="linear-gradient(135deg, #5FBE7B 0%, #4A7C59 100%)"
        />
      </motion.div>
    </AnimatePresence>
  );
};

// === Rider card large — top-right with XP progress bar ===
const RiderCardLarge = ({
  avatarUrl,
  displayName,
  bio,
  location,
  level,
  points,
  xpProgress,
}: {
  avatarUrl: string | null;
  displayName: string;
  bio: string | null;
  location: string | null;
  level: ReturnType<typeof getXPLevel> | null;
  points: number;
  xpProgress: ReturnType<typeof getProgressToNextLevel> | null;
}) => {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-4 w-full max-w-[280px] mx-auto lg:mx-0"
      style={{
        background: "rgba(15,15,15,0.55)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow:
          "0 14px 30px -10px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 rounded-full"
          style={{
            border: "3px solid #FFFFFF",
            boxShadow: "0 6px 18px -4px rgba(0,0,0,0.5)",
          }}
        >
          <RiderAvatar
            url={avatarUrl}
            name={displayName}
            size="md"
            className="!h-16 !w-16 !ring-0 !border-0"
          />
        </div>
        <div className="min-w-0 leading-tight flex-1">
          <p
            className="text-[22px] truncate text-white"
            style={{
              fontFamily: "'Anton', sans-serif",
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            {displayName}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 text-white/85 text-[12px] font-semibold flex-wrap">
            {level && (
              <span className="inline-flex items-center gap-1 uppercase tracking-wider">
                <Trophy className="w-3 h-3 text-amber-300" />
                LVL {level.level} · {level.name}
              </span>
            )}
            {location && (
              <>
                <span className="opacity-40">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{location}</span>
                </span>
              </>
            )}
          </div>
          {bio && (
            <p
              className="mt-2 text-[12px] italic leading-snug line-clamp-2"
              style={{
                color: "rgba(255,255,255,0.75)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              "{bio}"
            </p>
          )}
        </div>
      </div>

      {/* XP progress bar */}
      {xpProgress && xpProgress.nextLevel && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-[9.5px] font-extrabold uppercase tracking-[0.14em]"
              style={{
                color: "rgba(255,255,255,0.70)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Progression
            </span>
            <span
              className="text-[9.5px] font-semibold"
              style={{
                color: "rgba(255,255,255,0.65)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {xpProgress.pointsToNext.toLocaleString("fr-FR")} XP →{" "}
              {xpProgress.nextLevel.name}
            </span>
          </div>
          <div
            className="relative h-2 rounded-full overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{
                width: `${xpProgress.percentage}%`,
                background: "linear-gradient(90deg, #FF6600, #FFA64D)",
                boxShadow: "0 0 12px rgba(255,102,0,0.6)",
              }}
            />
          </div>
        </div>
      )}
      {xpProgress && !xpProgress.nextLevel && (
        <p
          className="text-center text-[10px] font-extrabold uppercase tracking-widest"
          style={{
            color: "#FFD58A",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          🏆 Niveau maximum atteint
        </p>
      )}
    </div>
  );
};

// === TutosMiniCard — glass-light, preview 2 thumbnails ===
const STATIC_TUTOS = [
  {
    title: "Régler ses freins",
    badge: "Débutant",
    badgeBg: "#4A7C59",
    gradient: "linear-gradient(135deg, #3F6B4A 0%, #243F2E 100%)",
  },
  {
    title: "Changer une chambre",
    badge: "Avancé",
    badgeBg: "#E55A00",
    gradient: "linear-gradient(135deg, #8B3A20 0%, #4F1F10 100%)",
  },
];

const difficultyMeta = (level: number) => {
  if (level <= 2) return { label: "Débutant", bg: "#4A7C59" };
  if (level === 3) return { label: "Moyen", bg: "#FF6600" };
  return { label: "Avancé", bg: "#DC2626" };
};

const TutosMiniCard = ({
  scooterModelId,
}: {
  scooterModelId: string | null;
}) => {
  const { tutorials, modelSpecificCount, isLoading } =
    useScooterTutorials(scooterModelId);

  const modelSpecific = useMemo(
    () =>
      tutorials
        .filter((t) => t.scooter_model_id === scooterModelId)
        .slice(0, 2),
    [tutorials, scooterModelId]
  );

  const useStatic = modelSpecific.length === 0;

  return (
    <div
      className="rounded-3xl p-3.5 w-full max-w-[280px] mx-auto lg:mx-0"
      style={GLASS_LIGHT_STYLE}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span
          className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.14em]"
          style={{
            fontFamily: "'Anton', sans-serif",
            color: "#1A1A1A",
          }}
        >
          <span
            aria-hidden
            className="inline-flex items-center justify-center w-5 h-5 rounded-md"
            style={{
              background: "linear-gradient(135deg, #FF7A1A 0%, #E55A00 100%)",
              boxShadow: "0 2px 6px -1px rgba(255,102,0,0.45)",
            }}
          >
            <Play
              className="w-2.5 h-2.5 text-white fill-white ml-0.5"
              strokeWidth={0}
            />
          </span>
          Tutos sur mesure
        </span>
        {!useStatic && modelSpecificCount > 0 && (
          <span
            className="text-[9px] font-bold tracking-wider uppercase"
            style={{
              color: "rgba(0,0,0,0.55)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {modelSpecificCount} VIDÉOS
          </span>
        )}
      </div>

      <p
        className="text-[10px] mb-2.5"
        style={{
          color: "rgba(0,0,0,0.55)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        Pour la trotti affichée
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-white/40 animate-pulse"
              style={{ aspectRatio: "16 / 10" }}
            />
          ))}
        </div>
      ) : useStatic ? (
        <div className="grid grid-cols-2 gap-2">
          {STATIC_TUTOS.map((t) => (
            <Link
              key={t.title}
              to="/tutos"
              className="group relative rounded-xl overflow-hidden transition-transform duration-200 hover:scale-[1.03]"
              style={{ aspectRatio: "16 / 10", background: t.gradient }}
            >
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center"
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    boxShadow: "0 4px 12px -2px rgba(0,0,0,0.5)",
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
                className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase text-white"
                style={{
                  backgroundColor: t.badgeBg,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {t.badge}
              </span>
              <span
                className="absolute bottom-1.5 left-1.5 right-1.5 text-[9.5px] font-semibold text-white leading-tight"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}
              >
                {t.title}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {modelSpecific.map((t) => {
            const diff = difficultyMeta(t.difficulty);
            const thumb = `https://img.youtube.com/vi/${t.youtube_video_id}/mqdefault.jpg`;
            return (
              <a
                key={t.id}
                href={`https://www.youtube.com/watch?v=${t.youtube_video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-xl overflow-hidden transition-transform duration-200 hover:scale-[1.03]"
                style={{
                  aspectRatio: "16 / 10",
                  background:
                    "linear-gradient(135deg, #3a3a3a 0%, #1a1a1a 100%)",
                }}
              >
                <img
                  src={thumb}
                  alt={t.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                <span
                  aria-hidden
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    boxShadow: "0 4px 12px -2px rgba(0,0,0,0.5)",
                  }}
                >
                  <Play
                    className="w-3 h-3 fill-current ml-0.5"
                    style={{ color: "#1A1A1A" }}
                    strokeWidth={0}
                  />
                </span>
                <span
                  className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase text-white"
                  style={{
                    backgroundColor: diff.bg,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {diff.label}
                </span>
                <span
                  className="absolute bottom-1.5 left-1.5 right-1.5 text-[9.5px] font-semibold text-white leading-tight line-clamp-2"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                  }}
                >
                  {t.title}
                </span>
              </a>
            );
          })}
        </div>
      )}

      <p
        className="text-[10px] italic text-center mt-2"
        style={{
          color: "rgba(0,0,0,0.55)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {useStatic ? "Pour TON modèle" : "Spécifique à ce modèle"}
      </p>
    </div>
  );
};

export default GarageWeekFrame;
