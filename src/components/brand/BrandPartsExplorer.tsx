/**
 * Page /marque/:slug — TOUTES les pièces compatibles de la marque (17/10/2026).
 * Avant : 8 « pièces les plus demandées » puis un renvoi au catalogue. Ici : la liste complète
 * (compatibilités ✅ de tous les modèles publiés de la marque), filtrable par catégorie,
 * par modèle et par recherche — même langage visuel que /catalogue et /categorie.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { classifyCompat } from "@/lib/compatibilityStatus";
import PartCard from "@/components/parts/PartCard";
import type { CataloguePart } from "@/hooks/useCatalogueData";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const CHAMFER = "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)";

interface Model { id: string; name: string; slug: string }
interface Props { brandName: string; models: Model[] }

type Row = { part: CataloguePart; models: Set<string> };

const Plate = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} aria-pressed={on}
    className="shrink-0 inline-flex items-center gap-2 h-11 pl-3.5 pr-4 text-sm font-extrabold whitespace-nowrap transition-colors"
    style={{ fontFamily: FONT, clipPath: CHAMFER, background: on ? CARBON : "#fff", color: on ? "#fff" : CARBON, boxShadow: on ? "none" : `inset 0 0 0 1px ${LINE}` }}>
    {children}
  </button>
);
const Num = ({ n, on }: { n: number; on: boolean }) => (
  <span style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, color: on ? "#9FD3AE" : GREEN }}>{n}</span>
);
const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500 mb-2" style={{ fontFamily: FONT }}>{children}</p>
);

const BrandPartsExplorer = ({ brandName, models }: Props) => {
  const ids = useMemo(() => models.map((m) => m.id), [models]);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["brand-all-parts", ids],
    enabled: ids.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Row[]> => {
      const byId = new Map<string, Row>();
      for (let i = 0; i < ids.length; i += 60) {
        const { data, error } = await supabase
          .from("part_compatibility")
          .select("scooter_model_id, confidence_level, suggestion_reason, parts(id, name, slug, price, image_url, images, stock_quantity, difficulty_level, technical_metadata, category_id, published, category:categories(id, name, icon, slug))")
          .in("scooter_model_id", ids.slice(i, i + 60));
        if (error) throw error;
        (data || []).forEach((r) => {
          if (classifyCompat(r) !== "verified") return;
          const p = (r as { parts?: unknown }).parts as (CataloguePart & { published?: boolean }) | null;
          if (!p || p.published === false) return;
          const row = byId.get(p.id) ?? { part: { ...p, description: null } as CataloguePart, models: new Set<string>() };
          row.models.add(r.scooter_model_id as string);
          byId.set(p.id, row);
        });
      }
      // Les pièces qui vont sur le plus de modèles de la marque d'abord.
      return [...byId.values()].sort((a, b) => b.models.size - a.models.size || a.part.name.localeCompare(b.part.name, "fr"));
    },
  });

  const [cat, setCat] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(12);
  useEffect(() => setVisible(12), [cat, model, q]);

  const pool = useMemo(() => (model ? rows.filter((r) => r.models.has(model)) : rows), [rows, model]);
  const cats = useMemo(() => {
    const m = new Map<string, { name: string; n: number }>();
    pool.forEach((r) => { const c = r.part.category; if (c) m.set(c.id, { name: c.name, n: (m.get(c.id)?.n ?? 0) + 1 }); });
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n);
  }, [pool]);
  const modelCounts = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => r.models.forEach((id) => m.set(id, (m.get(id) ?? 0) + 1)));
    return m;
  }, [rows]);

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/,/g, ".");
  const shown = useMemo(() => {
    let list = pool;
    if (cat) list = list.filter((r) => r.part.category?.id === cat);
    const nq = norm(q.trim());
    if (nq) list = list.filter((r) => norm(r.part.name).includes(nq));
    return list.map((r) => r.part);
  }, [pool, cat, q]);

  if (!isLoading && rows.length === 0) return null;
  const sortedModels = [...models].filter((m) => modelCounts.get(m.id)).sort((a, b) => (modelCounts.get(b.id) ?? 0) - (modelCounts.get(a.id) ?? 0));

  return (
    <section id="pieces" className="px-4 py-12 lg:px-8 lg:py-16 scroll-mt-20" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="mx-auto max-w-7xl">
        <div className="border-t-2 pt-6 flex items-end justify-between gap-4 flex-wrap" style={{ borderColor: CARBON }}>
          <h2 className="text-2xl lg:text-4xl uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: CARBON }}>
            Toutes les pièces {brandName}
          </h2>
          <span className="flex items-baseline gap-1.5" style={{ fontFamily: FONT }}>
            <span className="text-2xl md:text-3xl" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{isLoading ? "…" : shown.length}</span>
            <span className="text-sm font-bold uppercase tracking-wider text-gray-500">{shown.length === rows.length ? "pièces" : `sur ${rows.length}`}</span>
          </span>
        </div>
        <p className="mt-2 text-base text-[#374151] max-w-2xl" style={{ fontFamily: FONT }}>
          Uniquement des pièces vérifiées sur la cote de montage d'au moins un modèle {brandName}. Choisis ton modèle pour ne voir que les tiennes.
        </p>

        {sortedModels.length > 1 && (
          <div className="mt-5">
            <Label>Ton modèle</Label>
            <label className="relative block max-w-md">
              <select value={model ?? ""} onChange={(e) => { setModel(e.target.value || null); setCat(null); }}
                className="w-full appearance-none h-12 pl-4 pr-10 text-base font-bold outline-none focus:ring-2 focus:ring-green-600"
                style={{ fontFamily: FONT, clipPath: CHAMFER, background: model ? CARBON : "#fff", color: model ? "#fff" : CARBON, boxShadow: model ? "none" : `inset 0 0 0 1px ${LINE}` }}
                aria-label={`Choisir ton modèle ${brandName}`}>
                <option value="">Tous les modèles {brandName} ({sortedModels.length})</option>
                {sortedModels.map((m) => <option key={m.id} value={m.id}>{m.name} — {modelCounts.get(m.id)} pièces</option>)}
              </select>
              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${model ? "text-white/80" : "text-gray-500"}`} />
            </label>
          </div>
        )}

        {cats.length > 1 && (
          <div className="mt-5">
            <Label>Catégorie</Label>
            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap pb-1" style={{ scrollbarWidth: "none" }}>
              <Plate on={cat === null} onClick={() => setCat(null)}>Toutes <Num n={pool.length} on={cat === null} /></Plate>
              {cats.map(([id, c]) => <Plate key={id} on={cat === id} onClick={() => setCat(cat === id ? null : id)}>{c.name} <Num n={c.n} on={cat === id} /></Plate>)}
            </div>
          </div>
        )}

        <label className="mt-4 flex items-center gap-3 h-14 pl-4 pr-2 bg-white max-w-2xl" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Chercher une pièce ${brandName}…`}
            aria-label={`Chercher une pièce ${brandName}`} className="w-full h-full bg-transparent outline-none text-base text-carbon placeholder:text-gray-400" style={{ fontFamily: FONT }} />
          {q && <button type="button" onClick={() => setQ("")} aria-label="Effacer" className="w-10 h-10 flex items-center justify-center"><X className="w-4 h-4 text-gray-500" /></button>}
        </label>

        <div className="mt-6">
          {isLoading ? (
            <p className="py-8 text-base text-gray-500" style={{ fontFamily: FONT }}>Chargement des pièces…</p>
          ) : shown.length === 0 ? (
            <p className="py-8 text-base text-gray-600" style={{ fontFamily: FONT }}>Aucune pièce avec ces critères. <button type="button" onClick={() => { setQ(""); setCat(null); setModel(null); }} className="font-bold underline min-h-[44px]" style={{ color: CARBON }}>Tout réafficher</button></p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                {shown.slice(0, visible).map((p, i) => <PartCard key={p.id} part={p} index={i} />)}
              </div>
              {visible < shown.length && (
                <div className="mt-10 flex justify-center">
                  <button type="button" onClick={() => setVisible((v) => v + 12)} className="inline-flex items-center min-h-[48px] px-8 text-sm font-extrabold uppercase tracking-wider bg-white"
                    style={{ fontFamily: FONT, color: CARBON, clipPath: CHAMFER, boxShadow: `inset 0 0 0 1.5px ${CARBON}` }}>
                    Voir plus ({shown.length - visible} restantes)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default BrandPartsExplorer;
