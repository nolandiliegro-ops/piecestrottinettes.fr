/**
 * /garage — refonte du 18/10/2026 (retour Nolan sur téléphone : « boutons trop verts », « Marquer comme révisée trop
 * gros », « manque de finesse et de logique dans la navigation », « carte pas dans le bon ordre », « boutons en
 * transparence, ça fait trop générique, manque de clarté »).
 *
 * Ordre logique (téléphone) : moi (bande rider) → MA trott (grande, qui sort de sa plaque) → 3 actions →
 * pièces pour MA trott → entretien (compact) → ma carte & mon code → ma photo → tutos.
 * Ordinateur : à gauche la trott + ses pièces, à droite une colonne fixe rider / carte / entretien / photo / tutos.
 * Langage : aplats pleins (plus de verre), coins coupés, Unbounded italique, UN bouton plein carbone par bloc,
 * vert seulement en accent, orange seulement sur « Ajouter au panier », textes ≥ 14 px.
 */
import { useMemo, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { ArrowRight, Bike, ChevronLeft, ChevronRight, CreditCard, History, Loader2, Plus, Wallpaper, Wrench } from "lucide-react";
import RiderAvatar from "@/components/garage/RiderAvatar";
import ScooterPhotoCard from "@/components/garage/ScooterPhotoCard";
import CustomPhotoButton from "@/components/garage/CustomPhotoButton";
import DescriptionCard from "@/components/garage/DescriptionCard";
import RiderLaunchCode from "@/components/launch/RiderLaunchCode";
import PartCardSlim from "@/components/home/ShopByCompatibility/PartCardSlim";
import { StandSpace } from "@/components/garage/v3/StandTrott";
import { getXPLevel, getProgressToNextLevel } from "@/lib/xpLevels";
import { useUserTotalInvested } from "@/hooks/useUserStats";
import { useUpdateLastMaintenance } from "@/hooks/useUpdateLastMaintenance";
import { useGarageModifications } from "@/hooks/useGarageModifications";
import { useCompatiblePartsRich } from "@/hooks/useCompatiblePartsRich";

const TutosCard = lazy(() => import("@/components/garage/TutosCard"));

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const SOFT = "#8FBF9C";
const PAPER = "#FAFAF8";
const LINE = "#E2DCD0";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

/** Habillage des composants réutilisés (photo, description, tutos, code) : plus de verre, plus de vert vif. */
export const SKIN = `
  [data-gatelier] :is(div,section,aside)[class*="backdrop-blur"]:is([class*="rounded-3xl"],[class*="rounded-2xl"]){background:${PAPER}!important;border:none!important;border-radius:0!important;clip-path:${cut(14)};box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
  [data-gatelier] [data-reuse] > div[style*="blur"]{background:${PAPER}!important;border:none!important;border-radius:0!important;clip-path:${cut(14)};box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
  [data-gatelier] [data-reuse] :is(.bg-green-700,.bg-green-600){background:${CARBON}!important}
  [data-gatelier] [data-reuse] :is(.text-\\[10px\\],.text-\\[11px\\],.text-\\[12px\\],.text-xs){font-size:14px!important;line-height:1.35}
  [data-gatelier] [data-reuse] .font-display{font-family:${UNB}!important;font-style:italic;font-weight:900!important;letter-spacing:-0.01em!important}
  [data-gatelier] .pt-slim-card{background-color:${CARBON}!important}
`;

export interface GarageAtelierProfile {
  display_name?: string | null;
  avatar_url?: string | null;
  performance_points?: number | null;
}
export interface GarageAtelierScooter {
  id: string;
  nickname?: string | null;
  custom_photo_url?: string | null;
  last_maintenance_date?: string | null;
  personal_description?: string | null;
  scooter_model: {
    id: string;
    name: string;
    brand?: string | null;
    image_url?: string | null;
    voltage?: number | null;
    amperage?: number | null;
    power_watts?: number | null;
  };
}

interface Props {
  profile: GarageAtelierProfile | null;
  scooter: GarageAtelierScooter;
  scooterCount: number;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onEditProfile: () => void;
  onTheme: () => void;
  onAddModification: (garageId?: string) => void;
  onOpenHistory: () => void;
  onOpenRiderCard: () => void;
  /** Garage v3 (25/10) : le profil/XP et le code RIDER vivent dans Réglages. */
  hideRider?: boolean;
  hideLaunch?: boolean;
  /** Garage v3 ordinateur (25/10) : la trott est posée sur l'estrade du wallpaper ; ici, seulement son nom et les flèches. */
  standOnDesktop?: boolean;
}

/* Ordinateur, garage v3 : un espace libre au-dessus duquel la trott est posée sur l'estrade (StandTrott, fixe). */
const StandCaption = ({ scooter, scooterCount, currentIndex, onPrev, onNext }: Pick<Props, "scooter" | "scooterCount" | "currentIndex" | "onPrev" | "onNext">) => {
  const m = scooter.scooter_model;
  const specs = [m.voltage && `${m.voltage} V`, m.amperage && `${m.amperage} Ah`, m.power_watts && `${m.power_watts} W`].filter(Boolean) as string[];
  const arrow = "w-12 h-12 inline-flex items-center justify-center bg-white disabled:opacity-40";
  return (
    <div data-stand-anchor className="hidden lg:flex h-[calc(100vh-250px)] min-h-[420px] items-end justify-between gap-4 pb-2">
      <div className="min-w-0" style={{ textShadow: "0 2px 14px rgba(0,0,0,0.55)" }}>
        <p className="text-sm font-bold uppercase tracking-[0.14em]" style={{ fontFamily: FONT, color: "#8FBF9C" }}>Ma trott · {currentIndex + 1}/{scooterCount}</p>
        <p className="mt-1 text-[34px] uppercase leading-[0.95] text-white max-w-[14ch]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em" }}>{scooter.nickname ? `« ${scooter.nickname} »` : m.name}</p>
        {scooter.nickname && <p className="mt-1 text-base font-semibold text-white/90" style={{ fontFamily: FONT }}>{m.name}</p>}
        {specs.length > 0 && (
          <div className="mt-2 flex gap-1.5">{specs.map((x) => <span key={x} className="px-2 py-1 text-sm font-bold text-white" style={{ background: "rgba(26,26,26,0.85)", fontFamily: FONT }}>{x}</span>)}</div>
        )}
      </div>
      {scooterCount > 1 && (
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={onPrev} disabled={currentIndex <= 0} aria-label="Trott précédente" className={arrow} style={{ clipPath: cut(8), color: CARBON }}><ChevronLeft className="w-5 h-5" /></button>
          <button type="button" onClick={onNext} disabled={currentIndex >= scooterCount - 1} aria-label="Trott suivante" className={arrow} style={{ clipPath: cut(8), color: CARBON }}><ChevronRight className="w-5 h-5" /></button>
        </div>
      )}
    </div>
  );
};

