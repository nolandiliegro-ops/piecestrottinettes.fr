/**
 * Haut de l'accueil — propositions du 18/10/2026 (?hero=1..5). Sans paramètre : l'ancien hero, inchangé.
 * Défaut constaté (capture téléphone de Nolan) : dernier bloc encore à l'ancienne DA — titres Anton, barre de
 * recherche et cartes arrondies, étoile orange (l'orange est réservé à l'achat), badges marque en 10 px, photo
 * floutée grise en fond qui salit le titre ; les trottinettes sont enfermées dans des cases beiges.
 * Commun aux 5 : Unbounded 900 italique + Plus Jakarta, coins coupés, recherche en UNE plaque (champ + bouton),
 * trottinettes détourées qui SORTENT du cadre de leur carte, textes ≥ 14 px, cibles ≥ 44 px, plus de fond flou.
 */
import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bike, ChevronLeft, ChevronRight, Search as SearchIcon } from "lucide-react";
import { getBrandColors } from "@/contexts/ScooterContext";
import type { ScooterHero } from "@/hooks/useHeroScooters";

export type HeroVariant = 1 | 2 | 3 | 4 | 5;

/** Choix de Nolan du 18/10 : « 1 Atelier » par défaut. ?hero=2..5 = autres propositions, ?hero=0 = ancien hero. */
export const readHeroVariant = (): 0 | HeroVariant => {
  try {
    const raw = new URLSearchParams(window.location.search).get("hero");
    if (raw === null) return 1;
    const n = Number(raw);
    return n >= 1 && n <= 5 ? (n as HeroVariant) : n === 0 ? 0 : 1;
  } catch {
    return 1;
  }
};

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const SOFT_GREEN = "#8FBF9C";
const LINE = "#E2DCD0";
const BEIGE = "#FAFAF8";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

type Tone = "light" | "dark" | "green";
interface Skin {
  tone: Tone;
  bg: string;
  ink: string;
  sub: string;
  accent: string; // couleur du mot « mauvaise »
  card: string;
  cardInk: string;
  cardSub: string;
  cardLine: string;
  button: string;
  stage: string;
}
const SKINS: Record<HeroVariant, Skin> = {
  1: { tone: "light", bg: BEIGE, ink: CARBON, sub: "#4B5563", accent: GREEN, card: "#FFFFFF", cardInk: CARBON, cardSub: "#6B7280", cardLine: `inset 0 0 0 1px ${LINE}`, button: CARBON, stage: CARBON },
  2: { tone: "dark", bg: CARBON, ink: "#FFFFFF", sub: "rgba(255,255,255,0.72)", accent: SOFT_GREEN, card: "#262626", cardInk: "#FFFFFF", cardSub: "rgba(255,255,255,0.68)", cardLine: "inset 0 0 0 1px rgba(255,255,255,0.08)", button: GREEN, stage: "#262626" },
  3: { tone: "light", bg: BEIGE, ink: CARBON, sub: "#4B5563", accent: GREEN, card: CARBON, cardInk: "#FFFFFF", cardSub: "rgba(255,255,255,0.7)", cardLine: "none", button: GREEN, stage: CARBON },
  4: { tone: "light", bg: BEIGE, ink: "#FFFFFF", sub: "rgba(255,255,255,0.75)", accent: SOFT_GREEN, card: "#FFFFFF", cardInk: CARBON, cardSub: "#6B7280", cardLine: `inset 0 0 0 1px ${LINE}`, button: GREEN, stage: GREEN },
  5: { tone: "green", bg: GREEN, ink: "#FFFFFF", sub: "rgba(255,255,255,0.82)", accent: CARBON, card: BEIGE, cardInk: CARBON, cardSub: "#6B7280", cardLine: "none", button: CARBON, stage: CARBON },
};
export const HERO_NAMES: Record<HeroVariant, string> = { 1: "Atelier", 2: "Carbone", 3: "Vitrine", 4: "Plaque", 5: "Vert atelier" };

interface Props {
  variant: HeroVariant;
  query: string;
  onQuery: (v: string) => void;
  inputRef: RefObject<HTMLInputElement>;
  onSubmit: () => void;
  onCatalogue: () => void;
  scooters: ScooterHero[];
  isLoading: boolean;
  isSearching: boolean;
  miniTitle: string;
  onSelect: (slug: string) => void;
}

