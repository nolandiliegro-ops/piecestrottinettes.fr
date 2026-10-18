/**
 * Accueil — bloc « Garage » : propositions du 18/10/2026 (?garage=1..5). Sans paramètre, l'ancien bloc reste servi.
 * Défauts constatés sur l'actuel : cartes verre arrondies et police Anton hors identité Atelier ; orange partout
 * (titre, badges, barre d'XP) alors qu'il est réservé à l'achat ; bandeau « + de 8 000 riders » non prouvé (9 comptes
 * en base le 18/10) ; carte vide « Mets ta vraie photo ici » montrée en vitrine ; ~2 500 px sur téléphone.
 * Correction commune aux 5 : Unbounded 900 italique + Plus Jakarta Sans, chanfrein, vert/carbone, aucune promesse
 * chiffrée invérifiable, pas de carte vide, animations conservées (rotation des riders et des trottinettes, barre d'XP).
 */
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { getProgressToNextLevel } from "@/lib/xpLevels";
import { optimizedImage } from "@/lib/imageTransform";
import type { RiderBundle, RiderScooter } from "../GarageOfTheWeekSection";

export type GarageVariant = 1 | 2 | 3 | 4 | 5;

/** ?garage=1..5 ; 0 = ancien bloc. */
export const readGarageVariant = (): 0 | GarageVariant => {
  try {
    const n = Number(new URLSearchParams(window.location.search).get("garage"));
    return n >= 1 && n <= 5 ? (n as GarageVariant) : 0;
  } catch {
    return 0;
  }
};

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const BEIGE = "#FAFAF8";
const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

interface Props {
  variant: GarageVariant;
  riders: RiderBundle[];
  riderIndex: number;
  scooterIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToRider: (i: number) => void;
  onGoToScooter: (i: number) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const PERKS = [
  ["+50 XP", "à l'inscription, puis à chaque action"],
  ["Wallpapers", "exclusifs, débloqués par niveau"],
  ["Tutos", "choisis pour TON modèle"],
  ["-20 %", "sur ta 1re commande au lancement (plafonné à 30 €)"],
] as const;

const photoOf = (s: RiderScooter | undefined) => (s ? s.custom_photo_url || s.scooter_model.image_url : null);

const Title = ({ tone = "light", align = "left" }: { tone?: "light" | "dark"; align?: "left" | "center" }) => (
  <div className={align === "center" ? "text-center" : ""}>
    <p className="text-sm font-bold uppercase tracking-[0.16em] mb-2" style={{ fontFamily: FONT, color: tone === "light" ? GREEN : "#8FBF9C" }}>Espace rider · gratuit</p>
    <h2 id="garage-of-the-week-title" className="text-[30px] sm:text-5xl uppercase leading-[0.95]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: tone === "light" ? CARBON : "#fff" }}>
      Ton garage. <span style={{ color: tone === "light" ? GREEN : "#8FBF9C" }}>Ta communauté.</span>
    </h2>
    <p className={`mt-3 text-base max-w-xl ${align === "center" ? "mx-auto" : ""}`} style={{ fontFamily: FONT, color: tone === "light" ? "#4B5563" : "rgba(255,255,255,0.78)" }}>
      Ajoute ta trott, suis son entretien, gagne de l'XP et débloque tes wallpapers. Chaque semaine, un garage en vitrine.
    </p>
  </div>
);

const Cta = ({ auth, tone = "light", full = false }: { auth: boolean; tone?: "light" | "dark"; full?: boolean }) => (
  <Link to={auth ? "/garage" : "/login"} className={`inline-flex items-center justify-center gap-2 min-h-[52px] px-6 text-sm font-extrabold uppercase tracking-wider ${full ? "w-full" : ""}`}
    style={{ fontFamily: FONT, clipPath: cut(12), background: tone === "light" ? CARBON : "#fff", color: tone === "light" ? "#fff" : CARBON, boxShadow: `inset 0 -3px 0 ${GREEN}` }}>
    {auth ? "Ouvrir mon garage" : "Créer mon garage · +50 XP"} <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
  </Link>
);

const Perks = ({ tone = "light" }: { tone?: "light" | "dark" }) => (
  <ul className="grid gap-2">
    {PERKS.map(([k, v]) => (
      <li key={k} className="flex items-baseline gap-3 px-4 py-3" style={{ clipPath: cut(8), background: tone === "light" ? "#fff" : "rgba(255,255,255,0.08)", boxShadow: tone === "light" ? `inset 0 0 0 1px ${LINE}` : "none" }}>
        <span className="shrink-0 text-base uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: tone === "light" ? GREEN : "#8FBF9C" }}>{k}</span>
        <span className="text-sm" style={{ fontFamily: FONT, color: tone === "light" ? "#374151" : "rgba(255,255,255,0.85)" }}>{v}</span>
      </li>
    ))}
  </ul>
);

const XpBar = ({ points, tone = "dark" }: { points: number; tone?: "light" | "dark" }) => {
  const reduce = useReducedMotion();
  const p = getProgressToNextLevel(points);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5" style={{ fontFamily: FONT, color: tone === "dark" ? "rgba(255,255,255,0.8)" : "#4B5563" }}>
        <span className="font-bold uppercase tracking-wider">LVL {p.currentLevel.level} · {p.currentLevel.name}</span>
        <span>{points} XP</span>
      </div>
      <div className="h-2 w-full" style={{ background: tone === "dark" ? "rgba(255,255,255,0.18)" : "#E5E7EB" }}>
        <motion.div className="h-full" style={{ background: GREEN }} initial={{ width: reduce ? `${p.percentage}%` : "0%" }} animate={{ width: `${p.percentage}%` }} transition={{ duration: reduce ? 0 : 1.2, ease }} />
      </div>
    </div>
  );
};