export const H2 = ({ children, light }: { children: React.ReactNode; light?: boolean }) => (
  <h2 className="text-base uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: light ? "#FFFFFF" : CARBON }}>
    {children}
  </h2>
);

export const Panel = ({ children, className = "", pad = "p-4 lg:p-5" }: { children: React.ReactNode; className?: string; pad?: string }) => (
  <section className={`${pad} ${className}`} style={{ background: PAPER, clipPath: cut(14) }}>{children}</section>
);

/* ---------- Bande rider : qui je suis, en une ligne ---------- */
const RiderStrip = ({ profile, onEditProfile, onTheme }: Pick<Props, "profile" | "onEditProfile" | "onTheme">) => {
  const points = profile?.performance_points ?? 0;
  const level = getXPLevel(points);
  const prog = getProgressToNextLevel(points);
  const name = profile?.display_name || "Rider";
  return (
    <Panel pad="p-3 lg:p-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onEditProfile} aria-label="Modifier mon profil rider" className="shrink-0">
          <RiderAvatar url={profile?.avatar_url || null} name={name} size="md" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] uppercase leading-none truncate" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{name}</p>
          <p className="mt-1 text-sm font-semibold truncate" style={{ fontFamily: FONT, color: "#4B5563" }}>
            Niveau {level.level} · {level.name} · <span style={{ color: CARBON }}>{points.toLocaleString("fr-FR")} XP</span>
          </p>
          {prog.nextLevel && (
            <div className="mt-2 h-1.5 w-full" style={{ background: LINE }} aria-label={`${prog.pointsToNext} XP avant ${prog.nextLevel.name}`}>
              <div className="h-full" style={{ width: `${prog.percentage}%`, background: GREEN }} />
            </div>
          )}
        </div>
        <button type="button" onClick={onTheme} aria-label="Changer le fond du garage" title="Changer le fond" className="shrink-0 w-11 h-11 inline-flex items-center justify-center" style={{ background: "#FFFFFF", boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(7) }}>
          <Wallpaper className="w-5 h-5" style={{ color: CARBON }} />
        </button>
      </div>
    </Panel>
  );
};