const parts = (n: number | null) => `${n ?? 0} pièce${(n ?? 0) > 1 ? "s" : ""} compatible${(n ?? 0) > 1 ? "s" : ""}`;

/* ---------- Titre + recherche ---------- */
const Head = ({ s, big, query, onQuery, inputRef, onSubmit, onCatalogue, center }: { s: Skin; big?: boolean; center?: boolean } & Pick<Props, "query" | "onQuery" | "inputRef" | "onSubmit" | "onCatalogue">) => (
  <div className={center ? "text-center" : "text-left"}>
    <div className={`inline-flex items-center gap-2 mb-4 lg:mb-6`}>
      <span className="h-2.5 w-2.5" style={{ background: s.tone === "green" ? "#FFFFFF" : GREEN, clipPath: cut(3) }} />
      <span className="text-sm font-extrabold uppercase tracking-[0.18em]" style={{ fontFamily: FONT, color: s.tone === "light" && s.ink === CARBON ? GREEN : s.sub }}>
        Compatibilité garantie
      </span>
    </div>
    <h1
      className={`${big ? "text-[38px] sm:text-6xl lg:text-7xl" : "text-[34px] sm:text-5xl lg:text-[46px] xl:text-[50px]"} uppercase leading-[0.98] mb-4 lg:mb-6`}
      style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.035em", color: s.ink }}
    >
      Plus jamais la <span style={{ color: s.accent }}>mauvaise</span> pièce.
    </h1>
    <p className={`text-base lg:text-lg mb-6 lg:mb-8 ${center ? "mx-auto" : ""} max-w-xl`} style={{ fontFamily: FONT, color: s.sub, fontWeight: 500, lineHeight: 1.5 }}>
      Tape ton modèle : on ne te montre que les pièces qui vont dessus.
    </p>
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} role="search" className={`flex items-stretch max-w-xl ${center ? "mx-auto" : ""}`} style={{ clipPath: cut(14), filter: s.tone === "light" && s.ink === CARBON ? "drop-shadow(0 10px 22px rgba(0,0,0,0.10))" : undefined }}>
      <label className="relative flex-1 bg-white">
        <span className="sr-only">Rechercher un modèle de trottinette</span>
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none text-gray-500" strokeWidth={2.2} aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") inputRef.current?.blur(); }}
          onFocus={(e) => {
            // Téléphone : on remonte la barre en haut de l'écran pour que les résultats restent visibles au-dessus du clavier.
            if (window.innerWidth < 1024) {
              const el = e.currentTarget;
              window.setTimeout(() => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 84, behavior: "smooth" }), 250);
            }
          }}
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Dualtron, Kaabo, Xiaomi…"
          className="w-full h-[58px] lg:h-16 pl-12 pr-3 bg-white text-base lg:text-lg outline-none placeholder:text-gray-400"
          style={{ fontFamily: FONT, color: CARBON, boxShadow: s.tone === "light" && s.ink === CARBON ? `inset 0 0 0 1px ${LINE}` : "none" }}
        />
      </label>
      <button type="submit" className="shrink-0 h-[58px] lg:h-16 px-5 lg:px-7 inline-flex items-center gap-2 text-white text-sm font-extrabold uppercase tracking-wide" style={{ background: s.button, fontFamily: FONT }}>
        <span className="hidden sm:inline">Trouver</span>
        <ArrowRight className="w-5 h-5" strokeWidth={2.6} />
      </button>
    </form>
    <button type="button" onClick={onCatalogue} className="mt-2 min-h-[44px] text-sm font-bold underline underline-offset-4" style={{ fontFamily: FONT, color: s.sub }}>
      Pas ton modèle ? Cherche la pièce ↓
    </button>
  </div>
);

