/**
 * Fiche trottinette — 5 compositions à comparer (16/10/2026, skill « cinq propositions rendues »).
 * Activées UNIQUEMENT par ?style=1..5 : sans paramètre, la page en ligne ne change pas.
 *
 * Défaut corrigé dans les 5 : les infos clés (specs) arrivaient après un hero plein écran,
 * la gamme était une barre de pastilles grises avec barre de défilement, les boutons étaient
 * des pilules plates. Ici : specs dans le premier écran, gamme sans barre de défilement,
 * boutons « racing ».
 *
 * 1 PADDOCK   · photo + fiche côte à côte, boutons en parallélogramme, gamme en vignettes photo
 * 2 COCKPIT   · bandeau carbone avec 3 compteurs, boutons en chevron, gamme numérotée
 * 3 GRILLE    · fiche technique type « spec sheet » à points de conduite, damier, gamme en liste déroulante
 * 4 STAND     · panneau fixe à droite (desktop) + barre d'action collée en bas (mobile), gamme en carrousel photo
 * 5 PIT-WALL  · onglets Fiche / Présentation / Gamme juste sous le titre : tout tient sans descendre
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Home, Wrench, ExternalLink, Check, Zap, Battery, Gauge, Route, CircleDot, Ruler, Bike, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useIsInGarage, useAddToGarage, useRemoveFromGarage } from "@/hooks/useGarage";
import { getAllImages } from "@/lib/entityImage";
import { optimizedImage } from "@/lib/imageTransform";
import { getBrandColors } from "@/contexts/ScooterContext";
import type { ScooterDetail } from "@/hooks/useScooterDetail";
import type { ShowroomCarouselScooter } from "@/hooks/useShowroomData";

export type PageStyle = 1 | 2 | 3 | 4 | 5;
export const STYLE_NAMES: Record<PageStyle, string> = { 1: "Paddock", 2: "Cockpit", 3: "Grille", 4: "Stand", 5: "Pit-wall" };

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const ORANGE = "#FF6600";

interface Props {
  style: PageStyle;
  scooter: ScooterDetail;
  allScooters: ShowroomCarouselScooter[];
  partsCount: number;
}

// ─── Données ────────────────────────────────────────────────────────────────
type Spec = { key: string; label: string; value: number | string; unit: string; icon: typeof Zap };
const useSpecs = (s: ScooterDetail): Spec[] =>
  useMemo(() => {
    const hasPrivate = s.max_speed_private_kmh != null && s.max_speed_kmh != null && s.max_speed_private_kmh > s.max_speed_kmh;
    const list: (Spec | null)[] = [
      s.power_watts != null ? { key: "power", label: "Puissance", value: s.power_watts, unit: "W", icon: Zap } : null,
      s.max_speed_kmh != null ? { key: "speed", label: hasPrivate ? "Vitesse route" : "Vitesse", value: s.max_speed_kmh, unit: "km/h", icon: Gauge } : null,
      hasPrivate ? { key: "speedp", label: "Vitesse privé", value: s.max_speed_private_kmh as number, unit: "km/h", icon: Gauge } : null,
      s.range_km != null ? { key: "range", label: "Autonomie", value: s.range_km, unit: "km", icon: Route } : null,
      s.voltage != null ? { key: "volt", label: "Tension", value: s.voltage, unit: "V", icon: Battery } : null,
      s.amperage != null ? { key: "amp", label: "Batterie", value: s.amperage, unit: "Ah", icon: Ruler } : null,
      s.tire_size ? { key: "tire", label: "Pneus", value: s.tire_size, unit: "", icon: CircleDot } : null,
    ];
    return list.filter((x): x is Spec => x !== null);
  }, [s]);

const pick = (specs: Spec[], key: string) => specs.find((x) => x.key === key);
const scrollToParts = () => document.getElementById("showroom-parts")?.scrollIntoView({ behavior: "smooth", block: "start" });

// ─── Galerie ────────────────────────────────────────────────────────────────
const Gallery = ({ scooter, accent, height, thumbs = "row", dark = false }: { scooter: ScooterDetail; accent: string; height: string; thumbs?: "row" | "col"; dark?: boolean }) => {
  const photos = getAllImages(scooter.images, scooter.image_url);
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [scooter.slug]);
  const cur = photos[i]?.url;
  return (
    <div className={thumbs === "col" ? "flex gap-3" : ""}>
      {thumbs === "col" && photos.length > 1 && (
        <div className="hidden lg:flex flex-col gap-2">
          {photos.map((p, k) => (
            <button key={p.url + k} type="button" onClick={() => setI(k)} aria-label={`Photo ${k + 1}`}
              className="w-16 h-16 rounded-lg overflow-hidden border-2 bg-white"
              style={{ borderColor: k === i ? accent : "rgba(26,26,26,0.1)" }}>
              <img src={optimizedImage(p.url, 160)} alt="" className="w-full h-full object-contain" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <div className="flex-1">
        <div className="relative flex items-center justify-center" style={{ height }}>
          {cur ? (
            <img src={optimizedImage(cur, 900)} alt={photos[i]?.alt || scooter.name} className="max-h-full max-w-full object-contain"
              style={{ filter: dark ? "drop-shadow(0 20px 40px rgba(0,0,0,0.6))" : "drop-shadow(0 22px 30px rgba(26,26,26,0.25))" }} />
          ) : (
            <Bike className="w-24 h-24" style={{ color: `${accent}66` }} strokeWidth={1} />
          )}
        </div>
        {photos.length > 1 && (
          <div className={`mt-3 flex justify-center gap-2 ${thumbs === "col" ? "lg:hidden" : ""}`}>
            {photos.map((p, k) => (
              <button key={p.url + k} type="button" onClick={() => setI(k)} aria-label={`Photo ${k + 1}`}
                className="w-12 h-12 rounded-md overflow-hidden border-2 bg-white"
                style={{ borderColor: k === i ? accent : "rgba(26,26,26,0.1)", opacity: k === i ? 1 : 0.65 }}>
                <img src={optimizedImage(p.url, 120)} alt="" className="w-full h-full object-contain" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const BrandLock = ({ scooter, accent, dark = false }: { scooter: ScooterDetail; accent: string; dark?: boolean }) => {
  const name = scooter.brand?.name ?? "";
  if (!name) return null;
  return (
    <Link to={scooter.brand?.slug ? `/marque/${scooter.brand.slug}` : "#"} className="inline-flex items-center gap-2">
      {scooter.brand?.logo_url ? (
        <span className="inline-flex items-center rounded-lg px-2 py-1.5 bg-white border border-[#ECE7DD]">
          <img src={scooter.brand.logo_url} alt={name} className="h-5 w-auto max-w-[100px] object-contain" />
        </span>
      ) : (
        <span className="w-7 h-7 rounded-md flex items-center justify-center text-white text-sm" style={{ backgroundColor: accent, fontFamily: UNB, fontWeight: 800 }}>{name[0]}</span>
      )}
      <span className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: dark ? "rgba(255,255,255,0.7)" : accent, fontFamily: FONT }}>{name}</span>
    </Link>
  );
};

const Title = ({ name, size = "text-4xl lg:text-6xl", color = CARBON, italic = false }: { name: string; size?: string; color?: string; italic?: boolean }) => (
  <h1 className={`${size} leading-[0.92] uppercase`} style={{ fontFamily: UNB, fontWeight: 900, letterSpacing: "-0.03em", color, fontStyle: italic ? "italic" : "normal" }}>
    {name}
  </h1>
);

// ─── Boutons racing (même logique que ShowroomActionButtons) ────────────────
type Look = "slant" | "chevron" | "stripe" | "stand" | "pit";
const RacingActions = ({ scooter, partsCount, look, accent, full = false }: { scooter: ScooterDetail; partsCount: number; look: Look; accent: string; full?: boolean }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { inGarage, isOwned, garageItem } = useIsInGarage(scooter.slug);
  const add = useAddToGarage();
  const remove = useRemoveFromGarage();
  const busy = add.isPending || remove.isPending;
  const isFav = inGarage && !isOwned;
  const login = () => navigate(`/login?returnTo=/scooter/${scooter.slug}`);
  const like = () => {
    if (!user) return login();
    if (isFav && garageItem) return remove.mutate(garageItem.id);
    if (!inGarage) add.mutate({ scooterSlug: scooter.slug, isOwned: false, scooterName: scooter.name });
  };
  const garage = () => {
    if (!user) return login();
    if (inGarage) return toast.info(`${scooter.name} est déjà dans ton garage`);
    add.mutate({ scooterSlug: scooter.slug, isOwned: true, scooterName: scooter.name });
  };

  // Formes
  const shape: Record<Look, { cls: string; style: React.CSSProperties; inner?: React.CSSProperties }> = {
    slant: { cls: "px-6 -skew-x-12", style: { borderRadius: 4 }, inner: { transform: "skewX(12deg)" } },
    chevron: { cls: "pl-6 pr-9", style: { clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)" } },
    stripe: { cls: "px-6", style: { borderRadius: 2 } },
    stand: { cls: "px-5 w-full", style: { borderRadius: 10 } },
    pit: { cls: "px-5", style: { borderRadius: 999 } },
  };
  const sh = shape[look];
  const base = `relative inline-flex items-center justify-center gap-2 min-h-[48px] text-sm uppercase tracking-[0.12em] transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 ${sh.cls}`;
  const font: React.CSSProperties = { fontFamily: look === "stand" ? FONT : UNB, fontWeight: look === "stand" ? 800 : 700, fontStyle: look === "slant" || look === "chevron" ? "italic" : "normal" };
  const stripe = look === "stripe"
    ? { backgroundImage: `repeating-linear-gradient(115deg, ${GREEN} 0 18px, #3A6449 18px 22px)` }
    : {};
  const dark = { backgroundColor: CARBON, color: "#fff" };
  const ghost = look === "pit" ? { backgroundColor: "#fff", color: CARBON, border: "1.5px solid rgba(26,26,26,0.15)" }
    : look === "chevron" ? { backgroundColor: "#fff", color: CARBON } : dark;

  return (
    <div className={full ? "flex flex-col gap-2.5" : "flex flex-wrap gap-2.5"}>
      <button type="button" onClick={scrollToParts} className={`${base} ${full ? "" : "flex-1 sm:flex-none"}`}
        style={{ ...sh.style, ...font, backgroundColor: GREEN, color: "#fff", boxShadow: look === "slant" ? `4px 4px 0 ${CARBON}` : undefined, ...stripe }}>
        <span className="inline-flex items-center gap-2" style={sh.inner}>
          <Wrench className="w-4 h-4" strokeWidth={2.5} /> Pièces compatibles
          {partsCount > 0 && <span className="ml-1 rounded px-1.5 py-0.5 text-sm not-italic" style={{ backgroundColor: "rgba(255,255,255,0.22)", fontFamily: FONT }}>{partsCount}</span>}
        </span>
      </button>
      <div className={`flex gap-2.5 ${full ? "" : ""}`}>
        <button type="button" onClick={like} disabled={busy || isOwned} aria-pressed={isFav} className={`${base} ${full ? "flex-1" : ""}`}
          style={{ ...sh.style, ...font, ...(isFav ? { backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5" } : ghost) }}>
          <span className="inline-flex items-center gap-2" style={sh.inner}>
            <Heart className="w-4 h-4" strokeWidth={2.5} fill={isFav ? "currentColor" : "none"} /> {isFav ? "Aimé" : "Aimer"}
          </span>
        </button>
        <button type="button" onClick={garage} disabled={busy} className={`${base} ${full ? "flex-1" : ""}`}
          style={{ ...sh.style, ...font, ...(inGarage ? { backgroundColor: "rgba(74,124,89,0.12)", color: GREEN, border: "1px solid rgba(74,124,89,0.3)" } : ghost) }}>
          <span className="inline-flex items-center gap-2" style={sh.inner}>
            {inGarage ? <Check className="w-4 h-4" strokeWidth={2.5} /> : <Home className="w-4 h-4" strokeWidth={2.5} />} {inGarage ? "Au garage" : "Garage"}
          </span>
        </button>
      </div>
      {scooter.affiliate_link && (
        <a href={scooter.affiliate_link} target="_blank" rel="noopener noreferrer sponsored" className={base}
          style={{ ...sh.style, ...font, backgroundColor: ORANGE, color: "#fff" }}>
          <span className="inline-flex items-center gap-2" style={sh.inner}><ExternalLink className="w-4 h-4" strokeWidth={2.5} /> Acheter</span>
        </a>
      )}
      {/* accent marque discret sous les boutons (variante slant) */}
      {look === "slant" && <span aria-hidden className="hidden" style={{ color: accent }} />}
    </div>
  );
};