/* ---------- Ma trott : grande, elle sort de sa plaque ---------- */
const StageActuel = ({ scooter, scooterCount, currentIndex, onPrev, onNext, label }: StageProps) => {
  const m = scooter.scooter_model;
  const specs = [m.voltage && `${m.voltage} V`, m.amperage && `${m.amperage} Ah`, m.power_watts && `${m.power_watts} W`].filter(Boolean) as string[];
  const multi = scooterCount > 1;
  return (
    <div className="relative pt-24 lg:pt-28">
      <div className="relative px-4 pb-4 pt-[190px] lg:px-6 lg:pb-6 lg:pt-[300px]" style={{ background: CARBON, clipPath: cut(22) }}>
        <span aria-hidden className="absolute inset-x-6 top-0 h-[190px] lg:h-[300px]" style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.16), rgba(255,255,255,0))" }} />
        <p className="relative text-sm font-extrabold uppercase tracking-[0.14em]" style={{ fontFamily: FONT, color: SOFT }}>
          {label ?? "Ma trott"}{multi ? ` · ${currentIndex + 1}/${scooterCount}` : ""}
        </p>
        <div className="relative mt-1 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[26px] lg:text-[38px] uppercase leading-[0.98]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: "#FFFFFF" }}>
              {m.brand && !m.name.toLowerCase().startsWith(m.brand.toLowerCase()) ? <span className="block text-base lg:text-lg" style={{ color: "rgba(255,255,255,0.65)" }}>{m.brand}</span> : null}
              {m.name}
            </h1>
            {scooter.nickname && <p className="mt-1 text-base" style={{ fontFamily: FONT, color: "rgba(255,255,255,0.75)" }}>« {scooter.nickname} »</p>}
          </div>
          {multi && (
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={onPrev} disabled={currentIndex <= 0} aria-label="Trottinette précédente" className="w-11 h-11 inline-flex items-center justify-center disabled:opacity-30" style={{ background: "#FFFFFF", color: CARBON, clipPath: cut(7) }}><ChevronLeft className="w-5 h-5" strokeWidth={2.6} /></button>
              <button type="button" onClick={onNext} disabled={currentIndex >= scooterCount - 1} aria-label="Trottinette suivante" className="w-11 h-11 inline-flex items-center justify-center disabled:opacity-30" style={{ background: "#FFFFFF", color: CARBON, clipPath: cut(7) }}><ChevronRight className="w-5 h-5" strokeWidth={2.6} /></button>
            </div>
          )}
        </div>
        {specs.length > 0 && (
          <div className="relative mt-3 flex flex-wrap gap-2">
            {specs.map((t) => (
              <span key={t} className="px-2.5 py-1 text-sm font-bold" style={{ fontFamily: FONT, background: "#2E2E2E", color: "#FFFFFF", clipPath: cut(6) }}>{t}</span>
            ))}
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[290px] lg:h-[420px] flex items-end justify-center">
        {m.image_url ? (
          <img src={m.image_url} alt={m.name} loading="eager" className="max-h-full max-w-[92%] object-contain" style={{ filter: "drop-shadow(0 24px 22px rgba(0,0,0,0.45))" }} />
        ) : (
          <Bike className="w-28 h-28 text-white/40" strokeWidth={1} />
        )}
      </div>
    </div>
  );
};

