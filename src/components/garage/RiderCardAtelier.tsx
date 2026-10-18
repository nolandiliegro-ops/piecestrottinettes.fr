/**
 * Carte Rider — propositions du 18/10/2026 (?carte=1..5). Sans paramètre : la carte v7 inchangée.
 * Retour Nolan : « la carte rider n'est pas du tout dans la nouvelle direction artistique ».
 * Défaut constaté (capture téléphone) : cadre bleu acier arrondi + rivets, rayons dorés, pastilles en verre,
 * emoji ⚡🔧⭐, textes 10-12 px, police jeu vidéo — rien de l'Atelier (Unbounded, coins coupés, carbone/vert).
 * Commun aux 5 : mêmes données et mêmes gestes que la v7 (vue rider / vue machine, carrousel, recto rendu /
 * verso photo, respect, partage en image), Unbounded italique + Plus Jakarta, coins coupés, aplats pleins,
 * la trottinette qui SORT de sa vitrine, rareté gardée (c'est le jeu) mais en étiquette, textes ≥ 14 px.
 */
import { useRef, type RefObject } from "react";
import { Camera, ChevronLeft, Heart, Plus, Share2, Star } from "lucide-react";
import type { RiderCardProfile, RiderMachine, RiderMod } from "@/hooks/useRiderCardData";
import type { GarageStats, RarityPalette } from "@/lib/riderStats";
import { formatWatts } from "@/lib/riderStats";

export type CarteVariant = 1 | 2 | 3 | 4 | 5;
export const readCarteVariant = (): 0 | CarteVariant => {
  try {
    const n = Number(new URLSearchParams(window.location.search).get("carte"));
    return n >= 1 && n <= 5 ? (n as CarteVariant) : 0;
  } catch {
    return 0;
  }
};
export const CARTE_NAMES: Record<CarteVariant, string> = { 1: "Atelier", 2: "Plaque", 3: "Ticket", 4: "Vert atelier", 5: "Fiche technique" };

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const SOFT = "#8FBF9C";
const PAPER = "#FAFAF8";
const LINE = "#E2DCD0";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

interface Skin {
  card: string;
  ink: string;
  sub: string;
  line: string;
  vitrine: string;
  chip: string;
  chipInk: string;
  primary: string;
  primaryInk: string;
  accent: string;
}
const SKINS: Record<CarteVariant, Skin> = {
  1: { card: CARBON, ink: "#FFFFFF", sub: "rgba(255,255,255,0.68)", line: "#2E2E2E", vitrine: "#262626", chip: "#2E2E2E", chipInk: "#FFFFFF", primary: "#FFFFFF", primaryInk: CARBON, accent: SOFT },
  2: { card: PAPER, ink: CARBON, sub: "#4B5563", line: LINE, vitrine: "#FFFFFF", chip: "#FFFFFF", chipInk: CARBON, primary: CARBON, primaryInk: "#FFFFFF", accent: GREEN },
  3: { card: CARBON, ink: "#FFFFFF", sub: "rgba(255,255,255,0.68)", line: "#3A3A3A", vitrine: "#222222", chip: "#2E2E2E", chipInk: "#FFFFFF", primary: GREEN, primaryInk: "#FFFFFF", accent: SOFT },
  4: { card: GREEN, ink: "#FFFFFF", sub: "rgba(255,255,255,0.82)", line: "rgba(255,255,255,0.22)", vitrine: "#3E6A4C", chip: "rgba(255,255,255,0.16)", chipInk: "#FFFFFF", primary: CARBON, primaryInk: "#FFFFFF", accent: CARBON },
  5: { card: "#FFFFFF", ink: CARBON, sub: "#6B7280", line: LINE, vitrine: PAPER, chip: PAPER, chipInk: CARBON, primary: CARBON, primaryInk: "#FFFFFF", accent: GREEN },
};

export interface RiderCardAtelierProps {
  variant: CarteVariant;
  captureRef: RefObject<HTMLDivElement>;
  profile: RiderCardProfile;
  view: number;
  tiles: RiderMachine[];
  featuredIndex: number;
  current: RiderMachine | null;
  currentMods: RiderMod[];
  holoIds: Set<string>;
  stats: GarageStats;
  levelName: string;
  levelNumber: number;
  xpPercent: number;
  xpLabel: string;
  rarity: RarityPalette;
  holo: boolean;
  back: boolean;
  likes: number;
  liked: boolean;
  canLike: boolean;
  canEdit: boolean;
  sharing: boolean;
  uploading: boolean;
  onView: (v: number) => void;
  onFlip: () => void;
  onLike: () => void;
  onShare: () => void;
  onUpload: (f: File) => void;
  onAddMachine: () => void;
}

