/**
 * Navigation par marque au-dessus du carrousel de gamme (fiche trottinette) — 5 propositions (17/10/2026), ?explo=1..5.
 * Retour de Nolan sur la 1re version : design pas aimé + impossible de naviguer entre les marques à la souris sur ordinateur.
 * Commun aux 5 : marque précédente / suivante en un clic (boucle sur les 50 marques), flèches ≥ 44 px, logos réels.
 */
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, X } from "lucide-react";
import { optimizedImage } from "@/lib/imageTransform";

export type ExploLook = 1 | 2 | 3 | 4 | 5;
export const EXPLO_NAMES: Record<ExploLook, string> = { 1: "Player", 2: "Logos", 3: "Onglets", 4: "Toutes les marques", 5: "Pellicule" };

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";

export interface ExploBrand { name: string; n: number; img: string | null; logo: string | null }

interface Props { look: ExploLook; brands: ExploBrand[]; view: string; onChange: (name: string) => void }

// Beaucoup de logos sont de simples pictos (Apollo, Cecotec, Dualtron…) : le nom est toujours écrit à côté.
const Logo = ({ b, className = "h-6", invert = false, name = true }: { b: ExploBrand; className?: string; invert?: boolean; name?: boolean }) => (
  <span className="inline-flex items-center gap-2 min-w-0 max-w-full">
    {b.logo && <img src={b.logo} alt="" loading="lazy" className={`${className} w-auto max-w-[64px] object-contain shrink-0`} style={invert ? { filter: "brightness(0) invert(1)" } : undefined} />}
    {(name || !b.logo) && <span className="font-black uppercase text-sm truncate text-carbon" style={{ fontFamily: UNB }}>{b.name}</span>}
  </span>
);