/* ---------- Carte : la trottinette sort du cadre ---------- */
const PopCard = ({ sc, s, size, onSelect }: { sc: ScooterHero; s: Skin; size: "sm" | "lg"; onSelect: (slug: string) => void }) => {
  const brand = getBrandColors(sc.brand_name);
  const lg = size === "lg";
  const dark = s.card === CARBON || s.card === "#262626";
  return (
    <button type="button" onClick={() => onSelect(sc.slug)} aria-label={`Voir ${sc.name}`}
      className={`group relative block shrink-0 text-left ${lg ? "w-[232px] lg:w-auto pt-20" : "w-[172px] lg:w-auto pt-16"}`}>
      <div className={`relative ${lg ? "pt-[168px] lg:pt-[176px]" : "pt-[114px] lg:pt-[118px]"} px-3.5 pb-3.5 transition-transform duration-200 group-hover:-translate-y-0.5`}
        style={{ background: s.card, clipPath: cut(lg ? 16 : 12), boxShadow: s.cardLine }}>
        <span className="block w-6 h-[3px] mb-2" style={{ background: brand.accent }} />
        <span className="block text-sm font-extrabold uppercase tracking-wide" style={{ fontFamily: FONT, color: s.cardSub }}>{sc.brand_name}</span>
        <span className={`block ${lg ? "text-lg" : "text-base"} uppercase leading-tight mt-0.5`} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: s.cardInk }}>{sc.name}</span>
        <span className="block mt-1.5 text-sm font-semibold" style={{ fontFamily: FONT, color: s.tone === "dark" || s.card === CARBON ? SOFT_GREEN : GREEN }}>{parts(sc.compatible_parts_count)}</span>
      </div>
      <div className={`pointer-events-none absolute inset-x-0 top-0 ${lg ? "h-[240px] lg:h-[250px]" : "h-[170px] lg:h-[176px]"} flex items-end justify-center px-1 transition-transform duration-300 group-hover:-translate-y-1.5`}>
        {dark && <span aria-hidden className="absolute inset-x-2 bottom-0 top-[35%]" style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.26), rgba(255,255,255,0) 100%)" }} />}
        {sc.image_url ? (
          <img src={sc.image_url} alt="" loading="eager" className="relative max-h-full max-w-full object-contain" style={{ filter: "drop-shadow(0 14px 14px rgba(0,0,0,0.28))" }} />
        ) : (
          <Bike className="w-16 h-16" style={{ color: s.cardSub }} strokeWidth={1.2} />
        )}
      </div>
    </button>
  );
};

/** Rangée « Top du moment » : frise qui défile seule (une carte toutes les 3,5 s), s'arrête dès qu'on la touche,
 *  la survole ou la fait glisser, reprend 8 s après ; rien ne bouge si « réduire les animations » est activé. */
const Shelf = ({ s, size, scooters, isLoading, title, onSelect, heading }: { s: Skin; size: "sm" | "lg"; scooters: ScooterHero[]; isLoading: boolean; title: string; onSelect: (slug: string) => void; heading: string }) => {
  const reduce = useReducedMotion();
  const rowRef = useRef<HTMLDivElement>(null);
  const pausedUntil = useRef(0);
  const pause = () => { pausedUntil.current = Date.now() + 8000; };
  useEffect(() => {
    if (reduce || isLoading || scooters.length < 4) return;
    const t = window.setInterval(() => {
      const row = rowRef.current;
      if (!row || Date.now() < pausedUntil.current || document.hidden) return;
      const card = row.children[0] as HTMLElement | undefined;
      const step = card ? card.getBoundingClientRect().width + 16 : 240;
      const max = row.scrollWidth - row.clientWidth;
      if (max <= 4) return;
      row.scrollTo({ left: row.scrollLeft + step > max - 4 ? 0 : row.scrollLeft + step, behavior: "smooth" });
    }, 3500);
    return () => window.clearInterval(t);
  }, [reduce, isLoading, scooters.length]);
  return (
    <div>
      <h2 className="text-lg lg:text-xl uppercase mb-1" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: heading }}>{title}</h2>
      <div ref={rowRef} onPointerDown={pause} onMouseEnter={pause} onWheel={pause} onTouchStart={pause} onFocus={pause}
        className="pt-mini-scroll flex gap-3 lg:gap-4 overflow-x-auto -mx-4 px-4 pb-2 lg:mx-0 lg:px-0" style={{ scrollbarWidth: "none" }} data-top-row>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`shrink-0 ${size === "lg" ? "w-[232px] h-[300px]" : "w-[172px] h-[236px]"} lg:w-[calc((100%-64px)/5)] mt-10 animate-pulse`} style={{ background: s.card, clipPath: cut(12), opacity: 0.6 }} />
            ))
          : scooters.map((sc) => <div key={sc.id} className="shrink-0 lg:w-[calc((100%-64px)/5)]"><PopCard sc={sc} s={s} size={size} onSelect={onSelect} /></div>)}
        {!isLoading && scooters.length === 0 && (
          <p className="py-6 text-base" style={{ fontFamily: FONT, color: heading }}>
            Pas de trott à ce nom. Essaie juste la marque (Xiaomi, Dualtron…) ou{" "}
            <a href="/trottinettes" className="font-bold underline underline-offset-4">parcours tous les modèles</a>.
          </p>
        )}
      </div>
    </div>
  );
};