/* 25/10/2026 (Nolan : « la trottinette, faudrait qu'elle soit vraiment dans le garage, faut pas qu'elle soit noire
   comme ça ») : choix « Au sol, sur l'estrade » (StandTrott + StandSpace + StandHeading), validé sur son téléphone le 26/10.
   Le bloc carbone (StageActuel / ScooterStage) ne sert plus qu'en secours, quand l'estrade n'est pas demandée. */
type StageProps = Pick<Props, "scooter" | "scooterCount" | "currentIndex" | "onPrev" | "onNext"> & {
  label?: string;
};
const stageSpecs = (m: GarageAtelierScooter["scooter_model"]) => [m.voltage && `${m.voltage} V`, m.amperage && `${m.amperage} Ah`, m.power_watts && `${m.power_watts} W`].filter(Boolean) as string[];
const ArrowBtn = ({ dir, onClick, disabled, size = "w-11 h-11" }: { dir: "prev" | "next"; onClick: () => void; disabled: boolean; size?: string }) => (
  <button type="button" onClick={onClick} disabled={disabled} aria-label={dir === "prev" ? "Trottinette précédente" : "Trottinette suivante"}
    className={`${size} pointer-events-auto inline-flex items-center justify-center disabled:opacity-35`} style={{ background: "#FFFFFF", color: CARBON, clipPath: cut(7), boxShadow: "0 6px 18px rgba(0,0,0,0.18)" }}>
    {dir === "prev" ? <ChevronLeft className="w-5 h-5" strokeWidth={2.6} /> : <ChevronRight className="w-5 h-5" strokeWidth={2.6} />}
  </button>
);
const Kicker = ({ label, multi, i, n, light }: { label?: string; multi: boolean; i: number; n: number; light?: boolean }) => (
  <p className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ fontFamily: FONT, color: light ? SOFT : GREEN, textShadow: light ? "0 1px 10px rgba(0,0,0,0.6)" : undefined }}>
    {label ?? "Ma trott"}{multi ? ` · ${i + 1}/${n}` : ""}
  </p>
);
const Title = ({ m, nickname, light, size = "text-[26px] lg:text-[38px]" }: { m: GarageAtelierScooter["scooter_model"]; nickname?: string | null; light?: boolean; size?: string }) => (
  <div className="min-w-0" style={{ textShadow: light ? "0 2px 16px rgba(0,0,0,0.6)" : undefined }}>
    <h1 className={`${size} uppercase leading-[0.98]`} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: light ? "#FFFFFF" : CARBON }}>
      {m.brand && !m.name.toLowerCase().startsWith(m.brand.toLowerCase()) ? <span className="block text-base lg:text-lg" style={{ color: light ? "rgba(255,255,255,0.8)" : "#6B7280" }}>{m.brand}</span> : null}
      {m.name}
    </h1>
    {nickname && <p className="mt-1 text-base font-semibold" style={{ fontFamily: FONT, color: light ? "rgba(255,255,255,0.9)" : "#4B5563" }}>« {nickname} »</p>}
  </div>
);
const Chips = ({ specs, light }: { specs: string[]; light?: boolean }) =>
  specs.length ? (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {specs.map((t) => <span key={t} className="px-2.5 py-1 text-sm font-bold" style={{ fontFamily: FONT, background: light ? "rgba(26,26,26,0.85)" : "#EFEAE0", color: light ? "#FFFFFF" : CARBON, clipPath: cut(6) }}>{t}</span>)}
    </div>
  ) : null;

/* La trott sur l'estrade (25/10 soir, choix de Nolan « Au sol », sur l'estrade, qui flotte) : son nom et les flèches
   en haut de l'espace libre, écrits sur le wallpaper ; la trott elle-même est posée par StandTrott (fixe). */