const Arrow = ({ dir, onClick, label, dark = true, disabled = false }: { dir: 1 | -1; onClick: () => void; label: string; dark?: boolean; disabled?: boolean }) => (
  <button type="button" aria-label={label} onClick={onClick} disabled={disabled}
    className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
    style={dark ? { background: CARBON, color: "#fff" } : { background: "#fff", color: CARBON, boxShadow: "0 2px 10px rgba(26,26,26,0.12)" }}>
    {dir < 0 ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
  </button>
);

/** Bande défilante avec flèches qui marchent à la souris (défilement doux) */
const useStrip = (view: string) => {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ prev: false, next: true });
  const update = () => {
    const el = ref.current; if (!el) return;
    setEdge({ prev: el.scrollLeft > 4, next: el.scrollLeft < el.scrollWidth - el.clientWidth - 4 });
  };
  const by = (d: 1 | -1) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.7, behavior: "smooth" });
  useEffect(() => {
    const row = ref.current;
    const el = row?.querySelector<HTMLElement>(`[data-brand="${CSS.escape(view)}"]`);
    if (row && el) row.scrollTo({ left: el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
    const t = window.setTimeout(update, 400);
    return () => window.clearTimeout(t);
  }, [view]);
  return { ref, edge, by, update };
};

const BrandExplorer = ({ look, brands, view, onChange }: Props) => {
  const i = Math.max(0, brands.findIndex((b) => b.name === view));
  const cur = brands[i];
  const prev = brands[(i - 1 + brands.length) % brands.length];
  const next = brands[(i + 1) % brands.length];
  const strip = useStrip(view);
  const [open, setOpen] = useState(false);
  if (!cur) return null;

  // 1 — PLAYER : la marque en cours au centre, marques voisines de chaque côté (comme un lecteur piste préc. / suiv.)
  if (look === 1) {
    return (
      <div className="mb-6">
        <div className="flex items-stretch gap-2 md:gap-3">
          <button type="button" onClick={() => onChange(prev.name)} className="group flex-1 min-w-0 hidden sm:flex items-center gap-3 rounded-2xl px-3 py-3 bg-white/60 hover:bg-white transition-colors text-left">
            <span className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center bg-carbon text-white"><ChevronLeft className="w-5 h-5" /></span>
            <span className="min-w-0"><span className="block text-sm text-gray-500">Marque précédente</span><span className="block h-6 opacity-60 group-hover:opacity-100"><Logo b={prev} className="h-6" /></span></span>
          </button>
          <div className="flex-[1.4] min-w-0 rounded-2xl bg-white shadow-md px-4 py-3 flex items-center gap-3">
            <Arrow dir={-1} label="Marque précédente" onClick={() => onChange(prev.name)} />
            <div className="flex-1 min-w-0 flex flex-col items-center justify-center">
              <div className="h-8 flex items-center"><Logo b={cur} className="h-8" /></div>
              <span className="text-sm text-gray-500 tabular-nums">{i + 1} / {brands.length} · {cur.n} modèle{cur.n > 1 ? "s" : ""}</span>
            </div>
            <Arrow dir={1} label="Marque suivante" onClick={() => onChange(next.name)} />
          </div>
          <button type="button" onClick={() => onChange(next.name)} className="group flex-1 min-w-0 hidden sm:flex items-center justify-end gap-3 rounded-2xl px-3 py-3 bg-white/60 hover:bg-white transition-colors text-right">
            <span className="min-w-0"><span className="block text-sm text-gray-500">Marque suivante</span><span className="flex justify-end h-6 opacity-60 group-hover:opacity-100"><Logo b={next} className="h-6" /></span></span>
            <span className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center bg-carbon text-white"><ChevronRight className="w-5 h-5" /></span>
          </button>
        </div>
        <div className="mt-3 h-1 rounded-full bg-carbon/10 overflow-hidden">
          <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${((i + 1) / brands.length) * 100}%`, background: GREEN }} />
        </div>
      </div>
    );
  }

  // 2 — LOGOS : bande de logos sur cartes blanches (gris au repos, couleur au survol / sélection)
  if (look === 2) {
    return (
      <div className="mb-6 flex items-center gap-3">
        <Arrow dir={-1} label="Marques précédentes" onClick={() => strip.by(-1)} disabled={!strip.edge.prev} />
        <div ref={strip.ref} onScroll={strip.update} className="flex-1 min-w-0 flex gap-2.5 overflow-x-auto snap-x py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {brands.map((b) => {
            const on = b.name === view;
            return (
              <button key={b.name} type="button" data-brand={b.name} onClick={() => onChange(b.name)} aria-pressed={on}
                className="group snap-start shrink-0 w-40 h-16 rounded-xl bg-white flex flex-col items-center justify-center gap-1 px-3 transition-all"
                style={on ? { boxShadow: `0 0 0 2px ${GREEN}, 0 8px 20px -10px rgba(26,26,26,0.35)` } : { boxShadow: "0 1px 4px rgba(26,26,26,0.08)" }}>
                <span className={`h-6 flex items-center max-w-full transition-all ${on ? "" : "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100"}`}><Logo b={b} className="h-5" /></span>
                <span className="text-sm leading-none" style={{ color: on ? GREEN : "#6B7280" }}>{b.n} modèle{b.n > 1 ? "s" : ""}</span>
              </button>
            );
          })}
        </div>
        <Arrow dir={1} label="Marques suivantes" onClick={() => strip.by(1)} disabled={!strip.edge.next} />
      </div>
    );
  }

  // 3 — ONGLETS : noms de marques en texte, soulignement vert épais, flèches aux deux bouts
  if (look === 3) {
    return (
      <div className="mb-6 flex items-center gap-2 border-b border-[#E2DCCF]">
        <Arrow dir={-1} label="Marques précédentes" onClick={() => strip.by(-1)} disabled={!strip.edge.prev} dark={false} />
        <div ref={strip.ref} onScroll={strip.update} className="flex-1 min-w-0 flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {brands.map((b) => {
            const on = b.name === view;
            return (
              <button key={b.name} type="button" data-brand={b.name} onClick={() => onChange(b.name)} aria-pressed={on}
                className="relative shrink-0 h-14 px-4 text-sm font-bold uppercase whitespace-nowrap transition-colors hover:text-carbon"
                style={{ fontFamily: FONT, color: on ? CARBON : "#8A8577" }}>
                {b.name}<sup className="ml-1 text-[11px] font-semibold" style={{ color: on ? GREEN : "#B0AA9C" }}>{b.n}</sup>
                <span className="absolute left-3 right-3 -bottom-px h-1 rounded-full transition-transform origin-left" style={{ background: GREEN, transform: on ? "scaleX(1)" : "scaleX(0)" }} />
              </button>
            );
          })}
        </div>
        <Arrow dir={1} label="Marques suivantes" onClick={() => strip.by(1)} disabled={!strip.edge.next} dark={false} />
      </div>
    );
  }

  // 4 — TOUTES LES MARQUES : marque en cours + précédente / suivante, et un bouton qui ouvre la grille des 50 logos
  if (look === 4) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Arrow dir={-1} label="Marque précédente" onClick={() => onChange(prev.name)} />
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
            className="flex-1 min-w-0 h-14 rounded-2xl bg-white shadow-md px-4 flex items-center gap-3 text-left hover:shadow-lg transition-shadow">
            <LayoutGrid className="w-5 h-5 text-gray-500 shrink-0 hidden sm:block" />
            <span className="h-7 flex items-center min-w-0"><Logo b={cur} className="h-6" /></span>
            <span className="hidden sm:inline text-sm text-gray-500 tabular-nums whitespace-nowrap">{cur.n} modèle{cur.n > 1 ? "s" : ""}</span>
            <span className="ml-auto text-sm font-bold uppercase flex items-center gap-1" style={{ fontFamily: FONT, color: GREEN }}>
              <span className="hidden sm:inline">Toutes les marques</span><ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </span>
          </button>
          <Arrow dir={1} label="Marque suivante" onClick={() => onChange(next.name)} />
        </div>
        {open && (
          <div className="mt-3 rounded-2xl bg-white shadow-xl p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold uppercase tracking-wider text-gray-500" style={{ fontFamily: FONT }}>{brands.length} marques</span>
              <button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[340px] overflow-y-auto">
              {brands.map((b) => {
                const on = b.name === view;
                return (
                  <button key={b.name} type="button" onClick={() => { onChange(b.name); setOpen(false); }}
                    className="h-16 rounded-xl flex flex-col items-center justify-center gap-1 px-2 transition-colors hover:bg-[#F5F0E8]"
                    style={on ? { background: "#EEF4F0", boxShadow: `inset 0 0 0 2px ${GREEN}` } : { background: "#FAFAF8" }}>
                    <span className="h-6 flex items-center max-w-full"><Logo b={b} className="h-5" /></span>
                    <span className="text-sm text-gray-500 leading-none">{b.n} modèle{b.n > 1 ? "s" : ""}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 5 — PELLICULE : vignettes photo (même esprit que la Vitrine de /trottinettes), logo en bas, flèches de part et d'autre
  return (
    <div className="mb-6 flex items-center gap-3">
      <Arrow dir={-1} label="Marques précédentes" onClick={() => strip.by(-1)} disabled={!strip.edge.prev} />
      <div ref={strip.ref} onScroll={strip.update} className="flex-1 min-w-0 flex gap-3 overflow-x-auto snap-x pt-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {brands.map((b) => {
          const on = b.name === view;
          return (
            <button key={b.name} type="button" data-brand={b.name} onClick={() => onChange(b.name)} aria-pressed={on}
              className="group relative snap-start shrink-0 w-28 h-28 mb-7 rounded-2xl bg-white transition-shadow"
              style={on ? { boxShadow: `0 0 0 2px ${GREEN}, 0 10px 24px -14px rgba(26,26,26,0.4)` } : { boxShadow: "0 2px 8px rgba(26,26,26,0.08)" }}>
              {b.img && <img src={optimizedImage(b.img, 200)} alt="" loading="lazy" draggable={false}
                className="absolute left-1/2 -top-5 h-24 w-auto max-w-[90%] -translate-x-1/2 -rotate-[12deg] object-contain transition-transform duration-300 group-hover:-rotate-3 group-hover:-translate-y-1"
                style={{ filter: "drop-shadow(0 8px 8px rgba(26,26,26,0.2))" }} />}
              <span className="absolute left-2 right-2 bottom-2 h-5 flex items-center justify-center"><Logo b={b} className="h-4" name={!b.logo} /></span><span className="absolute -bottom-6 left-0 right-0 text-center text-sm font-bold uppercase truncate" style={{ fontFamily: FONT, color: on ? GREEN : "#6B7280" }}>{b.name}</span>
            </button>
          );
        })}
      </div>
      <Arrow dir={1} label="Marques suivantes" onClick={() => strip.by(1)} disabled={!strip.edge.next} />
    </div>
  );
};

export default BrandExplorer;
