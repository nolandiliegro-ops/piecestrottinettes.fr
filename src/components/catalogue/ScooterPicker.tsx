/**
 * Sélecteur « Ta trottinette » des pages Pièces (/catalogue) et famille (/categorie/:slug) — 24/10/2026.
 * Défaut constaté : sur /catalogue, le bouton « Ma trott » n'existait QUE si la trottinette avait déjà été
 * choisie ailleurs → un visiteur qui arrive direct n'avait aucun moyen de filtrer ses pièces.
 * Choix de Nolan : la trott choisie FILTRE d'office (pièces ✅ vérifiées), avec « Voir tout » à côté,
 * et elle est gardée partout (ScooterContext / localStorage `pt-selected-scooter`).
 *
 * 5 propositions, ?selecteur=1..5 (sans paramètre : page inchangée) :
 * 1 REPASSÉ      · la plaque « Ma trottinette » toujours visible en tête des filtres, ouvre la fenêtre de choix
 * 2 DEUX LISTES  · « Ta trottinette : [Marque] [Modèle] » sous le titre, listes natives (le plus littéral)
 * 3 PLAQUE       · bloc vert (retenu, défaut) « Quelle est ta trottinette ? » + champ de recherche + raccourcis
 * 4 FRISE        · frise de trottinettes détourées (garage puis plus demandées) + « Autre modèle »
 * 5 BANDEAU      · fine barre collée sous l'en-tête, visible pendant tout le défilement
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Camera, Check, ChevronDown, ChevronRight, Search, X, MessageCircle, Plus } from "lucide-react";
import { useSkotPhoto } from "@/hooks/useSkotPhoto";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedScooter, type ScooterOption, type SelectedScooter } from "@/contexts/ScooterContext";
import { useGarageScooters } from "@/hooks/useGarageScooters";
import { optimizedImage } from "@/lib/imageTransform";
import { cn } from "@/lib/utils";

export type PickerLook = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";
const CHAMFER_S = "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)";

/** ?selecteur=1..5 → variante ; 0 ou absent → rien (page d'avant). */
/** Variante en prod sans paramètre (null tant que Nolan n'a pas choisi). */
/** 24/10 soir (tour 2) : Nolan a retenu la 6 « Plaque filtre » (discrète, dans la barre de filtres). La 3 verte reste en ?selecteur=3. */
export const DEFAULT_PICKER: PickerLook | null = 6;
export const readPickerLook = (sp: URLSearchParams): PickerLook | null => {
  if (sp.get("selecteur") === null) return DEFAULT_PICKER;
  const n = Number(sp.get("selecteur"));
  return n >= 1 && n <= 10 ? (n as PickerLook) : null;
};

