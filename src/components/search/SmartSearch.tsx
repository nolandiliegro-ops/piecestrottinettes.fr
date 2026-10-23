/**
 * Recherche du site — 5 propositions (24/10/2026), ?recherche=1..5 (sans paramètre : ancienne SpotlightCommand).
 * Même moteur pour les 5 (useSmartSearch) : instantané, fautes tolérées, résultats SÉPARÉS
 * (marque · trottinettes · pièces · familles) avec onglets et compteurs.
 * 1 Palette · 2 Plein écran · 3 Panneau · 4 Noir racing · 5 Vitrine
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock, Search, X } from "lucide-react";
import { useSpotlight } from "@/contexts/SpotlightContext";
import { useSmartSearch, type SBrand, type SFamily, type SPart, type SScooter } from "@/hooks/useSmartSearch";
import { optimizedImage } from "@/lib/imageTransform";

export const readRechercheVariant = (): number => {
  try {
    const n = Number(new URLSearchParams(window.location.search).get("recherche"));
    return n >= 1 && n <= 5 ? n : 0;
  } catch {
    return 0;
  }
};

const FONT = "'Plus Jakarta Sans', sans-serif";
const UNB = "'Unbounded', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const CUT = "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)";
const RECENT_KEY = "pt-recherches-recentes";
const STAR_BRANDS = ["kukirin", "teverun", "dualtron", "xiaomi", "kaabo", "navee"];
const euro = (n: number | null) => (n == null ? "" : `${n.toLocaleString("fr-FR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`);
const img = (u: string | null, w = 200) => (u ? optimizedImage(u, w) : null);

type Tab = "tout" | "trotts" | "pieces" | "marques";
type Recent = { label: string; to: string };
const readRecent = (): Recent[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, 5); } catch { return []; }
};
const saveRecent = (r: Recent) => {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([r, ...readRecent().filter((x) => x.to !== r.to)].slice(0, 5))); } catch { /* stockage indisponible */ }
};