const Avatar = ({ r, size = 56 }: { r: RiderBundle; size?: number }) => (
  <span className="shrink-0 overflow-hidden bg-white flex items-center justify-center" style={{ width: size, height: size, clipPath: cut(8) }}>
    {r.avatar_url ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" /> : <span style={{ fontFamily: UNB, fontWeight: 900, color: CARBON }}>{r.display_name[0]}</span>}
  </span>
);

const RiderHead = ({ r, tone = "dark" }: { r: RiderBundle; tone?: "light" | "dark" }) => (
  <div className="flex items-center gap-3 min-w-0">
    <Avatar r={r} />
    <div className="min-w-0">
      <p className="text-xl uppercase leading-none truncate" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: tone === "dark" ? "#fff" : CARBON }}>{r.display_name}</p>
      <p className="mt-1 text-sm flex items-center gap-1 truncate" style={{ fontFamily: FONT, color: tone === "dark" ? "rgba(255,255,255,0.75)" : "#6B7280" }}>
        {r.rider_location && (<><MapPin className="w-3.5 h-3.5" />{r.rider_location} · </>)}{r.scooters.length} trott{r.scooters.length > 1 ? "s" : ""} au garage
      </p>
    </div>
  </div>
);

const Specs = ({ s }: { s: RiderScooter }) => (
  <div className="grid grid-cols-3 gap-1.5">
    {[["V", s.scooter_model.voltage], ["A", s.scooter_model.amperage], ["W", s.scooter_model.power_watts]].map(([u, v]) => (
      <span key={u as string} className="px-2 py-1.5 text-center" style={{ background: "rgba(26,26,26,0.72)", clipPath: cut(6) }}>
        <span className="block text-base leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: "#fff" }}>{v ?? "—"}</span>
        <span className="block text-sm text-white/70" style={{ fontFamily: FONT }}>{u === "V" ? "volts" : u === "A" ? "ampères" : "watts"}</span>
      </span>
    ))}
  </div>
);

/** Trottinette en cours : photo détourée qui change toute seule (fondu + léger zoom). */
const ScooterShot = ({ r, i, className = "h-[220px]" }: { r: RiderBundle; i: number; className?: string }) => {
  const reduce = useReducedMotion();
  const s = r.scooters[i] ?? r.scooters[0];
  const src = photoOf(s);
  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        {src && (
          <motion.img key={s.id} src={optimizedImage(src, 700)} alt={s.scooter_model.name} className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]"
            initial={{ opacity: 0, scale: reduce ? 1 : 0.94, x: reduce ? 0 : 24 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: reduce ? 1 : 1.03, x: reduce ? 0 : -24 }} transition={{ duration: reduce ? 0 : 0.55, ease }} />
        )}
      </AnimatePresence>
    </div>
  );
};