export const StandHeading = ({ scooter, scooterCount, currentIndex, onPrev, onNext, label }: StageProps) => {
  const m = scooter.scooter_model;
  const multi = scooterCount > 1;
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Kicker label={label} multi={multi} i={currentIndex} n={scooterCount} light />
        <div className="mt-1"><Title m={m} nickname={scooter.nickname} light size="text-[24px] lg:text-[34px]" /></div>
        <Chips specs={stageSpecs(m)} light />
      </div>
      {multi && <div className="flex gap-2 shrink-0"><ArrowBtn dir="prev" onClick={onPrev} disabled={currentIndex <= 0} /><ArrowBtn dir="next" onClick={onNext} disabled={currentIndex >= scooterCount - 1} /></div>}
    </div>
  );
};

export const ScooterStage = StageActuel;

/* ---------- 3 actions, une seule pleine ---------- */
const Actions = ({ garageId, onAddModification, onOpenRiderCard }: { garageId: string; onAddModification: (garageId?: string) => void; onOpenRiderCard: () => void }) => {
  const { mutate, isPending } = useUpdateLastMaintenance();
  const [done, setDone] = useState(false);
  const revise = () =>
    mutate(garageId, {
      onSuccess: () => {
        toast.dismiss();
        toast.success(`Révision notée le ${format(new Date(), "dd/MM/yyyy", { locale: fr })}`, { id: "revise-success" });
        setDone(true);
        window.setTimeout(() => setDone(false), 3000);
      },
    });
  const ghost = { background: "#FFFFFF", color: CARBON, boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(8), fontFamily: FONT };
  return (
    <div className="grid grid-cols-3 gap-2">
      <button type="button" onClick={() => onAddModification(garageId)} className="min-h-[52px] px-2 inline-flex flex-col items-center justify-center gap-0.5 text-sm font-extrabold uppercase leading-tight text-white" style={{ background: CARBON, clipPath: cut(8), fontFamily: FONT }}>
        <Plus className="w-4 h-4" strokeWidth={2.8} /> Modif
      </button>
      <button type="button" onClick={revise} disabled={isPending} className="min-h-[52px] px-2 inline-flex flex-col items-center justify-center gap-0.5 text-sm font-extrabold uppercase leading-tight" style={ghost}>
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" strokeWidth={2.4} />} {done ? "Notée ✓" : "Révisée"}
      </button>
      <button type="button" onClick={onOpenRiderCard} className="min-h-[52px] px-2 inline-flex flex-col items-center justify-center gap-0.5 text-sm font-extrabold uppercase leading-tight" style={ghost}>
        <CreditCard className="w-4 h-4" strokeWidth={2.4} /> Ma carte
      </button>
    </div>
  );
};