/** 19/10 : retour Nolan « les trottinettes noires sur le fond noir, c'est un peu noir ». Propositions ?scene=1..5 :
 *  1 noir + lumière forte · 2 deux tons pierre · 3 deux tons blanc studio · 4 deux tons béton · 5 tout clair.
 *  Sans paramètre : scène actuelle inchangée. */
type Scene = 1 | 2 | 3 | 4 | 5;
const readScene = (): Scene | null => {
  // 19/10 : « 2 Deux tons pierre » choisi par Nolan = défaut ; ?scene=0 = ancienne scène noire
  try { const raw = new URLSearchParams(window.location.search).get("scene"); if (raw === null) return 2; const n = Number(raw); return n >= 1 && n <= 5 ? (n as Scene) : null; } catch { return 2; }
};
const SCENE_TOP: Record<Scene, string | null> = { 1: null, 2: "#ECE8E0", 3: "#FFFFFF", 4: "linear-gradient(180deg,#CFCAC0 0%,#B9B3A8 100%)", 5: null };

/* ---------- Ordinateur : grande scène, la trottinette déborde de sa plaque ---------- */
const Stage = ({ s, scooters, onSelect }: { s: Skin; scooters: ScooterHero[]; onSelect: (slug: string) => void }) => {
  const reduce = useReducedMotion();
  const [scene] = useState(readScene);
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [scooters]);
  if (!scooters.length) return null;
  const len = scooters.length;
  const cur = scooters[i % len];
  const brand = getBrandColors(cur.brand_name);
  const go = (d: 1 | -1) => setI((x) => (x + d + len) % len);
  const plate = scene === 5 ? "#ECE8E0" : s.stage;
  const top = scene ? SCENE_TOP[scene] : null;
  const onStage = plate === CARBON || plate === "#262626" || plate === GREEN;
  const spec = [cur.max_speed_kmh && `${cur.max_speed_kmh} km/h`, cur.range_km && `${cur.range_km} km`, cur.power_watts && `${cur.power_watts} W`].filter(Boolean) as string[];
  return (
    <div className="relative w-full pt-[80px] xl:pt-[90px]">
      <div className="relative px-8 pt-[330px] xl:pt-[380px] pb-7" style={{ background: plate, clipPath: cut(26) }} data-scene={scene ?? 0}>
        {top && <div aria-hidden className="absolute inset-x-0 top-0 h-[300px] xl:h-[350px]" style={{ background: top, boxShadow: scene === 3 ? "inset 0 0 0 1px #E2DCD0" : undefined }} />}
        <div className="relative flex items-end justify-between gap-4">
          <button type="button" onClick={() => onSelect(cur.slug)} className="text-left min-w-0">
            <span className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide" style={{ fontFamily: FONT, color: onStage ? "rgba(255,255,255,0.7)" : "#6B7280" }}>
              <span className="w-6 h-[3px]" style={{ background: brand.accent === s.stage ? "#FFFFFF" : brand.accent }} />{cur.brand_name} · top du moment
            </span>
            <span className={`block mt-1 uppercase leading-none truncate ${cur.name.length > 18 ? "text-2xl xl:text-3xl" : "text-3xl xl:text-4xl"}`} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: onStage ? "#FFFFFF" : CARBON }}>{cur.name}</span>
            <span className="mt-3 flex flex-wrap gap-2">
              {spec.map((t) => (
                <span key={t} className="px-2.5 py-1 text-sm font-bold" style={{ fontFamily: FONT, background: onStage ? "rgba(255,255,255,0.10)" : "rgba(26,26,26,0.08)", color: onStage ? "#FFFFFF" : CARBON, clipPath: cut(6) }}>{t}</span>
              ))}
              <span className="px-2.5 py-1 text-sm font-bold" style={{ fontFamily: FONT, background: onStage ? "#FFFFFF" : CARBON, color: onStage ? CARBON : "#FFFFFF", clipPath: cut(6) }}>{parts(cur.compatible_parts_count)}</span>
            </span>
          </button>
          {len > 1 && (
            <div className="flex gap-2 shrink-0">
              {([-1, 1] as const).map((d) => (
                <button key={d} type="button" onClick={() => go(d)} aria-label={d < 0 ? "Trottinette précédente" : "Trottinette suivante"}
                  className="w-12 h-12 inline-flex items-center justify-center" style={{ background: onStage ? "#FFFFFF" : CARBON, color: onStage ? CARBON : "#FFFFFF", clipPath: cut(8) }}>
                  {d < 0 ? <ChevronLeft className="w-5 h-5" strokeWidth={2.6} /> : <ChevronRight className="w-5 h-5" strokeWidth={2.6} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <button type="button" onClick={() => onSelect(cur.slug)} aria-label={`Voir ${cur.name}`} className="absolute inset-x-0 top-0 h-[400px] xl:h-[460px] flex items-end justify-center">
        {scene === 1 ? (
          <span aria-hidden className="absolute inset-x-0 bottom-[-40px] top-[22%]" style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.42), rgba(255,255,255,0.10) 55%, rgba(255,255,255,0) 100%)" }} />
        ) : scene ? (
          <span aria-hidden className="absolute left-[18%] right-[18%] bottom-[2px] h-6" style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.28), rgba(0,0,0,0) 100%)" }} />
        ) : s.stage !== GREEN && <span aria-hidden className="absolute inset-x-10 bottom-0 top-[40%]" style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.22), rgba(255,255,255,0) 100%)" }} />}
        <AnimatePresence mode="wait">
          <motion.div key={cur.id} className="h-full w-full flex items-end justify-center"
            initial={reduce ? false : { opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -40 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            {cur.image_url ? (
              <img src={cur.image_url} alt={cur.name} className="relative max-h-full max-w-[96%] object-contain" style={{ filter: scene && scene !== 1 ? "drop-shadow(0 18px 16px rgba(0,0,0,0.22))" : "drop-shadow(0 24px 22px rgba(0,0,0,0.35))" }} />
            ) : (
              <Bike className="w-32 h-32 text-white/40" strokeWidth={1} />
            )}
          </motion.div>
        </AnimatePresence>
      </button>
    </div>
  );
};

const HeroAtelier = (p: Props) => {
  const s = SKINS[p.variant];
  const head = { query: p.query, onQuery: p.onQuery, inputRef: p.inputRef, onSubmit: p.onSubmit, onCatalogue: p.onCatalogue };
  const shelfHeading = p.variant === 4 ? CARBON : s.ink;
  const title = p.isSearching ? p.miniTitle : "Top du moment";

  // 3 — Vitrine : titre centré, grandes cartes en vitrine (ordinateur : 5 grandes cartes, pas de carrousel).
  if (p.variant === 3) {
    return (
      <section data-hero-variant="3" className="relative px-4 pt-8 pb-12 lg:pt-14 lg:pb-16" style={{ background: s.bg }}>
        <div className="mx-auto max-w-6xl">
          <Head s={s} center big {...head} />
          <div className="mt-8 lg:mt-10">
            <Shelf s={s} size="lg" scooters={p.scooters} isLoading={p.isLoading} title={title} onSelect={p.onSelect} heading={shelfHeading} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section data-hero-variant={p.variant} className="relative px-4 pt-8 pb-12 lg:pt-6 lg:pb-16" style={{ background: s.bg }}>
      <style>{`.pt-mini-scroll::-webkit-scrollbar{display:none}`}</style>
      <div className="mx-auto max-w-6xl">
        <div className="lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 lg:items-end">
          {p.variant === 4 ? (
            <div className="px-5 py-7 lg:px-9 lg:py-10" style={{ background: CARBON, clipPath: cut(22) }}>
              <Head s={s} {...head} />
            </div>
          ) : (
            <Head s={s} {...head} />
          )}
          <div className="hidden lg:block">
            <Stage s={s} scooters={p.scooters} onSelect={p.onSelect} />
          </div>
        </div>
        <div className={p.isSearching ? "mt-3 lg:mt-12" : "mt-8 lg:mt-12"}>
          <Shelf s={s} size="sm" scooters={p.scooters} isLoading={p.isLoading} title={title} onSelect={p.onSelect} heading={shelfHeading} />
        </div>
      </div>
    </section>
  );
};

export default HeroAtelier;