const ScooterName = ({ r, i, tone = "dark", onGo }: { r: RiderBundle; i: number; tone?: "light" | "dark"; onGo?: (n: number) => void }) => {
  const s = r.scooters[i] ?? r.scooters[0];
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-bold uppercase tracking-wider truncate" style={{ fontFamily: FONT, color: tone === "dark" ? "rgba(255,255,255,0.7)" : "#6B7280" }}>{s.scooter_model.brand} · {s.scooter_model.name}</p>
        <p className="text-lg uppercase leading-tight truncate" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: tone === "dark" ? "#fff" : CARBON }}>{s.nickname || s.scooter_model.name}</p>
      </div>
      {r.scooters.length > 1 && (
        <div className="flex shrink-0" role="group" aria-label="Trottinettes du garage">
          {r.scooters.slice(0, 6).map((sc, k) => (
            <button key={sc.id} type="button" onClick={() => onGo?.(k)} aria-label={`Trottinette ${k + 1}`} className="w-7 h-11 flex items-center justify-center">
              <span className="block h-1.5 transition-all" style={{ width: k === i ? 16 : 6, background: k === i ? GREEN : tone === "dark" ? "rgba(255,255,255,0.45)" : "#D1D5DB" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Arrows = ({ onPrev, onNext, n, i, tone = "light" }: { onPrev: () => void; onNext: () => void; n: number; i: number; tone?: "light" | "dark" }) =>
  n > 1 ? (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onPrev} aria-label="Rider précédent" className="w-11 h-11 flex items-center justify-center" style={{ clipPath: cut(8), background: tone === "light" ? CARBON : "#fff", color: tone === "light" ? "#fff" : CARBON }}><ChevronLeft className="w-5 h-5" /></button>
      <span className="text-sm font-bold" style={{ fontFamily: FONT, color: tone === "light" ? CARBON : "#fff" }}>{i + 1}/{n}</span>
      <button type="button" onClick={onNext} aria-label="Rider suivant" className="w-11 h-11 flex items-center justify-center" style={{ clipPath: cut(8), background: tone === "light" ? CARBON : "#fff", color: tone === "light" ? "#fff" : CARBON }}><ChevronRight className="w-5 h-5" /></button>
    </div>
  ) : null;

/** La vitrine : wallpaper du rider, son en-tête, sa trott qui tourne, ses specs, son XP. */
const Showcase = ({ p, tall = false }: { p: Props; tall?: boolean }) => {
  const reduce = useReducedMotion();
  const r = p.riders[p.riderIndex];
  if (!r) return null;
  return (
    <AnimatePresence mode="wait">
      <motion.div key={r.id} className={`relative overflow-hidden ${tall ? "min-h-[540px]" : "min-h-[460px]"}`} style={{ clipPath: cut(22), background: CARBON }}
        initial={{ opacity: 0, y: reduce ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -16 }} transition={{ duration: reduce ? 0 : 0.5, ease }}>
        {r.wallpaper_url && (
          <motion.img src={optimizedImage(r.wallpaper_url, 1400)} alt="" className="absolute inset-0 w-full h-full object-cover" initial={{ scale: reduce ? 1 : 1.08 }} animate={{ scale: 1 }} transition={{ duration: reduce ? 0 : 6, ease: "linear" }} />
        )}
        <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(26,26,26,0.55) 0%, rgba(26,26,26,0.15) 40%, rgba(26,26,26,0.85) 100%)" }} />
        <div className="relative flex flex-col h-full p-4 sm:p-6 gap-3" style={{ minHeight: tall ? 540 : 460 }}>
          <div className="flex items-start justify-between gap-3">
            <RiderHead r={r} />
            {r.wallpaper_name && <span className="hidden sm:inline-block text-sm px-2 py-1 text-white/85" style={{ fontFamily: FONT, background: "rgba(26,26,26,0.6)", clipPath: cut(6) }}>{r.wallpaper_name}</span>}
          </div>
          {r.bio && <p className="text-sm italic text-white/85 line-clamp-2" style={{ fontFamily: FONT }}>« {r.bio.trim()} »</p>}
          <ScooterShot r={r} i={p.scooterIndex} className={`flex-1 ${tall ? "min-h-[240px]" : "min-h-[190px]"}`} />
          <ScooterName r={r} i={p.scooterIndex} onGo={p.onGoToScooter} />
          <Specs s={r.scooters[p.scooterIndex] ?? r.scooters[0]} />
          <XpBar points={r.performance_points} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const GarageAtelier = (p: Props) => {
  const reduce = useReducedMotion();
  const { riders, riderIndex: ri, isLoading } = p;
  const r = riders[ri];
  const loading = isLoading && !r;
  const skeleton = <div className="min-h-[460px] animate-pulse" style={{ background: "#ECE7DD", clipPath: cut(22) }} />;

  // 1 — ATELIER : la lecture littérale, mêmes briques que l'actuel (vitrine, specs, XP, avantages, bouton), en identité Atelier et en 1,5 écran.
  if (p.variant === 1) {
    return (
      <section aria-labelledby="garage-of-the-week-title" className="py-12 lg:py-16" style={{ background: BEIGE }} data-garage-variant="1">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between gap-4"><Title /><span className="hidden md:block"><Arrows onPrev={p.onPrev} onNext={p.onNext} n={riders.length} i={ri} /></span></div>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {loading ? skeleton : <Showcase p={p} />}
            <div className="flex flex-col gap-3 min-w-0">
              <span className="md:hidden"><Arrows onPrev={p.onPrev} onNext={p.onNext} n={riders.length} i={ri} /></span>
              <Perks />
              <Cta auth={p.isAuthenticated} full />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2 — CARTE RIDER : la vitrine devient la carte Rider du lancement (celle de la fenêtre « Le shop ouvre bientôt »), qui tourne d'un rider à l'autre.
  if (p.variant === 2) {
    const prog = r ? getProgressToNextLevel(r.performance_points) : null;
    return (
      <section aria-labelledby="garage-of-the-week-title" className="py-12 lg:py-16" style={{ background: BEIGE }} data-garage-variant="2">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-5 min-w-0">
            <Title />
            <Perks />
            <Cta auth={p.isAuthenticated} />
          </div>
          <div className="flex flex-col items-center gap-4">
            {loading || !r ? skeleton : (
              <AnimatePresence mode="wait">
                <motion.div key={r.id} className="relative w-full max-w-[360px] aspect-[3/4] overflow-hidden" style={{ clipPath: cut(26), background: `linear-gradient(160deg, #2E5A3D 0%, ${CARBON} 70%)` }}
                  initial={{ opacity: 0, rotateY: reduce ? 0 : -25, scale: reduce ? 1 : 0.96 }} animate={{ opacity: 1, rotateY: 0, scale: 1 }} exit={{ opacity: 0, rotateY: reduce ? 0 : 25, scale: reduce ? 1 : 0.96 }} transition={{ duration: reduce ? 0 : 0.6, ease }}>
                  <div className="absolute inset-0 p-5 flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-lg uppercase text-white" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>Rider</span>
                      <span className="text-sm font-extrabold px-2 py-1" style={{ fontFamily: FONT, background: "#8FBF9C", color: CARBON, clipPath: cut(6) }}>LVL {prog!.currentLevel.level}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-3"><Avatar r={r} size={64} /><div className="min-w-0"><p className="text-xl uppercase leading-none text-white truncate" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>{r.display_name}</p><p className="mt-1 text-sm text-white/75" style={{ fontFamily: FONT }}>{prog!.currentLevel.name}{r.rider_location ? ` · ${r.rider_location}` : ""}</p></div></div>
                    <ScooterShot r={r} i={p.scooterIndex} className="flex-1 my-2" />
                    <ScooterName r={r} i={p.scooterIndex} onGo={p.onGoToScooter} />
                    <div className="mt-3"><XpBar points={r.performance_points} /></div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
            <Arrows onPrev={p.onPrev} onNext={p.onNext} n={riders.length} i={ri} />
          </div>
        </div>
      </section>
    );
  }

  // 3 — PLEIN CADRE : le wallpaper du rider en pleine largeur, comme une couverture de magazine ; texte et bouton par-dessus.
  if (p.variant === 3) {
    return (
      <section aria-labelledby="garage-of-the-week-title" className="relative overflow-hidden" style={{ background: CARBON }} data-garage-variant="3">
        <AnimatePresence mode="wait">
          {r?.wallpaper_url && (
            <motion.img key={r.id} src={optimizedImage(r.wallpaper_url, 1800)} alt="" className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: reduce ? 1 : 1.1 }} animate={{ opacity: 0.55, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 1.2, ease }} />
          )}
        </AnimatePresence>
        <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(26,26,26,0.92) 0%, rgba(26,26,26,0.55) 55%, rgba(26,26,26,0.25) 100%)" }} />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-14 lg:py-20 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-5 min-w-0">
            <Title tone="dark" />
            <Perks tone="dark" />
            <Cta auth={p.isAuthenticated} tone="dark" />
          </div>
          {r && (
            <div className="flex flex-col gap-3 min-w-0">
              <div className="flex items-center justify-between gap-3"><RiderHead r={r} /><Arrows onPrev={p.onPrev} onNext={p.onNext} n={riders.length} i={ri} tone="dark" /></div>
              <ScooterShot r={r} i={p.scooterIndex} className="h-[260px] lg:h-[340px]" />
              <ScooterName r={r} i={p.scooterIndex} onGo={p.onGoToScooter} />
              <XpBar points={r.performance_points} />
            </div>
          )}
        </div>
      </section>
    );
  }

  // 4 — FRISE DES GARAGES : tous les garages en vitrine côte à côte, au doigt ; la trott de chacun tourne toute seule.
  if (p.variant === 4) {
    return (
      <section aria-labelledby="garage-of-the-week-title" className="py-12 lg:py-16" style={{ background: BEIGE }} data-garage-variant="4">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <Title />
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0" style={{ scrollbarWidth: "none" }}>
            {loading ? skeleton : riders.map((rd, k) => (
              <button key={rd.id} type="button" onClick={() => p.onGoToRider(k)} className="shrink-0 w-[80vw] max-w-[340px] text-left relative overflow-hidden" style={{ clipPath: cut(18), background: CARBON, minHeight: 400, boxShadow: k === ri ? `inset 0 0 0 3px ${GREEN}` : "none" }} aria-pressed={k === ri}>
                {rd.wallpaper_url && <img src={optimizedImage(rd.wallpaper_url, 800)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />}
                <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(26,26,26,0.5), rgba(26,26,26,0.1) 45%, rgba(26,26,26,0.9))" }} />
                <span className="relative flex flex-col gap-3 p-4" style={{ minHeight: 400 }}>
                  <RiderHead r={rd} />
                  <ScooterShot r={rd} i={k === ri ? p.scooterIndex : 0} className="flex-1 min-h-[180px]" />
                  <ScooterName r={rd} i={k === ri ? p.scooterIndex : 0} />
                  <XpBar points={rd.performance_points} />
                </span>
              </button>
            ))}
            <div className="shrink-0 w-[80vw] max-w-[340px] flex flex-col justify-center gap-4 p-5" style={{ clipPath: cut(18), background: "#fff", boxShadow: `inset 0 0 0 1px ${LINE}`, minHeight: 400 }}>
              <p className="text-2xl uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Et toi ?</p>
              <p className="text-base text-gray-600" style={{ fontFamily: FONT }}>Ajoute ta trott, ton garage peut être le prochain en vitrine.</p>
              <Cta auth={p.isAuthenticated} full />
            </div>
          </div>
          <div className="mt-5 max-w-2xl"><Perks /></div>
        </div>
      </section>
    );
  }

  // 5 — CARBONE : un seul plan carbone à coin coupé ; vitrine en grand à gauche, avantages et bouton à droite.
  return (
    <section aria-labelledby="garage-of-the-week-title" className="py-10 lg:py-14" style={{ background: BEIGE }} data-garage-variant="5">
      <div style={{ background: CARBON, clipPath: "polygon(0 0, calc(100% - 48px) 0, 100% 48px, 100% 100%, 0 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="flex items-end justify-between gap-4"><Title tone="dark" /><span className="hidden md:block"><Arrows onPrev={p.onPrev} onNext={p.onNext} n={riders.length} i={ri} tone="dark" /></span></div>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {loading ? skeleton : <Showcase p={p} tall />}
            <div className="flex flex-col gap-3 min-w-0">
              <span className="md:hidden"><Arrows onPrev={p.onPrev} onNext={p.onNext} n={riders.length} i={ri} tone="dark" /></span>
              <Perks tone="dark" />
              <Cta auth={p.isAuthenticated} tone="dark" full />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GarageAtelier;