/** « Xiaomi » + « Xiaomi 4 Pro » → « 4 Pro » ; « Dualtron » + « Thunder » → « Thunder ». */
export const shortName = (s: { name: string; brandName: string }) =>
  s.name.replace(new RegExp(`^${s.brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "");
export const fullName = (s: { name: string; brandName: string }) => `${s.brandName} ${shortName(s)}`;

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Nombre de pièces publiées par modèle (colonne tenue par triggers) — sert au tri « plus demandées » et à griser les modèles sans pièce. */
const usePartCounts = () =>
  useQuery({
    queryKey: ["scooter-picker-counts"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from("scooter_models").select("id, compatible_parts_count").eq("published", true);
      const m: Record<string, number> = {};
      (data || []).forEach((r) => (m[r.id as string] = (r.compatible_parts_count as number | null) ?? 0));
      return m;
    },
  }).data ?? {};

const Thumb = ({ url, size = 48, dark = false }: { url?: string | null; size?: number; dark?: boolean }) => (
  <span className="shrink-0 flex items-center justify-center overflow-hidden" style={{ width: size, height: size, background: dark ? "#F5F0E8" : "#F5F0E8", clipPath: CHAMFER_S }}>
    {url ? <img src={optimizedImage(url, size * 2)} alt="" loading="lazy" className="w-full h-full object-contain p-1" /> : <span className="text-xs text-gray-400">—</span>}
  </span>
);

/* ─────────────── Fenêtre de choix (plein écran au téléphone, panneau à l'ordinateur) ─────────────── */
export const PickerSheet = ({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (s: SelectedScooter) => void }) => {
  const { allScooters, selectedScooter } = useSelectedScooter();
  const garage = useGarageScooters().scooters ?? [];
  const counts = usePartCounts();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const photo = useSkotPhoto();
  const garageOpts: ScooterOption[] = useMemo(() => garage.map((g) => {
    const m = g.scooter_model;
    return allScooters.find((s) => s.id === m.id) ?? { id: m.id, name: m.name, slug: m.slug, brandName: m.brand, imageUrl: m.image_url };
  }), [garage, allScooters]);
  const popular = useMemo(() => [...allScooters].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0)).slice(0, 8), [allScooters, counts]);
  const results = useMemo(() => {
    const tokens = norm(q).split(" ").filter(Boolean);
    if (!tokens.length) return [];
    return allScooters
      .filter((s) => { const hay = norm(`${s.brandName} ${s.name}`); return tokens.every((t) => hay.includes(t)); })
      .sort((a, b) => a.brandName.localeCompare(b.brandName, "fr") || shortName(a).localeCompare(shortName(b), "fr", { numeric: true }))
      .slice(0, 60);
  }, [q, allScooters]);

  if (!open) return null;
  const Row = ({ s }: { s: ScooterOption }) => {
    const n = counts[s.id];
    const on = selectedScooter?.id === s.id;
    return (
      <button type="button" onClick={() => { onPick({ id: s.id, name: s.name, slug: s.slug, brandName: s.brandName, imageUrl: s.imageUrl }); onClose(); }}
        className={cn("w-full flex items-center gap-3 min-h-[60px] px-2 py-1.5 text-left", on ? "bg-[#4A7C59]/10" : "hover:bg-black/[0.03]")} style={{ fontFamily: FONT }}>
        <Thumb url={s.imageUrl} />
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-gray-500 leading-tight">{s.brandName}</span>
          <span className="block text-base font-extrabold text-carbon leading-tight break-words">{shortName(s)}</span>
        </span>
        {n === 0 ? <span className="text-sm text-gray-400 shrink-0">pièces à venir</span> : on ? <Check className="w-5 h-5 shrink-0" style={{ color: GREEN }} strokeWidth={3} /> : <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />}
      </button>
    );
  };
  const Section = ({ title, list }: { title: string; list: ScooterOption[] }) => list.length ? (
    <div className="mt-4">
      <p className="px-2 mb-1 text-sm font-bold uppercase tracking-wider text-gray-500" style={{ fontFamily: FONT }}>{title}</p>
      {list.map((s) => <Row key={s.id} s={s} />)}
    </div>
  ) : null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex md:items-start md:justify-center md:pt-24" role="dialog" aria-modal="true" aria-label="Choisis ta trottinette">
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative w-full h-full md:h-auto md:max-h-[78vh] md:max-w-lg bg-[#FAFAF8] flex flex-col md:shadow-2xl" style={{ clipPath: undefined }}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Ta trottinette</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-11 h-11 flex items-center justify-center -mr-2"><X className="w-6 h-6 text-carbon" /></button>
        </div>
        <div className="px-4">
          <label className="flex items-center gap-3 h-14 px-4 bg-white" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input ref={inputRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ta trott : Xiaomi, G30…" aria-label="Chercher ton modèle"
              className="w-full h-full bg-transparent outline-none text-base text-carbon placeholder:text-gray-400" style={{ fontFamily: FONT }} />
            {q && <button type="button" onClick={() => setQ("")} aria-label="Effacer" className="w-9 h-9 flex items-center justify-center"><X className="w-4 h-4 text-gray-500" /></button>}
          </label>
          {/* 28/10 : tu ne connais pas ton modèle → photo, SKOT la reconnaît (idée Weebot « Par photo »). */}
          {photo.ready && (
            <button type="button" onClick={() => { onClose(); photo.open(); }}
              className="mt-2 w-full flex items-center gap-3 min-h-[52px] px-4 text-left bg-white" style={{ boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
              <Camera className="w-5 h-5 shrink-0" style={{ color: GREEN }} strokeWidth={2.4} />
              <span className="flex-1 min-w-0">
                <span className="block text-base font-extrabold text-carbon leading-tight">Prends ta trott en photo</span>
                <span className="block text-sm text-gray-500 leading-tight">Tu ne connais pas le modèle ? SKOT la reconnaît.</span>
              </span>
              <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-6" style={{ overscrollBehavior: "contain" }}>
          {q.trim() ? (
            results.length ? <Section title={`${results.length}${results.length === 60 ? "+" : ""} modèle${results.length > 1 ? "s" : ""}`} list={results} />
              : <p className="px-2 mt-6 text-base text-gray-600" style={{ fontFamily: FONT }}>Aucun modèle trouvé. Essaie la marque seule (« Kaabo »), ou demande à SKOT.</p>
          ) : (
            <>
              <Section title="Ton garage" list={garageOpts} />
              <Section title="Les plus demandées" list={popular} />
              <p className="px-2 mt-4 text-sm text-gray-500" style={{ fontFamily: FONT }}>{allScooters.length} modèles : tape la marque ou le nom.</p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

/* ─────────────── Bloc d'état : trott choisie (compte + Voir tout + Changer) ─────────────── */
interface ChosenProps { scooter: SelectedScooter; filterOn: boolean; count: number | null; total: number; onAll: () => void; onFilter: () => void; onChange: () => void; dark?: boolean }
const ChosenLine = ({ scooter, filterOn, count, total, onAll, onFilter, onChange, dark }: ChosenProps) => (
  <div className="flex items-center gap-3" style={{ fontFamily: FONT }}>
    <Thumb url={scooter.imageUrl} size={56} dark={dark} />
    <div className="flex-1 min-w-0">
      <p className={cn("text-sm font-semibold leading-tight", dark ? "text-white/80" : "text-gray-500")}>{filterOn ? "Pièces pour ta" : "Ta trottinette"}</p>
      <p className={cn("text-base md:text-lg font-extrabold leading-tight break-words", dark ? "text-white" : "text-carbon")}>{fullName(scooter)}</p>
      {filterOn && count != null && <p className="text-sm font-bold leading-tight" style={{ color: dark ? "#fff" : GREEN }}>{count} pièce{count > 1 ? "s" : ""} vérifiée{count > 1 ? "s" : ""}</p>}
    </div>
    <div className="flex flex-col md:flex-row items-end md:items-center gap-1 md:gap-2 shrink-0">
      {filterOn
        ? <button type="button" onClick={onAll} className={cn("h-11 px-3 text-sm font-bold underline", dark ? "text-white" : "text-carbon")}>Voir les {total}</button>
        : <button type="button" onClick={onFilter} className="h-11 px-4 text-sm font-bold text-white" style={{ background: GREEN, clipPath: CHAMFER_S }}>Mes pièces</button>}
      <button type="button" onClick={onChange} className={cn("h-11 px-3 text-sm font-bold", dark ? "text-white/85" : "text-gray-600")}>Changer</button>
    </div>
  </div>
);

/* ─────────────── Contrôleur : ce que la page branche ─────────────── */
export interface PickerProps {
  look: PickerLook;
  /** true si la page filtre en ce moment sur la trott choisie. */
  filterOn: boolean;
  /** Pièces affichées pour la trott (null = en cours). */
  count: number | null;
  total: number;
  onPick: (s: SelectedScooter) => void;
  onFilter: (on: boolean) => void;
}

/** Plaque « Ma trottinette » à poser en tête de la barre de filtres (variante 1). */
export const PickerPlate = (p: PickerProps & { openSheet: () => void }) => {
  const { selectedScooter, clearSelection } = useSelectedScooter();
  if (!selectedScooter) return (
    <button type="button" onClick={p.openSheet} className="shrink-0 inline-flex items-center gap-2 h-11 pl-3 pr-4 text-sm font-extrabold text-white" style={{ fontFamily: FONT, background: GREEN, clipPath: CHAMFER_S }}>
      <Plus className="w-4 h-4" strokeWidth={3} /> Ma trottinette
    </button>
  );
  return (
    <span className="shrink-0 inline-flex items-stretch h-11" style={{ fontFamily: FONT }}>
      <button type="button" onClick={() => p.onFilter(!p.filterOn)} aria-pressed={p.filterOn} className="inline-flex items-center gap-2 pl-3 pr-3 text-sm font-extrabold"
        style={p.filterOn ? { background: GREEN, color: "#fff" } : { background: "#fff", color: CARBON, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
        {p.filterOn && <Check className="w-4 h-4" strokeWidth={3} />} Ma {shortName(selectedScooter)}
      </button>
      <button type="button" onClick={p.openSheet} aria-label="Changer de trottinette" className="w-10 flex items-center justify-center" style={{ background: p.filterOn ? "#3A6449" : "#fff", color: p.filterOn ? "#fff" : CARBON, boxShadow: p.filterOn ? undefined : `inset 0 0 0 1px ${LINE}`, clipPath: CHAMFER_S }}>
        <ChevronDown className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => { clearSelection(); p.onFilter(false); }} aria-label="Oublier ma trottinette" className="sr-only">Oublier</button>
    </span>
  );
};

/** Blocs des variantes 2 à 5 (sous le titre). La variante 1 vit dans les filtres (PickerPlate). */
export const PickerBlock = (p: PickerProps & { openSheet: () => void }) => {
  const { selectedScooter, allScooters } = useSelectedScooter();
  const garage = useGarageScooters().scooters ?? [];
  const counts = usePartCounts();
  const chosen = selectedScooter ? (
    <ChosenLine scooter={selectedScooter} filterOn={p.filterOn} count={p.count} total={p.total} onAll={() => p.onFilter(false)} onFilter={() => p.onFilter(true)} onChange={p.openSheet} dark={p.look === 3} />
  ) : null;

  // 2 · DEUX LISTES — marque puis modèle, listes natives.
  if (p.look === 2) return <TwoSelects {...p} />;

  // 3 · PLAQUE carbone
  if (p.look === 3) return (
    <div className="mt-5 p-4 md:p-5" style={{ background: GREEN, clipPath: CHAMFER }}>
      {chosen ?? (
        <>
          <p className="text-lg md:text-2xl uppercase text-white leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>Quelle est ta trottinette ?</p>
          <p className="mt-1 text-sm text-white/85" style={{ fontFamily: FONT }}>On ne te montre que les pièces vérifiées pour ton modèle.</p>
          <button type="button" onClick={p.openSheet} className="mt-3 w-full flex items-center gap-3 h-14 px-4 text-left" style={{ background: "#fff", fontFamily: FONT, clipPath: CHAMFER_S }}>
            <Search className="w-5 h-5 text-gray-400" /><span className="text-base text-gray-500">Xiaomi 4 Pro, Dualtron Thunder…</span>
          </button>
        </>
      )}
    </div>
  );

  // 4 · FRISE de trottinettes détourées
  if (p.look === 4) {
    const seen = new Set<string>();
    const strip: ScooterOption[] = [];
    garage.forEach((g) => { const s = allScooters.find((x) => x.id === g.scooter_model.id); if (s && !seen.has(s.id)) { seen.add(s.id); strip.push(s); } });
    [...allScooters].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0)).forEach((s) => { if (strip.length < 10 && !seen.has(s.id)) { seen.add(s.id); strip.push(s); } });
    return (
      <div className="mt-5">
        {chosen ? <div className="p-3 bg-white" style={{ boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: CHAMFER }}>{chosen}</div> : (
          <>
            <p className="text-sm font-bold uppercase tracking-wider text-gray-500" style={{ fontFamily: FONT }}>Ta trottinette</p>
            <div className="mt-2 flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1" style={{ scrollbarWidth: "none" }}>
              {strip.map((s) => (
                <button key={s.id} type="button" onClick={() => p.onPick({ id: s.id, name: s.name, slug: s.slug, brandName: s.brandName, imageUrl: s.imageUrl })}
                  className="shrink-0 w-[104px] flex flex-col items-center pt-2 pb-2 px-1 bg-white" style={{ boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: CHAMFER_S, fontFamily: FONT }}>
                  <span className="w-[84px] h-[64px] flex items-center justify-center">{s.imageUrl && <img src={optimizedImage(s.imageUrl, 200)} alt="" loading="lazy" className="max-w-full max-h-full object-contain" />}</span>
                  <span className="mt-1 text-sm font-semibold text-gray-500 leading-tight truncate w-full text-center">{s.brandName}</span>
                  <span className="text-sm font-extrabold text-carbon leading-tight truncate w-full text-center">{shortName(s)}</span>
                </button>
              ))}
              <button type="button" onClick={p.openSheet} className="shrink-0 w-[104px] flex flex-col items-center justify-center gap-1 text-white" style={{ background: GREEN, clipPath: CHAMFER_S, fontFamily: FONT }}>
                <Search className="w-6 h-6" /><span className="text-sm font-extrabold leading-tight text-center">Autre<br />modèle</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // 5 · BANDEAU collé sous l'en-tête
  return (
    <div className="sticky top-16 lg:top-20 z-30 mb-2 py-2 bg-[#FAFAF8]/95 backdrop-blur border-y" style={{ borderColor: LINE }}><div className="container mx-auto px-4">
      {selectedScooter ? (
        <div className="flex items-center gap-2" style={{ fontFamily: FONT }}>
          <Thumb url={selectedScooter.imageUrl} size={40} />
          <button type="button" onClick={p.openSheet} className="flex-1 min-w-0 text-left">
            <span className="block text-sm text-gray-500 leading-tight">{p.filterOn ? `${p.count ?? "…"} pièces pour ta` : "Ta trottinette"}</span>
            <span className="block text-sm font-extrabold text-carbon leading-tight truncate">{fullName(selectedScooter)} <ChevronDown className="inline w-4 h-4 -mt-0.5" /></span>
          </button>
          {p.filterOn
            ? <button type="button" onClick={() => p.onFilter(false)} className="h-11 px-3 text-sm font-bold underline text-carbon shrink-0">Tout voir</button>
            : <button type="button" onClick={() => p.onFilter(true)} className="h-11 px-3 text-sm font-bold text-white shrink-0" style={{ background: GREEN, clipPath: CHAMFER_S }}>Mes pièces</button>}
        </div>
      ) : (
        <button type="button" onClick={p.openSheet} className="w-full flex items-center gap-3 h-11 text-left" style={{ fontFamily: FONT }}>
          <span className="w-8 h-8 flex items-center justify-center text-white shrink-0" style={{ background: GREEN, clipPath: CHAMFER_S }}><Plus className="w-4 h-4" strokeWidth={3} /></span>
          <span className="flex-1 text-sm font-extrabold text-carbon">Choisis ta trottinette <span className="font-semibold text-gray-500">pour ne voir que tes pièces</span></span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      )}
    </div></div>
  );
};

const TwoSelects = (p: PickerProps & { openSheet: () => void }) => {
  const { selectedScooter, allScooters } = useSelectedScooter();
  const [brand, setBrand] = useState<string>(selectedScooter?.brandName ?? "");
  useEffect(() => { if (selectedScooter) setBrand(selectedScooter.brandName); }, [selectedScooter?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const brands = useMemo(() => {
    const m = new Map<string, number>();
    allScooters.forEach((s) => m.set(s.brandName, (m.get(s.brandName) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr"));
  }, [allScooters]);
  const models = useMemo(() => allScooters.filter((s) => s.brandName === brand).sort((a, b) => shortName(a).localeCompare(shortName(b), "fr", { numeric: true })), [allScooters, brand]);
  const sel = "h-12 pl-3 pr-8 text-base font-bold bg-white min-w-0 flex-1 md:flex-none md:w-56";
  return (
    <div className="mt-5" style={{ fontFamily: FONT }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-full md:w-auto text-sm font-bold uppercase tracking-wider text-gray-500">Ta trottinette</span>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Marque de ta trottinette" className={sel} style={{ color: CARBON, clipPath: CHAMFER_S, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
          <option value="">Marque…</option>
          {brands.map(([b, n]) => <option key={b} value={b}>{b} ({n})</option>)}
        </select>
        <select value={selectedScooter && selectedScooter.brandName === brand ? selectedScooter.id : ""} disabled={!brand}
          onChange={(e) => { const s = models.find((m) => m.id === e.target.value); if (s) p.onPick({ id: s.id, name: s.name, slug: s.slug, brandName: s.brandName, imageUrl: s.imageUrl }); }}
          aria-label="Modèle de ta trottinette" className={cn(sel, "disabled:opacity-50")} style={{ color: CARBON, clipPath: CHAMFER_S, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
          <option value="">Modèle…</option>
          {models.map((m) => <option key={m.id} value={m.id}>{shortName(m)}</option>)}
        </select>
      </div>
      {selectedScooter && (
        <p className="mt-2 text-sm text-gray-600">
          {p.filterOn ? <><b className="text-carbon">{p.count ?? "…"} pièce{(p.count ?? 0) > 1 ? "s" : ""}</b> vérifiée{(p.count ?? 0) > 1 ? "s" : ""} pour ta {fullName(selectedScooter)} · <button type="button" onClick={() => p.onFilter(false)} className="font-bold underline text-carbon min-h-[44px]">voir les {p.total}</button></>
            : <button type="button" onClick={() => p.onFilter(true)} className="font-bold underline text-carbon min-h-[44px]">Ne voir que les pièces de ma {fullName(selectedScooter)}</button>}
        </p>
      )}
    </div>
  );
};

/** État vide quand la trott choisie n'a encore aucune pièce vérifiée (119 modèles au 24/10). */
export const PickerEmpty = ({ scooter, total, onAll }: { scooter: SelectedScooter; total: number; onAll: () => void }) => (
  <div className="max-w-xl mx-auto py-14 text-center" style={{ fontFamily: FONT }}>
    <p className="text-xl md:text-2xl uppercase leading-tight text-carbon" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>Pas encore de pièce vérifiée<br />pour ta {fullName(scooter)}</p>
    <p className="mt-3 text-base text-gray-600">L'atelier vérifie chaque compatibilité avant de l'afficher. Dis-nous ce qu'il te faut : on te répond avec la bonne référence.</p>
    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
      <button type="button" onClick={() => window.dispatchEvent(new Event("skot:open"))} className="h-12 px-5 inline-flex items-center justify-center gap-2 text-base font-extrabold text-white" style={{ background: GREEN, clipPath: CHAMFER_S }}>
        <MessageCircle className="w-5 h-5" /> Demander à SKOT
      </button>
      <button type="button" onClick={onAll} className="h-12 px-5 text-base font-bold text-carbon underline">Voir les {total} pièces</button>
    </div>
  </div>
);

/* ─────────────── Tour 2 (24/10 soir) : 5 sélecteurs DISCRETS, plus de bloc en haut ───────────────
 * Nolan : « pas le sélecteur en haut… plus discret, au niveau des filtres », et plus de grand aplat vert.
 * 6 PLAQUE FILTRE · première plaque de la barre de filtres, blanche, mini-photo + nom + ✕
 * 7 LIGNE         · une ligne de texte sous le titre : « Pour ta Inmotion RS · changer · tout voir »
 * 8 PASTILLE      · carré photo de la trott en tête des filtres (pointillé « + Ta trott » si vide)
 * 9 COMPTEUR      · « 32 sur 564 · pour ta Inmotion RS ✕ » collé au compteur du titre
 * 10 BASCULE      · interrupteur deux positions sous les filtres : Toutes les pièces | Pour ma trott
 */
const LINE2 = "#D6CFC2";
const MiniThumb = ({ url, size = 28 }: { url?: string | null; size?: number }) => (
  <span className="shrink-0 flex items-center justify-center overflow-hidden bg-white" style={{ width: size, height: size, borderRadius: 4 }}>
    {url ? <img src={optimizedImage(url, 112)} alt="" loading="lazy" className="w-full h-full object-contain" /> : null}
  </span>
);
const ScootIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="5" cy="18" r="2.5" /><circle cx="19" cy="18" r="2.5" /><path d="M7.5 18h9M15 6h2.5l-1.5 9.5M15 6l-1-2" />
  </svg>
);

export const PickerDiscreet = (p: PickerProps & { openSheet: () => void }) => {
  const { selectedScooter, clearSelection } = useSelectedScooter();
  const s = selectedScooter;
  const forget = () => { clearSelection(); p.onFilter(false); };

  // 6 · PLAQUE FILTRE
  if (p.look === 6) {
    if (!s) return (
      <button type="button" onClick={p.openSheet} className="shrink-0 inline-flex items-center gap-2 h-11 pl-3 pr-3.5 text-sm font-bold bg-white" style={{ fontFamily: FONT, color: CARBON, boxShadow: `inset 0 0 0 1.5px ${CARBON}`, clipPath: CHAMFER_S }}>
        <ScootIcon /> Ma trottinette <ChevronDown className="w-4 h-4 opacity-60" />
      </button>
    );
    return (
      <span className="shrink-0 inline-flex items-center h-11 bg-white" style={{ fontFamily: FONT, boxShadow: `inset 0 0 0 1.5px ${CARBON}`, clipPath: CHAMFER_S }}>
        <button type="button" onClick={p.openSheet} className="h-full inline-flex items-center gap-2 pl-1.5 pr-2 text-sm font-bold" style={{ color: CARBON }}>
          <MiniThumb url={s.imageUrl} size={32} />
          <span className="max-w-[150px] truncate">{shortName(s)}</span>
          {p.filterOn && p.count != null && <span className="text-sm font-semibold text-gray-500">{p.count}</span>}
        </button>
        <button type="button" onClick={() => (p.filterOn ? forget() : p.onFilter(true))} aria-label={p.filterOn ? "Retirer ma trottinette" : "Ne voir que mes pièces"} className="h-full w-10 flex items-center justify-center border-l" style={{ borderColor: LINE2, color: CARBON }}>
          {p.filterOn ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
        </button>
      </span>
    );
  }

  // 7 · LIGNE
  if (p.look === 7) return (
    <p className="mt-3 text-sm text-gray-600 flex flex-wrap items-center gap-x-2" style={{ fontFamily: FONT }}>
      {s ? (
        <>
          <span className="inline-flex items-center gap-1.5"><ScootIcon className="w-4 h-4 text-carbon shrink-0" />{p.filterOn ? "Pièces pour ta" : "Ta trottinette :"} <b className="text-carbon">{fullName(s)}</b></span>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={p.openSheet} className="min-h-[44px] font-bold underline text-carbon">changer</button>
          <span aria-hidden="true">·</span>
          {p.filterOn
            ? <button type="button" onClick={() => p.onFilter(false)} className="min-h-[44px] font-bold underline text-carbon">voir les {p.total}</button>
            : <button type="button" onClick={() => p.onFilter(true)} className="min-h-[44px] font-bold underline text-carbon">ne voir que mes pièces</button>}
        </>
      ) : (
        <button type="button" onClick={p.openSheet} className="min-h-[44px] text-left inline-flex items-center gap-1.5"><ScootIcon className="w-4 h-4 text-carbon shrink-0" /><span><span className="font-bold underline text-carbon">Choisis ta trottinette</span> pour ne voir que ses pièces</span></button>
      )}
    </p>
  );

  // 8 · PASTILLE photo
  if (p.look === 8) {
    if (!s) return (
      <button type="button" onClick={p.openSheet} aria-label="Choisir ma trottinette" className="shrink-0 inline-flex items-center gap-2 h-11 pl-1.5 pr-3 text-sm font-bold" style={{ fontFamily: FONT, color: CARBON, border: `1.5px dashed ${CARBON}`, borderRadius: 6 }}>
        <span className="w-8 h-8 flex items-center justify-center" style={{ background: "#EDE7DB", borderRadius: 4 }}><Plus className="w-4 h-4" strokeWidth={3} /></span>Ta trott
      </button>
    );
    return (
      <button type="button" onClick={p.openSheet} aria-label={`Ta trottinette : ${fullName(s)}, changer`} className="shrink-0 relative inline-flex items-center h-11 pl-1 pr-3 gap-2 text-sm font-extrabold"
        style={{ fontFamily: FONT, color: p.filterOn ? "#fff" : CARBON, background: p.filterOn ? CARBON : "#fff", borderRadius: 6, boxShadow: p.filterOn ? undefined : `inset 0 0 0 1px ${LINE}` }}>
        <MiniThumb url={s.imageUrl} size={36} />
        <span className="max-w-[120px] truncate">{shortName(s)}</span>
      </button>
    );
  }

  // 9 · COMPTEUR
  if (p.look === 9) return s ? (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600" style={{ fontFamily: FONT }}>
      {p.filterOn ? <>pour ta <button type="button" onClick={p.openSheet} className="min-h-[44px] font-extrabold text-carbon underline decoration-dotted underline-offset-4">{fullName(s)}</button>
        <button type="button" onClick={() => p.onFilter(false)} aria-label="Voir toutes les pièces" className="w-11 h-11 -ml-2 flex items-center justify-center text-carbon"><X className="w-4 h-4" /></button></>
        : <button type="button" onClick={() => p.onFilter(true)} className="min-h-[44px] font-bold underline text-carbon">voir celles de ma {shortName(s)}</button>}
    </span>
  ) : (
    <button type="button" onClick={p.openSheet} className="min-h-[44px] inline-flex items-center gap-1.5 text-sm font-bold text-carbon underline decoration-dotted underline-offset-4" style={{ fontFamily: FONT }}>
      <ScootIcon /> pour ma trott ?
    </button>
  );

  // 10 · BASCULE
  const seg = (on: boolean) => cn("flex-1 min-w-0 h-11 px-3 inline-flex items-center justify-center gap-2 text-sm font-bold truncate transition-colors", on ? "bg-carbon text-white" : "text-carbon");
  return (
    <div className="flex items-stretch p-1 bg-white max-w-md" role="tablist" style={{ fontFamily: FONT, boxShadow: `inset 0 0 0 1px ${LINE}`, borderRadius: 8 }}>
      <button type="button" role="tab" aria-selected={!p.filterOn} onClick={() => p.onFilter(false)} className={seg(!p.filterOn)} style={{ borderRadius: 6 }}>Toutes les pièces</button>
      {s ? (
        <button type="button" role="tab" aria-selected={p.filterOn} onClick={() => (p.filterOn ? p.openSheet() : p.onFilter(true))} className={seg(p.filterOn)} style={{ borderRadius: 6 }}>
          <MiniThumb url={s.imageUrl} size={26} /><span className="truncate">Ma {shortName(s)}</span>{p.filterOn && <ChevronDown className="w-4 h-4 shrink-0 opacity-70" />}
        </button>
      ) : (
        <button type="button" role="tab" aria-selected={false} onClick={p.openSheet} className={seg(false)} style={{ borderRadius: 6 }}><ScootIcon /> Pour ma trott</button>
      )}
    </div>
  );
};