const SmartSearch = ({ variant }: { variant: number }) => {
  const { isOpen, closeSpotlight } = useSpotlight();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("tout");
  const [recent, setRecent] = useState<Recent[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const r = useSmartSearch(q, isOpen);
  const dark = variant === 4;

  useEffect(() => {
    if (!isOpen) return;
    setRecent(readRecent());
    setTab("tout");
    const t = setTimeout(() => input.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeSpotlight(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [isOpen, closeSpotlight]);
  useEffect(() => setTab("tout"), [q]);

  const go = (to: string, label: string) => {
    saveRecent({ to, label });
    closeSpotlight();
    setQ("");
    navigate(to);
  };

  const pieces = r.brand ? r.brandParts : r.parts;
  const counts = { trotts: r.scooters.length, pieces: pieces.length, marques: r.brands.length };
  const total = counts.trotts + counts.pieces + counts.marques + r.families.length;
  const searching = q.trim().length >= 2;
  const ink = dark ? "#FFFFFF" : CARBON;
  const sub = dark ? "rgba(255,255,255,0.6)" : "#6B7280";
  const surface = dark ? "#242424" : "#FFFFFF";
  const line = dark ? "rgba(255,255,255,0.12)" : LINE;

  /* ───── briques ───── */
  const Thumb = ({ src, size = 48, contain = true }: { src: string | null; size?: number; contain?: boolean }) => (
    <span className="shrink-0 flex items-center justify-center overflow-hidden" style={{ width: size, height: size, background: dark ? "#333" : "#F5F0E8", clipPath: CUT }}>
      {src ? <img src={src} alt="" loading="lazy" className={`w-full h-full ${contain ? "object-contain p-1 mix-blend-multiply" : "object-cover"}`} style={dark ? { mixBlendMode: "normal" } : undefined} /> : null}
    </span>
  );
  const Row = ({ onClick, thumb, title, meta, right }: { onClick: () => void; thumb: React.ReactNode; title: string; meta?: string; right?: React.ReactNode }) => (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 min-h-[60px] px-3 py-2 text-left transition-colors hover:bg-black/[0.04]">
      {thumb}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold leading-snug truncate" style={{ fontFamily: FONT, color: ink }}>{title}</span>
        {meta && <span className="block text-sm truncate" style={{ fontFamily: FONT, color: sub }}>{meta}</span>}
      </span>
      {right}
    </button>
  );
  const SectionHead = ({ label, n, onAll }: { label: string; n: number; onAll?: () => void }) => (
    <div className="flex items-baseline justify-between px-3 pt-4 pb-1.5">
      <span className="text-sm font-extrabold uppercase tracking-[0.12em]" style={{ fontFamily: FONT, color: dark ? "#9FD3AE" : GREEN }}>{label} <span style={{ color: sub }}>· {n}</span></span>
      {onAll && n > 0 && <button type="button" onClick={onAll} className="min-h-[36px] text-sm font-bold underline underline-offset-4" style={{ fontFamily: FONT, color: ink }}>Tout voir</button>}
    </div>
  );

  const scooterRow = (s: SScooter) => (
    <Row key={s.id} onClick={() => go(`/scooter/${s.slug}`, s.name)} thumb={<Thumb src={img(s.image)} />} title={s.name}
      meta={`${s.brandName} · trottinette`} right={s.parts > 0 ? <span className="shrink-0 text-sm font-bold" style={{ fontFamily: FONT, color: dark ? "#9FD3AE" : GREEN }}>{s.parts} pièces</span> : undefined} />
  );
  const partRow = (p: SPart) => (
    <Row key={p.id} onClick={() => go(`/piece/${p.slug}`, p.name)} thumb={<Thumb src={img(p.image)} />} title={p.name} meta={p.catName}
      right={<span className="shrink-0 text-sm font-extrabold" style={{ fontFamily: FONT, color: ink }}>{euro(p.price)}</span>} />
  );
  const brandRow = (b: SBrand) => (
    <Row key={b.id} onClick={() => go(`/marque/${b.slug}`, b.name)} thumb={<Thumb src={b.logo_url} />} title={b.name} meta={`${b.models} trottinette${b.models > 1 ? "s" : ""}`} right={<ArrowRight className="w-4 h-4" style={{ color: sub }} />} />
  );
  const familyChips = (fams: SFamily[]) => fams.length > 0 && (
    <div className="flex flex-wrap gap-2 px-3 pt-2">
      {fams.map((f) => (
        <button key={f.id} type="button" onClick={() => go(r.brand ? `/marque/${r.brand.slug}` : `/categorie/${f.slug}`, f.name)}
          className="inline-flex items-center gap-2 min-h-[44px] px-3.5 text-sm font-bold" style={{ fontFamily: FONT, clipPath: CUT, background: dark ? "#333" : "#F5F0E8", color: ink }}>
          {f.name}{r.brand ? ` ${r.brand.name}` : ""} <span style={{ color: dark ? "#9FD3AE" : GREEN }}>{f.count}</span>
        </button>
      ))}
    </div>
  );

  /** Bandeau « marque reconnue » : on comprend tout de suite ce qu'on a trouvé. */
  const brandBanner = r.brand && (
    <button type="button" onClick={() => go(`/marque/${r.brand!.slug}`, r.brand!.name)} className="mx-3 mt-3 w-[calc(100%-1.5rem)] flex items-center gap-3 p-3 text-left" style={{ clipPath: CUT, background: dark ? "#2E2E2E" : "#F5F0E8" }}>
      <Thumb src={r.brand.logo_url} size={52} />
      <span className="min-w-0 flex-1">
        <span className="block text-lg uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: ink }}>{r.brand.name}</span>
        <span className="block mt-1 text-sm" style={{ fontFamily: FONT, color: sub }}>{r.brand.models} trottinettes · {r.brandParts.length} pièces compatibles</span>
      </span>
      <ArrowRight className="w-5 h-5" style={{ color: ink }} />
    </button>
  );

  const tabs = searching && total > 0 && (
    <div className="flex gap-1.5 overflow-x-auto px-3 pt-3 pb-1" style={{ scrollbarWidth: "none" }}>
      {([["tout", "Tout", total], ["trotts", "Trottinettes", counts.trotts], ["pieces", r.brand ? `Pièces ${r.brand.name}` : "Pièces", counts.pieces], ["marques", "Marques", counts.marques]] as [Tab, string, number][])
        .filter(([k, , n]) => k === "tout" || n > 0).map(([k, l, n]) => (
          <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k}
            className="shrink-0 inline-flex items-center gap-1.5 min-h-[40px] px-3.5 text-sm font-extrabold whitespace-nowrap"
            style={{ fontFamily: FONT, clipPath: CUT, background: tab === k ? (dark ? "#FFFFFF" : CARBON) : "transparent", color: tab === k ? (dark ? CARBON : "#fff") : ink, boxShadow: tab === k ? "none" : `inset 0 0 0 1px ${line}` }}>
            {l} <span className="opacity-60">{n}</span>
          </button>
        ))}
    </div>
  );

  const emptyState = (
    <div className="pb-3">
      {recent.length > 0 && (
        <>
          <SectionHead label="Tes dernières recherches" n={recent.length} />
          {recent.map((x) => (
            <Row key={x.to} onClick={() => go(x.to, x.label)} thumb={<span className="w-10 h-10 flex items-center justify-center"><Clock className="w-4 h-4" style={{ color: sub }} /></span>} title={x.label} />
          ))}
        </>
      )}
      <SectionHead label="Les marques du moment" n={STAR_BRANDS.length} />
      <div className="flex flex-wrap gap-2 px-3">
        {STAR_BRANDS.map((slug) => (
          <button key={slug} type="button" onClick={() => setQ(slug === "teverun" ? "Teverun" : slug.charAt(0).toUpperCase() + slug.slice(1))}
            className="min-h-[44px] px-3.5 text-sm font-extrabold uppercase tracking-[0.04em]" style={{ fontFamily: FONT, clipPath: CUT, background: dark ? "#333" : "#F5F0E8", color: ink }}>{slug}</button>
        ))}
      </div>
      <SectionHead label="Ce qu'on cherche le plus" n={4} />
      <div className="flex flex-wrap gap-2 px-3">
        {["Pneu 10x2.50", "Chambre à air 8.5", "Plaquettes Xiaomi", "Chargeur 48V"].map((t) => (
          <button key={t} type="button" onClick={() => setQ(t)} className="min-h-[44px] px-3.5 text-sm font-bold" style={{ fontFamily: FONT, clipPath: CUT, boxShadow: `inset 0 0 0 1px ${line}`, color: ink }}>{t}</button>
        ))}
      </div>
    </div>
  );

  const noResult = searching && r.ready && total === 0 && (
    <p className="px-4 py-8 text-base" style={{ fontFamily: FONT, color: sub }}>Rien pour « {q} ». Essaie une marque (Xiaomi, Kukirin…), un modèle (G30, Mi Pro 2) ou une taille (10x2.50).</p>
  );
  const loading = searching && !r.ready && <p className="px-4 py-8 text-base" style={{ fontFamily: FONT, color: sub }}>Chargement du catalogue…</p>;

  /** Résultats en LISTES séparées (propositions 1, 3, 4). `limit` par section en « Tout ». */
  const listResults = (limit = 4) => {
    const lim = (n: number) => (tab === "tout" ? limit : n);
    return (
      <div className="pb-3">
        {(tab === "tout") && brandBanner}
        {(tab === "tout") && familyChips(r.families)}
        {(tab === "tout" || tab === "marques") && !r.brand && counts.marques > 0 && <><SectionHead label="Marques" n={counts.marques} onAll={tab === "tout" ? () => setTab("marques") : undefined} />{r.brands.slice(0, lim(20)).map(brandRow)}</>}
        {(tab === "tout" || tab === "trotts") && counts.trotts > 0 && <><SectionHead label={r.brand ? `Trottinettes ${r.brand.name}` : "Trottinettes"} n={counts.trotts} onAll={tab === "tout" ? () => setTab("trotts") : undefined} />{r.scooters.slice(0, lim(60)).map(scooterRow)}</>}
        {(tab === "tout" || tab === "pieces") && counts.pieces > 0 && <><SectionHead label={r.brand ? `Pièces compatibles ${r.brand.name}` : "Pièces"} n={counts.pieces} onAll={tab === "tout" ? () => setTab("pieces") : undefined} />{pieces.slice(0, lim(60)).map(partRow)}</>}
        {tab === "marques" && r.brand && r.brands.map(brandRow)}
      </div>
    );
  };

  /** Cartes (propositions 2 et 5). */
  const ScooterCard = ({ s }: { s: SScooter }) => (
    <button type="button" onClick={() => go(`/scooter/${s.slug}`, s.name)} className="group shrink-0 text-left bg-white" style={{ clipPath: CUT, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
      <span className="block aspect-[4/3] bg-[#F5F0E8] p-2">{s.image && <img src={img(s.image, 360)!} alt="" loading="lazy" className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105" />}</span>
      <span className="block p-3">
        <span className="block text-sm font-bold uppercase tracking-wide" style={{ fontFamily: FONT, color: "#6B7280" }}>{s.brandName}</span>
        <span className="block text-[15px] uppercase leading-tight line-clamp-2" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{s.name.replace(new RegExp(`^${s.brandName}\\s+`, "i"), "")}</span>
        {s.parts > 0 && <span className="block mt-1 text-sm font-bold" style={{ fontFamily: FONT, color: GREEN }}>{s.parts} pièces compatibles</span>}
      </span>
    </button>
  );
  const PartCardS = ({ p }: { p: SPart }) => (
    <button type="button" onClick={() => go(`/piece/${p.slug}`, p.name)} className="group shrink-0 text-left bg-white" style={{ clipPath: CUT, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
      <span className="block aspect-square bg-[#F5F0E8] p-3">{p.image && <img src={img(p.image, 300)!} alt="" loading="lazy" className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105" />}</span>
      <span className="block p-3">
        <span className="block text-sm" style={{ fontFamily: FONT, color: "#6B7280" }}>{p.catName}</span>
        <span className="block text-sm font-bold leading-snug line-clamp-2" style={{ fontFamily: FONT, color: CARBON }}>{p.name}</span>
        <span className="block mt-1 text-[15px] font-extrabold" style={{ fontFamily: FONT, color: CARBON }}>{euro(p.price)}</span>
      </span>
    </button>
  );
  const cardResults = (rail: boolean) => {
    const wrap = (children: React.ReactNode) => rail
      ? <div className="flex gap-3 overflow-x-auto px-3 pb-2 snap-x [&>*]:snap-start [&>*]:w-[46%] sm:[&>*]:w-[30%] lg:[&>*]:w-[19%]" style={{ scrollbarWidth: "none" }}>{children}</div>
      : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-3">{children}</div>;
    const lim = (n: number) => (tab === "tout" ? (rail ? 12 : 5) : n);
    return (
      <div className="pb-4">
        {tab === "tout" && brandBanner}
        {tab === "tout" && familyChips(r.families)}
        {(tab === "tout" || tab === "marques") && !r.brand && counts.marques > 0 && <><SectionHead label="Marques" n={counts.marques} />{r.brands.map(brandRow)}</>}
        {(tab === "tout" || tab === "trotts") && counts.trotts > 0 && <><SectionHead label={r.brand ? `Trottinettes ${r.brand.name}` : "Trottinettes"} n={counts.trotts} onAll={tab === "tout" ? () => setTab("trotts") : undefined} />{wrap(r.scooters.slice(0, lim(60)).map((s) => <ScooterCard key={s.id} s={s} />))}</>}
        {(tab === "tout" || tab === "pieces") && counts.pieces > 0 && <><SectionHead label={r.brand ? `Pièces compatibles ${r.brand.name}` : "Pièces"} n={counts.pieces} onAll={tab === "tout" ? () => setTab("pieces") : undefined} />{wrap(pieces.slice(0, lim(60)).map((p) => <PartCardS key={p.id} p={p} />))}</>}
      </div>
    );
  };

  const inputBar = (big = false) => (
    <div className="flex items-center gap-3 px-4" style={{ minHeight: big ? 72 : 60, borderBottom: `1px solid ${line}` }}>
      <Search className={big ? "w-6 h-6" : "w-5 h-5"} style={{ color: ink }} />
      <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Une trottinette, une marque, une pièce, une taille…"
        aria-label="Rechercher sur le site" enterKeyHint="search" autoComplete="off" autoCorrect="off" spellCheck={false}
        className={`flex-1 min-w-0 bg-transparent outline-none ${big ? "text-xl" : "text-base"}`} style={{ fontFamily: FONT, color: ink }} />
      {q && <button type="button" onClick={() => { setQ(""); input.current?.focus(); }} aria-label="Effacer" className="w-10 h-10 flex items-center justify-center"><X className="w-5 h-5" style={{ color: sub }} /></button>}
      <button type="button" onClick={closeSpotlight} className="min-h-[44px] px-2 text-sm font-bold" style={{ fontFamily: FONT, color: ink }}>Fermer</button>
    </div>
  );
  const body = (cards: false | "grid" | "rail", listLimit = 4) => (
    <>
      {tabs}
      {!searching ? emptyState : loading || noResult || (cards ? cardResults(cards === "rail") : listResults(listLimit))}
    </>
  );

  // Centrage par flex (et non translate) : framer-motion écrase `transform`, d'où le panneau décalé à droite sur iPhone.
  let panel: React.ReactNode;
  if (variant === 2) {
    panel = (
      <motion.div key="p2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[101] flex flex-col bg-[#FAFAF8]">
        <div className="bg-white">{inputBar(true)}</div>
        <div className="flex-1 overflow-y-auto"><div className="max-w-6xl mx-auto w-full">{body("grid")}</div></div>
      </motion.div>
    );
  } else if (variant === 3) {
    panel = (
      <motion.div key="p3" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="fixed inset-x-0 top-0 z-[101] max-h-[100dvh] md:max-h-[85vh] flex flex-col bg-white shadow-2xl max-md:bottom-0">
        <div className="max-w-6xl mx-auto w-full">{inputBar(true)}</div>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full md:grid md:grid-cols-[280px_1fr] md:gap-6">
            <aside className="hidden md:block border-r" style={{ borderColor: LINE }}>
              {searching ? <>{brandBanner}{familyChips(r.families)}{!r.brand && r.brands.length > 0 && <><SectionHead label="Marques" n={r.brands.length} />{r.brands.map(brandRow)}</>}</> : emptyState}
            </aside>
            <div>{searching ? <>{tabs}{loading || noResult || (
              <div className="pb-3">
                <div className="md:hidden">{brandBanner}{familyChips(r.families)}</div>
                {(tab === "tout" || tab === "trotts") && counts.trotts > 0 && <><SectionHead label={r.brand ? `Trottinettes ${r.brand.name}` : "Trottinettes"} n={counts.trotts} onAll={tab === "tout" ? () => setTab("trotts") : undefined} /><div className="md:grid md:grid-cols-2">{r.scooters.slice(0, tab === "tout" ? 6 : 60).map(scooterRow)}</div></>}
                {(tab === "tout" || tab === "pieces") && counts.pieces > 0 && <><SectionHead label={r.brand ? `Pièces compatibles ${r.brand.name}` : "Pièces"} n={counts.pieces} onAll={tab === "tout" ? () => setTab("pieces") : undefined} /><div className="md:grid md:grid-cols-2">{pieces.slice(0, tab === "tout" ? 6 : 60).map(partRow)}</div></>}
                {tab === "marques" && r.brands.map(brandRow)}
              </div>
            )}</> : <div className="md:hidden">{emptyState}</div>}</div>
          </div>
        </div>
      </motion.div>
    );
  } else if (variant === 5) {
    panel = (
      <div className="fixed inset-0 z-[101] flex items-start justify-center md:pt-[8vh] pointer-events-none">
        <motion.div key="p5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
          className="pointer-events-auto w-full max-w-5xl h-[100dvh] md:h-auto md:max-h-[84vh] flex flex-col bg-[#FAFAF8] shadow-2xl" style={{ clipPath: "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)" }}>
          <div className="bg-white">{inputBar(true)}</div>
          <div className="flex-1 overflow-y-auto">{body("rail")}</div>
        </motion.div>
      </div>
    );
  } else {
    panel = (
      <div className="fixed inset-0 z-[101] flex items-start justify-center md:pt-[12vh] pointer-events-none">
        <motion.div key="p14" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className="pointer-events-auto w-full max-w-2xl h-[100dvh] md:h-auto md:max-h-[76vh] flex flex-col shadow-2xl"
          style={{ background: surface, clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)" }}>
          {inputBar(false)}
          <div className="flex-1 overflow-y-auto">{body(false, variant === 4 ? 5 : 4)}</div>
          <div className="hidden md:flex items-center gap-4 px-4 h-10 text-sm" style={{ fontFamily: FONT, color: sub, borderTop: `1px solid ${line}` }}>
            <span>Échap pour fermer</span><span>Fautes tolérées : « teverne », « ninebot g30 »</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeSpotlight} className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-sm" />
          {panel}
        </>
      )}
    </AnimatePresence>
  );
};

export default SmartSearch;