/* ---------- Pièces pour MA trott ---------- */
export const PartsShelf = ({ scooter, title }: { scooter: GarageAtelierScooter; title?: string }) => {
  const m = scooter.scooter_model;
  const { data: parts = [], isLoading } = useCompatiblePartsRich(m.id) as { data?: any[]; isLoading: boolean };
  const [cat, setCat] = useState<string | null>(null);
  const cats = useMemo(() => {
    const map = new Map<string, number>();
    parts.forEach((p) => p.category?.name && map.set(p.category.name, (map.get(p.category.name) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [parts]);
  const shown = parts.filter((p) => !cat || p.category?.name === cat).slice(0, 12);
  return (
    <Panel>
      <div className="flex items-end justify-between gap-3">
        <H2>{title ?? `Les pièces pour ta ${m.name}`}</H2>
        {!isLoading && <span className="shrink-0 text-sm font-bold" style={{ fontFamily: FONT, color: "#6B7280" }}>{parts.length}</span>}
      </div>
      {cats.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap" style={{ scrollbarWidth: "none" }} role="group" aria-label="Filtrer par catégorie">
          {[["Toutes", parts.length] as [string, number], ...cats].map(([name, n]) => {
            const on = name === "Toutes" ? !cat : cat === name;
            return (
              <button key={name} type="button" aria-pressed={on} onClick={() => setCat(name === "Toutes" ? null : name)}
                className="shrink-0 min-h-[44px] px-3.5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide whitespace-nowrap"
                style={{ fontFamily: FONT, clipPath: cut(7), ...(on ? { background: CARBON, color: "#FFFFFF" } : { background: "#FFFFFF", color: CARBON, boxShadow: `inset 0 0 0 1px ${LINE}` }) }}>
                {name}<span style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, opacity: on ? 1 : 0.5 }}>{n}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-0 pt-8 flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3 xl:grid-cols-4 lg:overflow-visible" style={{ scrollbarWidth: "none" }}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="shrink-0 w-[46%] lg:w-auto aspect-[3/4] animate-pulse" style={{ background: LINE, clipPath: cut(10) }} />)
          : shown.length === 0
            ? <p className="py-6 text-base" style={{ fontFamily: FONT, color: "#4B5563" }}>Pas encore de pièce référencée pour ce modèle.</p>
            : shown.map((p, i) => (
                <div key={p.id} className="shrink-0 w-[46%] sm:w-[34%] lg:w-auto min-w-0"><PartCardSlim part={p} index={i} variant="carousel" /></div>
              ))}
      </div>
      <Link to={`/catalogue?scooter=${m.id}`} className="mt-4 inline-flex items-center gap-2 min-h-[44px] text-sm font-extrabold uppercase tracking-wider underline underline-offset-[6px] decoration-2" style={{ fontFamily: FONT, color: CARBON }}>
        Toutes les pièces compatibles <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
      </Link>
    </Panel>
  );
};

/* ---------- Entretien : compact, une ligne de chiffres + 3 dernières modifs ---------- */
const Upkeep = ({ scooter, points, onOpenHistory, onAddModification }: { scooter: GarageAtelierScooter; points: number; onOpenHistory: () => void; onAddModification: () => void }) => {
  const { totalInvested, isLoading } = useUserTotalInvested();
  const { data: mods = [], isLoading: modsLoading } = useGarageModifications(scooter.id);
  const last = scooter.last_maintenance_date ? formatDistanceToNow(new Date(scooter.last_maintenance_date), { locale: fr, addSuffix: true }) : "jamais";
  const cells: [string, string][] = [
    ["Révision", last],
    ["Investi", isLoading ? "—" : `${Math.round(totalInvested)} €`],
    ["XP", points.toLocaleString("fr-FR")],
  ];
  return (
    <Panel>
      <H2>Entretien</H2>
      <dl className="mt-3 grid grid-cols-3" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
        {cells.map(([k, v], i) => (
          <div key={k} className="px-3 py-2.5 min-w-0" style={{ borderLeft: i ? `1px solid ${LINE}` : "none" }}>
            <dt className="text-sm font-semibold" style={{ fontFamily: FONT, color: "#6B7280" }}>{k}</dt>
            <dd className="text-[15px] font-extrabold truncate" style={{ fontFamily: FONT, color: CARBON }}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4">
        {modsLoading ? null : mods.length === 0 ? (
          <button type="button" onClick={() => onAddModification()} className="w-full text-left text-base" style={{ fontFamily: FONT, color: "#4B5563" }}>
            Aucune modif notée. <span className="font-bold underline underline-offset-4" style={{ color: CARBON }}>Note ta première</span> : +XP à chaque modif.
          </button>
        ) : (
          <>
            <ul className="flex flex-col">
              {mods.slice(0, 3).map((mo: any, i: number) => (
                <li key={mo.id} className="flex items-center gap-3 py-2.5" style={{ borderTop: i ? `1px solid ${LINE}` : "none" }}>
                  <span className="w-1.5 h-8 shrink-0" style={{ background: GREEN }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold truncate" style={{ fontFamily: FONT, color: CARBON }}>{mo.part?.name ?? "Modification"}</span>
                    <span className="block text-sm" style={{ fontFamily: FONT, color: "#6B7280" }}>{formatDistanceToNow(new Date(mo.installed_at), { addSuffix: true, locale: fr })}</span>
                  </span>
                  {mo.xp_earned > 0 && <span className="text-sm font-extrabold shrink-0" style={{ fontFamily: FONT, color: GREEN }}>+{mo.xp_earned} XP</span>}
                </li>
              ))}
            </ul>
            <button type="button" onClick={onOpenHistory} className="mt-2 inline-flex items-center gap-2 min-h-[44px] text-sm font-extrabold uppercase tracking-wider" style={{ fontFamily: FONT, color: CARBON }}>
              <History className="w-4 h-4" /> Tout l'historique
            </button>
          </>
        )}
      </div>
    </Panel>
  );
};

const GarageAtelierView = (p: Props) => {
  const points = p.profile?.performance_points ?? 0;
  const s = p.scooter;
  return (
    <div data-gatelier className="pb-8">
      <style>{SKIN}</style>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:items-start">
        {/* Colonne principale */}
        <div className="flex flex-col gap-4 min-w-0">
          {!p.hideRider && <div className="lg:hidden"><RiderStrip profile={p.profile} onEditProfile={p.onEditProfile} onTheme={p.onTheme} /></div>}
          {p.standOnDesktop ? (
            <>
              <StandSpace className="lg:hidden"><StandHeading scooter={s} scooterCount={p.scooterCount} currentIndex={p.currentIndex} onPrev={p.onPrev} onNext={p.onNext} /></StandSpace>
              <StandCaption scooter={s} scooterCount={p.scooterCount} currentIndex={p.currentIndex} onPrev={p.onPrev} onNext={p.onNext} />
            </>
          ) : (
            <ScooterStage scooter={s} scooterCount={p.scooterCount} currentIndex={p.currentIndex} onPrev={p.onPrev} onNext={p.onNext} />
          )}
          <Actions garageId={s.id} onAddModification={p.onAddModification} onOpenRiderCard={p.onOpenRiderCard} />
          <PartsShelf scooter={s} />
        </div>
        {/* Colonne de côté (ordinateur) / suite (téléphone) */}
        <aside className="flex flex-col gap-4 min-w-0">
          {!p.hideRider && <div className="hidden lg:block"><RiderStrip profile={p.profile} onEditProfile={p.onEditProfile} onTheme={p.onTheme} /></div>}
          <Upkeep scooter={s} points={points} onOpenHistory={p.onOpenHistory} onAddModification={p.onAddModification} />
          {!p.hideLaunch && <div data-reuse><RiderLaunchCode /></div>}
          {/* Ordinateur + estrade : la photo officielle est déjà sur l'estrade → ce bloc ne montre que la VRAIE photo (25/10). */}
          {p.standOnDesktop && !s.custom_photo_url ? (
            <>
              <div data-reuse className="lg:hidden"><ScooterPhotoCard garageItem={s as any} /></div>
              <div className="hidden lg:flex items-center gap-3 p-4" style={{ background: PAPER, clipPath: cut(14) }}>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Ta trott en vrai</p>
                  <p className="mt-1 text-sm" style={{ fontFamily: FONT, color: "#4B5563" }}>Ajoute ta photo : elle passe sur ta carte Rider. +50 XP.</p>
                </div>
                <div data-reuse className="shrink-0"><CustomPhotoButton garageItemId={s.id} currentPhotoUrl={null} /></div>
              </div>
            </>
          ) : (
            <div data-reuse><ScooterPhotoCard garageItem={s as any} mode={p.standOnDesktop ? "custom" : undefined} /></div>
          )}
          <div data-reuse><DescriptionCard garageId={s.id} initialDescription={s.personal_description} /></div>
          <div data-reuse>
            <Suspense fallback={<div className="h-[220px] animate-pulse" style={{ background: PAPER, clipPath: cut(14) }} />}>
              <TutosCard scooterModelId={s.scooter_model.id} />
            </Suspense>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default GarageAtelierView;