// ─── Gammes ─────────────────────────────────────────────────────────────────
const GammeHeader = ({ brand, count, accent, dark = false }: { brand: string; count: number; accent: string; dark?: boolean }) => (
  <div className="flex items-end justify-between mb-4">
    <h2 className="text-xl lg:text-2xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, letterSpacing: "-0.02em", color: dark ? "#fff" : CARBON }}>
      Gamme {brand}
    </h2>
    <span className="text-sm font-bold uppercase tracking-wider" style={{ color: accent, fontFamily: FONT }}>{count} modèles</span>
  </div>
);

const GammeThumbs = ({ models, current, accent }: { models: ShowroomCarouselScooter[]; current: string; accent: string }) => (
  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
    {models.map((m) => {
      const on = m.slug === current;
      return (
        <Link key={m.slug} to={`/scooter/${m.slug}`} className="group rounded-xl bg-white border-2 p-2 flex flex-col items-center text-center transition-transform hover:-translate-y-0.5"
          style={{ borderColor: on ? accent : "rgba(26,26,26,0.06)" }}>
          <div className="h-16 lg:h-20 w-full flex items-center justify-center">
            {m.image_url ? <img src={optimizedImage(m.image_url, 200)} alt="" className="max-h-full max-w-full object-contain" loading="lazy" /> : <Bike className="w-8 h-8 text-gray-300" />}
          </div>
          <span className="mt-1.5 text-sm leading-tight font-bold" style={{ fontFamily: FONT, color: on ? accent : CARBON }}>
            {m.name.replace(new RegExp(`^${(m.brand_name ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "")}
          </span>
        </Link>
      );
    })}
  </div>
);

const shortName = (m: ShowroomCarouselScooter) => m.name.replace(new RegExp(`^${(m.brand_name ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "");

const GammeNumbered = ({ models, current, accent }: { models: ShowroomCarouselScooter[]; current: string; accent: string }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
    {models.map((m, k) => {
      const on = m.slug === current;
      return (
        <Link key={m.slug} to={`/scooter/${m.slug}`} className="flex items-center gap-3 px-3 py-3 min-h-[52px]" style={{ backgroundColor: on ? accent : "#222" }}>
          <span className="text-lg" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: on ? "#fff" : "rgba(255,255,255,0.25)" }}>{String(k + 1).padStart(2, "0")}</span>
          <span className="text-sm font-bold text-white leading-tight" style={{ fontFamily: FONT }}>{shortName(m)}</span>
        </Link>
      );
    })}
  </div>
);

const GammeSelect = ({ models, current, brand }: { models: ShowroomCarouselScooter[]; current: string; brand: string }) => {
  const navigate = useNavigate();
  return (
    <label className="relative block">
      <span className="sr-only">Changer de modèle {brand}</span>
      <select value={current} onChange={(e) => navigate(`/scooter/${e.target.value}`)}
        className="appearance-none w-full min-h-[52px] rounded-none border-2 bg-white pl-4 pr-10 text-base font-bold uppercase tracking-wide"
        style={{ borderColor: CARBON, fontFamily: FONT, color: CARBON }}>
        {models.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" />
    </label>
  );
};

const GammeSnap = ({ models, current, accent }: { models: ShowroomCarouselScooter[]; current: string; accent: string }) => (
  <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {models.map((m) => {
      const on = m.slug === current;
      return (
        <Link key={m.slug} to={`/scooter/${m.slug}`} className="snap-start flex-shrink-0 w-40 lg:w-48 rounded-2xl overflow-hidden bg-white border-2"
          style={{ borderColor: on ? accent : "transparent", boxShadow: "0 8px 20px -14px rgba(26,26,26,0.4)" }}>
          <div className="h-28 lg:h-32 flex items-center justify-center p-2" style={{ background: `linear-gradient(180deg, ${accent}14, #fff)` }}>
            {m.image_url ? <img src={optimizedImage(m.image_url, 300)} alt="" className="max-h-full max-w-full object-contain" loading="lazy" /> : <Bike className="w-10 h-10 text-gray-300" />}
          </div>
          <div className="px-3 py-2.5">
            <div className="text-sm font-black uppercase leading-tight" style={{ fontFamily: UNB, color: CARBON }}>{shortName(m)}</div>
            <div className="mt-1 text-sm text-gray-500" style={{ fontFamily: FONT }}>
              {[m.power_watts ? `${m.power_watts} W` : null, m.range_km ? `${m.range_km} km` : null].filter(Boolean).join(" · ")}
            </div>
          </div>
        </Link>
      );
    })}
  </div>
);

const Description = ({ text, clamp = true, dark = false }: { text: string | null; clamp?: boolean; dark?: boolean }) => {
  const [open, setOpen] = useState(!clamp);
  if (!text) return null;
  const paras = text.split("\n").filter(Boolean);
  const shown = open ? paras : paras.slice(0, 1);
  return (
    <div>
      {shown.map((p, k) => <p key={k} className="mb-3 leading-relaxed text-[15px]" style={{ color: dark ? "rgba(255,255,255,0.75)" : "#4B5563", fontFamily: FONT }}>{p}</p>)}
      {paras.length > 1 && (
        <button type="button" onClick={() => setOpen(!open)} className="min-h-[44px] text-sm font-bold uppercase tracking-wider underline underline-offset-4" style={{ color: dark ? "#fff" : CARBON, fontFamily: FONT }}>
          {open ? "Réduire" : "Lire la suite"}
        </button>
      )}
    </div>
  );
};

// Compteur demi-cercle (Cockpit) — valeur dans le SVG pour rester centrée sur l'arc
const Gauge270 = ({ value, unit, label, max, accent }: { value: number; unit: string; label: string; max: number; accent: string }) => {
  const r = 40, c = Math.PI * r;
  const pct = Math.max(0.06, Math.min(1, value / max));
  return (
    <div className="flex flex-col items-center min-w-0">
      <svg viewBox="0 0 100 60" className="w-full max-w-[170px]" role="img" aria-label={`${label} ${value} ${unit}`}>
        <path d="M10 52 A40 40 0 0 1 90 52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="7" strokeLinecap="round" />
        <path d="M10 52 A40 40 0 0 1 90 52" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
        <text x="50" y="44" textAnchor="middle" fill="#fff" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", fontSize: 19 }}>{value}</text>
        <text x="50" y="57" textAnchor="middle" fill="rgba(255,255,255,0.6)" style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700 }}>{unit}</text>
      </svg>
      <span className="mt-1 text-sm uppercase tracking-wider text-white/60 text-center leading-tight" style={{ fontFamily: FONT }}>{label}</span>
    </div>
  );
};

// ─── Composition ────────────────────────────────────────────────────────────
const ScooterPageVariants = ({ style, scooter, allScooters, partsCount }: Props) => {
  const accent = getBrandColors(scooter.brand?.name).accent;
  const brand = scooter.brand?.name ?? "";
  const specs = useSpecs(scooter);
  const gamme = allScooters.filter((s) => brand && s.brand_name === brand);
  const tag = (
    <div className="fixed bottom-3 left-3 z-[60] rounded-md px-2 py-1 text-sm font-bold uppercase tracking-wider text-white pointer-events-none" style={{ backgroundColor: "rgba(26,26,26,0.75)", fontFamily: FONT }}>
      Proposition {style} · {STYLE_NAMES[style]}
    </div>
  );

  // 1 ─ PADDOCK
  if (style === 1) {
    return (
      <>
        {tag}
        <section className="px-4 pt-24 lg:pt-28 pb-10" style={{ background: `linear-gradient(180deg, #FAFAF8 0%, ${accent}14 100%)` }}>
          <div className="mx-auto max-w-6xl grid lg:grid-cols-[1.15fr_1fr] gap-6 lg:gap-12 items-center">
            <Gallery scooter={scooter} accent={accent} height="clamp(240px, 38vw, 440px)" />
            <div>
              <BrandLock scooter={scooter} accent={accent} />
              <div className="mt-3"><Title name={scooter.name} /></div>
              <div className="mt-5 grid grid-cols-3 gap-px rounded-xl overflow-hidden border border-[#ECE7DD]" style={{ backgroundColor: "#ECE7DD" }}>
                {specs.slice(0, 6).map((sp) => (
                  <div key={sp.key} className="bg-white px-3 py-3">
                    <div className="text-sm uppercase tracking-wider text-gray-500" style={{ fontFamily: FONT }}>{sp.label}</div>
                    <div className="mt-0.5 flex items-baseline gap-1">
                      <span className={typeof sp.value === "number" ? "text-xl lg:text-2xl" : "text-sm"} style={{ fontFamily: UNB, fontWeight: 900, color: CARBON }}>{sp.value}</span>
                      <span className="text-sm text-gray-500">{sp.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6"><RacingActions scooter={scooter} partsCount={partsCount} look="slant" accent={accent} /></div>
            </div>
          </div>
        </section>
        {gamme.length > 1 && (
          <section className="px-4 py-8"><div className="mx-auto max-w-6xl"><GammeHeader brand={brand} count={gamme.length} accent={accent} /><GammeThumbs models={gamme} current={scooter.slug} accent={accent} /></div></section>
        )}
        {scooter.description && (
          <section className="px-4 pb-6"><div className="mx-auto max-w-6xl grid lg:grid-cols-[220px_1fr] gap-4 border-t-2 pt-6" style={{ borderColor: CARBON }}>
            <h2 className="text-xl uppercase" style={{ fontFamily: UNB, fontWeight: 900 }}>Présentation</h2>
            <Description text={scooter.description} />
          </div></section>
        )}
      </>
    );
  }

  // 2 ─ COCKPIT
  if (style === 2) {
    const power = pick(specs, "power"), speed = pick(specs, "speedp") ?? pick(specs, "speed"), range = pick(specs, "range");
    const small = specs.filter((s) => ["volt", "amp", "tire", "speed"].includes(s.key) && s !== speed);
    return (
      <>
        {tag}
        <section className="px-4 pt-24 lg:pt-28 pb-6" style={{ backgroundColor: "#FAFAF8" }}>
          <div className="mx-auto max-w-5xl text-center">
            <BrandLock scooter={scooter} accent={accent} />
            <div className="mt-2"><Title name={scooter.name} italic /></div>
            <div className="mt-4"><Gallery scooter={scooter} accent={accent} height="clamp(220px, 34vw, 400px)" /></div>
          </div>
        </section>
        <section className="px-4 py-8" style={{ backgroundColor: CARBON, backgroundImage: `linear-gradient(90deg, ${accent} 0 6px, transparent 6px)` }}>
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-3 gap-3">
              {power && <Gauge270 value={power.value as number} unit="W" label="Puissance" max={4000} accent={GREEN} />}
              {speed && <Gauge270 value={speed.value as number} unit="km/h" label={speed.label} max={80} accent={GREEN} />}
              {range && <Gauge270 value={range.value as number} unit="km" label="Autonomie" max={120} accent={GREEN} />}
            </div>
            {small.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
                {small.map((s) => <span key={s.key} className="text-sm text-white/70" style={{ fontFamily: FONT }}><span className="uppercase text-sm tracking-wider text-white/40 mr-1.5">{s.label}</span><b className="text-white">{s.value}{s.unit ? ` ${s.unit}` : ""}</b></span>)}
              </div>
            )}
            <div className="mt-7 flex justify-center"><RacingActions scooter={scooter} partsCount={partsCount} look="chevron" accent={accent} /></div>
            {gamme.length > 1 && <div className="mt-10"><GammeHeader brand={brand} count={gamme.length} accent={accent} dark /><GammeNumbered models={gamme} current={scooter.slug} accent={GREEN} /></div>}
          </div>
        </section>
        {scooter.description && <section className="px-4 py-8"><div className="mx-auto max-w-3xl"><h2 className="text-xl uppercase mb-3" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>Présentation</h2><Description text={scooter.description} /></div></section>}
      </>
    );
  }

  // 3 ─ GRILLE
  if (style === 3) {
    const damier = { backgroundImage: `conic-gradient(${CARBON} 25%, #fff 0 50%, ${CARBON} 0 75%, #fff 0)`, backgroundSize: "16px 16px" };
    return (
      <>
        {tag}
        <section className="px-4 pt-24 lg:pt-28 pb-8 bg-white">
          <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-8 items-start">
            <div className="lg:sticky lg:top-24">
              <Gallery scooter={scooter} accent={accent} height="clamp(230px, 36vw, 440px)" />
            </div>
            <div>
              <div className="h-4 w-full mb-5" style={damier} aria-hidden />
              <BrandLock scooter={scooter} accent={accent} />
              <div className="mt-2"><Title name={scooter.name} /></div>
              <dl className="mt-6 border-t-2" style={{ borderColor: CARBON }}>
                {specs.map((s) => (
                  <div key={s.key} className="flex items-baseline gap-2 py-2.5 border-b border-[#ECE7DD]">
                    <dt className="text-sm uppercase tracking-wider text-gray-500 whitespace-nowrap" style={{ fontFamily: FONT }}>{s.label}</dt>
                    <span className="flex-1 border-b-2 border-dotted border-gray-300 translate-y-[-3px]" aria-hidden />
                    <dd className="text-base font-black text-right" style={{ fontFamily: UNB, color: CARBON }}>{s.value}{s.unit ? <span className="text-sm text-gray-500 ml-1" style={{ fontFamily: FONT }}>{s.unit}</span> : null}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6"><RacingActions scooter={scooter} partsCount={partsCount} look="stripe" accent={accent} /></div>
              {gamme.length > 1 && <div className="mt-6"><div className="text-sm font-bold uppercase tracking-[0.2em] mb-2" style={{ fontFamily: FONT, color: accent }}>Changer de modèle · {gamme.length} {brand}</div><GammeSelect models={gamme} current={scooter.slug} brand={brand} /></div>}
              {scooter.description && <div className="mt-8"><h2 className="text-lg uppercase mb-2" style={{ fontFamily: UNB, fontWeight: 900 }}>Présentation</h2><Description text={scooter.description} /></div>}
            </div>
          </div>
        </section>
      </>
    );
  }

  // 4 ─ STAND
  if (style === 4) {
    return (
      <>
        {tag}
        <section className="px-4 pt-24 lg:pt-28 pb-8" style={{ backgroundColor: "#F5F0E8" }}>
          <div className="mx-auto max-w-6xl grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-x-10 items-start">
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              <div className="rounded-3xl bg-white p-4 lg:p-8" style={{ background: `radial-gradient(90% 70% at 50% 40%, ${accent}1c, #fff 70%)` }}>
                <Gallery scooter={scooter} accent={accent} height="clamp(240px, 40vw, 480px)" thumbs="col" />
              </div>
            </div>
            <aside className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24 rounded-3xl p-5 lg:p-6" style={{ backgroundColor: CARBON }}>
              <BrandLock scooter={scooter} accent={accent} dark />
              <div className="mt-2"><Title name={scooter.name} size="text-3xl lg:text-4xl" color="#fff" /></div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {specs.map((s) => (
                  <div key={s.key} className="rounded-xl px-3 py-2.5" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                    <div className="text-sm uppercase tracking-wider text-white/45" style={{ fontFamily: FONT }}>{s.label}</div>
                    <div className={`${typeof s.value === "number" ? "text-xl" : "text-sm"} text-white`} style={{ fontFamily: UNB, fontWeight: 800 }}>{s.value}<span className="text-sm text-white/50 ml-1" style={{ fontFamily: FONT }}>{s.unit}</span></div>
                  </div>
                ))}
              </div>
              <div className="mt-5"><RacingActions scooter={scooter} partsCount={partsCount} look="stand" accent={accent} full /></div>
            </aside>
            <div className="min-w-0 lg:col-start-1 lg:row-start-2">
              {gamme.length > 1 && <div className="mt-2"><GammeHeader brand={brand} count={gamme.length} accent={accent} /><GammeSnap models={gamme} current={scooter.slug} accent={accent} /></div>}
              {scooter.description && <div className="mt-8 rounded-2xl bg-white p-5 lg:p-7 border border-[#ECE7DD]"><h2 className="text-lg uppercase mb-2" style={{ fontFamily: UNB, fontWeight: 900 }}>Présentation</h2><Description text={scooter.description} /></div>}
            </div>
          </div>
        </section>
        {/* Barre d'action collée en bas (mobile) */}
        <div className="lg:hidden fixed bottom-16 inset-x-0 z-40 px-3 pb-2 pt-2" style={{ background: "linear-gradient(180deg, transparent, rgba(245,240,232,0.95) 35%)" }}>
          <button type="button" onClick={scrollToParts} className="w-full min-h-[52px] rounded-xl text-white text-sm font-extrabold uppercase tracking-wider inline-flex items-center justify-center gap-2" style={{ backgroundColor: GREEN, fontFamily: FONT }}>
            <Wrench className="w-4 h-4" /> {partsCount > 0 ? `${partsCount} pièces compatibles` : "Pièces compatibles"}
          </button>
        </div>
      </>
    );
  }

  // 5 ─ PIT-WALL
  return <PitWall scooter={scooter} specs={specs} gamme={gamme} accent={accent} brand={brand} partsCount={partsCount} tag={tag} />;
};

const PitWall = ({ scooter, specs, gamme, accent, brand, partsCount, tag }: { scooter: ScooterDetail; specs: Spec[]; gamme: ShowroomCarouselScooter[]; accent: string; brand: string; partsCount: number; tag: JSX.Element }) => {
  const tabs = [
    { k: "fiche", label: "Fiche" },
    ...(scooter.description ? [{ k: "pres", label: "Présentation" }] : []),
    ...(gamme.length > 1 ? [{ k: "gamme", label: `Gamme (${gamme.length})` }] : []),
  ];
  const [tab, setTab] = useState("fiche");
  return (
    <>
      {tag}
      <section className="px-4 pt-24 lg:pt-28 pb-10 relative overflow-hidden" style={{ backgroundColor: "#FAFAF8" }}>
        <div aria-hidden className="hidden lg:block absolute -right-24 top-24 w-[520px] h-[120px] -rotate-12 opacity-[0.05]" style={{ backgroundImage: `conic-gradient(${CARBON} 25%, transparent 0 50%, ${CARBON} 0 75%, transparent 0)`, backgroundSize: "40px 40px" }} />
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-6 lg:gap-12 items-center relative">
          <Gallery scooter={scooter} accent={accent} height="clamp(230px, 36vw, 440px)" />
          <div>
            <BrandLock scooter={scooter} accent={accent} />
            <div className="mt-2"><Title name={scooter.name} italic /></div>
            <div className="mt-5 inline-flex rounded-full p-1 bg-white border border-[#ECE7DD]" role="tablist">
              {tabs.map((t) => (
                <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} onClick={() => setTab(t.k)}
                  className="min-h-[44px] px-4 rounded-full text-sm font-bold uppercase tracking-wider transition-colors"
                  style={{ fontFamily: FONT, backgroundColor: tab === t.k ? CARBON : "transparent", color: tab === t.k ? "#fff" : CARBON }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="mt-5 min-h-[180px]">
              {tab === "fiche" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {specs.map((s) => (
                    <div key={s.key} className="rounded-xl bg-white border border-[#ECE7DD] px-3 py-2.5 relative overflow-hidden">
                      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: accent }} />
                      <div className="text-sm uppercase tracking-wider text-gray-500" style={{ fontFamily: FONT }}>{s.label}</div>
                      <div className={typeof s.value === "number" ? "text-xl" : "text-sm"} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{s.value}<span className="text-sm text-gray-500 ml-1 not-italic" style={{ fontFamily: FONT }}>{s.unit}</span></div>
                    </div>
                  ))}
                </div>
              )}
              {tab === "pres" && <Description text={scooter.description} clamp={false} />}
              {tab === "gamme" && <GammeThumbs models={gamme} current={scooter.slug} accent={accent} />}
            </div>
            <div className="mt-6"><RacingActions scooter={scooter} partsCount={partsCount} look="pit" accent={accent} /></div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ScooterPageVariants;