const MODS_SLOTS = 3;

const RiderCardAtelier = (p: RiderCardAtelierProps) => {
  const s = SKINS[p.variant];
  const v = p.variant;
  const fileRef = useRef<HTMLInputElement>(null);
  const isRider = p.view === 0;
  const m = p.current;
  const photo = m?.custom_photo_url ?? null;
  const title = isRider ? p.profile.display_name ?? "Rider" : m?.model?.name ?? "Machine";
  const power = isRider ? `${(p.profile.performance_points ?? 0).toLocaleString("fr-FR")} XP` : `${m?.model?.power_watts ?? 0} W`;
  const serial = `N° ${p.profile.id.slice(0, 4).toUpperCase()}`;
  const rows: [string, string, string][] = isRider
    ? [
        ["Puissance du garage", `${p.stats.machineCount} machine${p.stats.machineCount > 1 ? "s" : ""}`, formatWatts(p.stats.totalWatts)],
        ["Pièces montées", `dont ${p.stats.siteMods} du site`, String(p.stats.totalMods)],
        ["Cartes holo", "builds 100 % site", String(p.stats.holoCount)],
      ]
    : Array.from({ length: MODS_SLOTS }).map((_, i) => {
        const mod = p.currentMods[i];
        if (!mod) return ["Emplacement libre", "monte une pièce : +XP", "—"] as [string, string, string];
        return [mod.part?.name ?? "Pièce", new Date(mod.installed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), mod.order_item_id ? "Site" : "Perso"] as [string, string, string];
      });

  const tag = (txt: string, strong?: boolean) => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-sm font-extrabold uppercase tracking-wide" style={{ fontFamily: FONT, clipPath: cut(5), background: strong ? p.rarity.c1 : s.chip, color: strong ? CARBON : s.chipInk }}>
      {txt}
    </span>
  );

  /* ---------- vitrine : la machine sort du cadre ---------- */
  const vitrineH = v === 3 ? 176 : 168;
  const Vitrine = (
    <div className="relative mt-11" data-carte-vitrine>
      <div className="relative" style={{ height: vitrineH, background: v === 5 ? "transparent" : s.vitrine, clipPath: v === 5 ? undefined : cut(12), boxShadow: v === 5 ? `inset 0 0 0 1px ${s.line}` : undefined }}>
        {v === 5 && (
          <>
            {["left-1 top-1", "right-1 top-1", "left-1 bottom-1", "right-1 bottom-1"].map((pos) => (
              <span key={pos} className={`absolute ${pos} w-3 h-3`} style={{ borderColor: CARBON, borderStyle: "solid", borderWidth: `${pos.includes("top") ? 2 : 0}px ${pos.includes("right") ? 2 : 0}px ${pos.includes("bottom") ? 2 : 0}px ${pos.includes("left") ? 2 : 0}px` }} />
            ))}
          </>
        )}
        <span aria-hidden className="absolute inset-x-6 bottom-2 h-2" style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.45), rgba(0,0,0,0))" }} />
        {(v === 1 || v === 3) && <span aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 60% at 50% 70%, rgba(255,255,255,0.14), rgba(255,255,255,0))" }} />}
        {isRider && m?.model && (
          <span className="absolute left-2 top-2 z-[2] max-w-[70%] text-sm font-extrabold uppercase truncate" style={{ fontFamily: FONT, color: v === 2 || v === 5 ? CARBON : "#FFFFFF" }}>★ {m.model.name}</span>
        )}
        <span className="absolute left-2 bottom-2 z-[2]">{tag(p.holo ? "★ Holo" : p.rarity.label, true)}</span>
        {(m?.custom_photo_url || p.canEdit) && (
          <button type="button" data-rcv7-hide-on-export="true" onClick={p.onFlip} className="absolute right-2 bottom-2 z-[2] min-h-[36px] px-2.5 inline-flex items-center gap-1.5 text-sm font-extrabold uppercase" style={{ fontFamily: FONT, background: s.primary, color: s.primaryInk, clipPath: cut(6) }}>
            <Camera className="w-4 h-4" /> {p.back ? "Rendu" : "En vrai"}
          </button>
        )}
      </div>
      {/* image : déborde au-dessus de la vitrine */}
      <div className="pointer-events-none absolute inset-x-0 -top-11 flex items-end justify-center" style={{ height: vitrineH + 44 - 26 }}>
        {p.back ? (
          photo ? (
            <img src={photo} alt={m?.model?.name ?? "Photo"} className="h-[150px] w-[86%] object-cover" style={{ clipPath: cut(10), transform: "rotate(-2deg)", boxShadow: "0 10px 20px rgba(0,0,0,0.35)" }} />
          ) : (
            <span className="pointer-events-auto mb-8 text-center px-6">
              <span className="block text-base font-bold" style={{ fontFamily: FONT, color: s.ink }}>Pas encore de photo de ta vraie machine.</span>
              {p.canEdit && (
                <>
                  <button type="button" data-rcv7-hide-on-export="true" onClick={() => fileRef.current?.click()} disabled={p.uploading} className="mt-2 min-h-[44px] px-4 inline-flex items-center gap-2 text-sm font-extrabold uppercase" style={{ fontFamily: FONT, background: s.primary, color: s.primaryInk, clipPath: cut(7) }}>
                    <Camera className="w-4 h-4" /> {p.uploading ? "Envoi…" : "Ajouter · +50 XP"}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && p.onUpload(e.target.files[0])} />
                </>
              )}
            </span>
          )
        ) : m?.model?.image_url ? (
          <img src={m.model.image_url} alt={m.model.name} crossOrigin="anonymous" className="max-h-full max-w-[86%] object-contain" style={{ filter: "drop-shadow(0 16px 14px rgba(0,0,0,0.45))" }} />
        ) : null}
      </div>
    </div>
  );

  /* ---------- carrousel des machines ---------- */
  const Rail = (
    <div className="mt-3 flex items-center gap-1.5">
      <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <button type="button" onClick={() => p.onView(0)} aria-label="Vue rider" aria-pressed={isRider}
          className="shrink-0 w-11 h-11 inline-flex items-center justify-center text-sm font-black" style={{ fontFamily: UNB, fontStyle: "italic", clipPath: cut(6), background: isRider ? s.primary : s.chip, color: isRider ? s.primaryInk : s.chipInk }}>
          R
        </button>
        {p.tiles.map((t, i) => {
          const on = p.view === i + 1;
          return (
            <button key={t.id} type="button" onClick={() => p.onView(i + 1)} aria-label={t.model?.name ?? "Machine"} aria-pressed={on}
              className="relative shrink-0 w-11 h-11 overflow-hidden" style={{ clipPath: cut(6), background: "#F2EFE8", boxShadow: on ? `inset 0 0 0 3px ${v === 4 ? CARBON : GREEN}` : "none" }}>
              {t.model?.image_url && <img src={t.model.image_url} alt="" crossOrigin="anonymous" className="w-full h-full object-contain p-0.5" />}
              {i === p.featuredIndex && <Star className="absolute top-0.5 right-0.5 w-3 h-3" style={{ color: GREEN }} fill="currentColor" />}
            </button>
          );
        })}
        {p.canEdit && (
          <button type="button" data-rcv7-hide-on-export="true" onClick={p.onAddMachine} aria-label="Ajouter une machine" className="shrink-0 w-11 h-11 inline-flex items-center justify-center" style={{ clipPath: cut(6), boxShadow: `inset 0 0 0 1px ${s.line}`, color: s.ink }}>
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
      {p.tiles.length > 0 && !isRider && (
        <span className="shrink-0 text-sm font-bold tabular-nums" style={{ fontFamily: FONT, color: s.sub }}>{p.view}/{p.tiles.length}</span>
      )}
    </div>
  );

  /* ---------- lignes ---------- */
  const Rows = (
    <ul className={`mt-3 ${v === 2 ? "grid grid-cols-3 gap-2" : "flex flex-col"}`}>
      {rows.map(([a, b, c], i) =>
        v === 2 ? (
          <li key={i} className="px-2 py-2 min-w-0" style={{ background: s.chip, clipPath: cut(6), boxShadow: `inset 0 0 0 1px ${s.line}` }}>
            <span className="block text-[16px] leading-none whitespace-nowrap" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: s.ink }}>{c}</span>
            <span className="block mt-1 text-sm font-semibold leading-tight" style={{ fontFamily: FONT, color: s.sub }}>{isRider ? a.split(" ")[0] + (a.includes("holo") ? " holo" : a.includes("montées") ? " montées" : "") : a}</span>
          </li>
        ) : (
          <li key={i} className="flex items-center gap-3 py-2" style={{ borderTop: i || v === 5 ? `1px solid ${s.line}` : "none" }}>
            <span className="w-1 self-stretch shrink-0" style={{ background: c === "—" ? s.line : s.accent }} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold truncate" style={{ fontFamily: FONT, color: c === "—" ? s.sub : s.ink }}>{a}</span>
              <span className="block text-sm truncate" style={{ fontFamily: FONT, color: s.sub }}>{b}</span>
            </span>
            <span className="shrink-0 text-base tabular-nums" style={{ fontFamily: v === 5 ? FONT : UNB, fontWeight: 900, fontStyle: v === 5 ? "normal" : "italic", color: s.ink }}>{c}</span>
          </li>
        ),
      )}
    </ul>
  );

  /* ---------- respect + partager ---------- */
  const Social = (
    <div className="mt-3 grid grid-cols-2 gap-2" data-rcv7-hide-on-export="true">
      <button type="button" onClick={p.onLike} disabled={!p.canLike} className="min-h-[44px] inline-flex items-center justify-center gap-2 text-sm font-extrabold uppercase disabled:opacity-60"
        style={{ fontFamily: FONT, clipPath: cut(7), background: p.liked ? GREEN : s.chip, color: p.liked ? "#FFFFFF" : s.chipInk, boxShadow: p.liked || v === 1 || v === 3 || v === 4 ? "none" : `inset 0 0 0 1px ${s.line}` }}>
        <Heart className="w-4 h-4" fill={p.liked ? "currentColor" : "none"} /> Respect {p.likes}
      </button>
      <button type="button" onClick={p.onShare} disabled={p.sharing} className="min-h-[44px] inline-flex items-center justify-center gap-2 text-sm font-extrabold uppercase"
        style={{ fontFamily: FONT, clipPath: cut(7), background: s.primary, color: s.primaryInk }}>
        <Share2 className="w-4 h-4" /> {p.sharing ? "Image…" : "Partager"}
      </button>
    </div>
  );

  const Head = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {!isRider && (
          <button type="button" data-rcv7-hide-on-export="true" onClick={() => p.onView(0)} className="mb-1 inline-flex items-center gap-1 min-h-[28px] text-sm font-bold" style={{ fontFamily: FONT, color: s.sub }}>
            <ChevronLeft className="w-4 h-4" /> Rider
          </button>
        )}
        <p className="text-[22px] uppercase leading-[0.98] break-words" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: s.ink }}>{title}</p>
        <p className="mt-1 text-sm font-semibold" style={{ fontFamily: FONT, color: s.sub }}>
          {isRider ? `Niv. ${p.levelNumber} · ${p.levelName}${p.profile.rider_location ? " · " + p.profile.rider_location : ""}` : `${m?.model?.brand ?? ""}${m?.nickname ? " · « " + m.nickname + " »" : ""}`}
        </p>
      </div>
      <span className="shrink-0 text-[17px] leading-none pt-1" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: v === 4 ? "#FFFFFF" : s.accent }}>{power}</span>
    </div>
  );

  const XpBar = (
    <div className="mt-3">
      <div className="h-1.5 w-full" style={{ background: s.line }}><div className="h-full" style={{ width: `${p.xpPercent}%`, background: v === 4 ? "#FFFFFF" : s.accent }} /></div>
      <div className="mt-2 flex items-center justify-between text-sm font-bold" style={{ fontFamily: FONT, color: s.sub }}>
        <span>{serial} · carte rider</span>
        <span className="tabular-nums">{p.xpLabel}</span>
      </div>
    </div>
  );

  /* ---------- 3 · Ticket : talon détachable ---------- */
  if (v === 3) {
    return (
      <div ref={p.captureRef} data-carte-variant="3" className="w-[320px]" style={{ fontFamily: FONT }}>
        <div className="px-4 pt-4 pb-4" style={{ background: s.card, clipPath: cut(18) }}>
          {Head}
          {Vitrine}
          {Rail}
          {Social}
        </div>
        <div className="relative h-0">
          <span className="absolute inset-x-4 -top-px border-t-2 border-dashed" style={{ borderColor: "#4A4A4A" }} />
        </div>
        <div className="px-4 pt-3 pb-4" style={{ background: s.card, clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)" }}>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em]" style={{ color: SOFT }}>{isRider ? "Le garage" : "Montées dessus"}</p>
          {Rows}
          {XpBar}
        </div>
      </div>
    );
  }

  return (
    <div ref={p.captureRef} data-carte-variant={v} className="w-[320px] px-4 pt-4 pb-4"
      style={{ background: s.card, clipPath: cut(18), boxShadow: v === 2 ? `inset 0 0 0 2px ${CARBON}` : v === 5 ? `inset 0 0 0 1px ${LINE}` : "none", fontFamily: FONT,
        backgroundImage: v === 5 ? `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)` : undefined, backgroundSize: v === 5 ? "16px 16px" : undefined }}>
      {v === 5 && <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.18em]" style={{ color: GREEN }}>Fiche rider · piecestrottinettes.fr</p>}
      {Head}
      {Vitrine}
      {Rail}
      {Social}
      {Rows}
      {XpBar}
    </div>
  );
};

export default RiderCardAtelier;
