/**
 * Corps de la page /categorie/:slug (17/10/2026) — même langage que /catalogue et /trottinettes
 * (plaques à coin coupé, Unbounded italique, filet vert).
 * 1. « Comment choisir » : 3 repères par catégorie (disques : diamètre / entraxe / trous…).
 * 2. Recherche dans la catégorie + filtre « Par marque de trottinette » (compatibilités ✅ en base)
 *    + filtre « Taille » lu dans le nom (140 mm, 10x2.50, 36 V…).
 * 3. Grille des pièces, filtrée.
 */
import { useSelectedCompatIds, compatFirst } from "@/hooks/useSelectedCompatIds";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import { classifyCompat } from "@/lib/compatibilityStatus";
import PartCard from "@/components/parts/PartCard";
import type { CataloguePart } from "@/hooks/useCatalogueData";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const CHAMFER = "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)";

// ─── Repères « comment choisir », par slug de catégorie ───
type Tip = { k: string; t: string };
const GUIDES: Record<string, { intro: string; tips: Tip[] }> = {
  disques: {
    intro: "Un disque se choisit sur trois cotes : si l'une ne correspond pas, il ne se monte pas ou frotte dans l'étrier.",
    tips: [
      { k: "Diamètre", t: "110 à 180 mm. Mesure ton disque d'un bord à l'autre, ou lis la valeur gravée dessus." },
      { k: "Entraxe", t: "La distance entre deux vis opposées de fixation (souvent 44 ou 48 mm)." },
      { k: "Nombre de trous", t: "5 ou 6 vis selon le moyeu : compte-les avant de commander." },
    ],
  },
  plaquettes: {
    intro: "Une plaquette dépend de l'étrier, pas de la trottinette : c'est la forme qui compte.",
    tips: [
      { k: "Forme", t: "Chaque étrier (Zoom, Nutt, Logan, Xtech…) a sa propre forme de plaquette." },
      { k: "Matière", t: "Organique : douce et silencieuse. Métal fritté : plus endurante, pour les machines puissantes." },
      { k: "Usure", t: "À changer quand il reste moins de 1 mm de garniture ou si le freinage siffle." },
    ],
  },
  pneus: {
    intro: "La taille est écrite sur le flanc de ton pneu : c'est elle qu'il faut retrouver ici.",
    tips: [
      { k: "Taille", t: "Ex. 10x2.50-6.5 ou 60/70-6.5 : les deux écritures désignent souvent le même pneu." },
      { k: "Jante", t: "Le chiffre après le tiret (6, 6.5, 7…) doit être celui de ta jante." },
      { k: "Usage", t: "Route : profil lisse. Chemins : profil offroad. Tubeless : sans chambre à air." },
    ],
  },
  "pneus-pleins": {
    intro: "Le pneu plein supprime les crevaisons, au prix d'un peu de confort.",
    tips: [
      { k: "Taille", t: "Même taille que ton pneu actuel : lis-la sur le flanc." },
      { k: "Jante", t: "Certaines trottinettes ont une demi-jante démontable : vérifie avant de passer au plein." },
      { k: "Confort", t: "Plus dur qu'un pneu gonflable : idéal en ville, moins sur les pavés." },
    ],
  },
  "chambres-a-air": {
    intro: "Une chambre à air se choisit sur la taille du pneu et la forme de la valve.",
    tips: [
      { k: "Taille", t: "Celle écrite sur le flanc du pneu (ex. 10x2.50 ou 8.5x2)." },
      { k: "Valve", t: "Droite, coudée 45° ou 90° : prends la même que l'actuelle pour passer dans la jante." },
      { k: "Renfort", t: "Une chambre renforcée limite les crevaisons sans passer au plein." },
    ],
  },
  chargeurs: {
    intro: "Un chargeur doit correspondre à la tension de ta batterie et à la prise de ta trottinette.",
    tips: [
      { k: "Tension", t: "Batterie 36 V → chargeur 42 V, 48 V → 54,6 V, 52 V → 58,8 V, 60 V → 67,2 V." },
      { k: "Prise", t: "RCA, GX16, DC 5.5, XLR… regarde la prise de charge de ta trottinette." },
      { k: "Ampérage", t: "2 A = charge standard. Plus d'ampères = plus rapide, si ta batterie l'accepte." },
    ],
  },
};

/** Taille lue dans le nom, selon la catégorie. */
const sizeOf = (slug: string, name: string): string | null => {
  if (slug === "disques") { const m = name.match(/(\d{3})\s?mm/i); return m ? `${m[1]} mm` : null; }
  if (slug === "chargeurs") { const m = name.match(/\b(\d{2})\s?V\b/); return m ? `${m[1]} V` : null; }
  if (["pneus", "pneus-pleins", "chambres-a-air"].includes(slug)) {
    const m = name.match(/\b(\d{1,3}(?:[.,]\d+)?)\s?([x×/])\s?(\d{1,3}(?:[.,]\d+)?)/i);
    return m ? `${m[1].replace(",", ".")}${m[2] === "/" ? "/" : "x"}${m[3].replace(",", ".")}` : null;
  }
  return null;
};
const sizeNum = (s: string) => parseFloat(s.replace(/[^\d.]/g, "")) || 0;

const Plate = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} aria-pressed={on}
    className="shrink-0 inline-flex items-center gap-2 h-11 pl-3.5 pr-4 text-sm font-extrabold transition-colors"
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

interface Props {
  slug: string;
  name: string;
  parts: CataloguePart[];
}

const CategoryExplorer = ({ slug, name, parts }: Props) => {
  const guide = GUIDES[slug];
  const ids = useMemo(() => parts.map((p) => p.id), [parts]);

  // 17/10 (retour Nolan) : filtrer par MARQUE mélange des modèles de tailles différentes
  // (« Xiaomi 19 » = 8,5" + 10" + 10x2.50…) et se lit comme « pièces de marque Xiaomi ».
  // On filtre donc par MODÈLE exact : marque → modèle → seules ses pièces (compatibilités ✅).
  type ModelInfo = { name: string; slug: string; brand: string; brandName: string; parts: Set<string> };
  const { data: modelMap = {} } = useQuery({
    queryKey: ["category-model-map", slug, ids.length],
    enabled: ids.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const out: Record<string, ModelInfo> = {};
      for (let i = 0; i < ids.length; i += 150) {
        const { data } = await supabase
          .from("part_compatibility")
          .select("part_id, confidence_level, suggestion_reason, scooter_models(id, name, slug, brands!scooter_models_brand_id_fkey(name, slug))")
          .in("part_id", ids.slice(i, i + 150));
        (data || []).forEach((r) => {
          if (classifyCompat(r) !== "verified") return;
          const m = r.scooter_models as unknown as { id: string; name: string; slug: string; brands: { name: string; slug: string } | null } | null;
          if (!m || !m.brands) return;
          (out[m.id] ??= { name: m.name, slug: m.slug, brand: m.brands.slug, brandName: m.brands.name, parts: new Set() }).parts.add(r.part_id as string);
        });
      }
      return out;
    },
  });
  const { selectedScooter } = useSelectedScooter();

  const [q, setQ] = useState("");
  const [brand, setBrand] = useState<string | null>(null); // marque ouverte (étape 1), ne filtre pas
  const [model, setModel] = useState<string | null>(null); // modèle choisi (étape 2), filtre
  const [size, setSize] = useState<string | null>(null);
  const [allBrands, setAllBrands] = useState(false);
  const [visible, setVisible] = useState(12);
  useEffect(() => { setQ(""); setBrand(null); setModel(null); setSize(null); setVisible(12); }, [slug]);
  useEffect(() => setVisible(12), [q, model, size]);
  // Trottinette du garage / sélecteur : présélectionnée si elle a des pièces ici.
  useEffect(() => { if (selectedScooter && modelMap[selectedScooter.id] && !model) { setModel(selectedScooter.id); setBrand(modelMap[selectedScooter.id].brand); } }, [selectedScooter, modelMap]); // eslint-disable-line react-hooks/exhaustive-deps

  const brands = useMemo(() => {
    const m = new Map<string, { name: string; models: number }>();
    Object.values(modelMap).forEach((mi) => m.set(mi.brand, { name: mi.brandName, models: (m.get(mi.brand)?.models ?? 0) + 1 }));
    return [...m.entries()].map(([s2, v]) => ({ slug: s2, name: v.name, n: v.models })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, "fr"));
  }, [modelMap]);
  const brandModels = useMemo(() => Object.entries(modelMap).filter(([, mi]) => mi.brand === brand).map(([id, mi]) => ({ id, ...mi })).sort((a, b) => a.name.localeCompare(b.name, "fr")), [modelMap, brand]);
  const sizes = useMemo(() => {
    const m = new Map<string, number>();
    // Tailles du modèle choisi seulement (sinon on proposerait des tailles qui ne vont pas sur sa trottinette).
    const base = model && modelMap[model] ? parts.filter((p) => modelMap[model].parts.has(p.id)) : parts;
    base.forEach((p) => { const s = sizeOf(slug, p.name); if (s) m.set(s, (m.get(s) ?? 0) + 1); });
    return [...m.entries()].sort((a, b) => sizeNum(a[0]) - sizeNum(b[0]));
  }, [parts, slug, model, modelMap]);

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/,/g, ".");
  const compatIds = useSelectedCompatIds();
  const shown = useMemo(() => {
    let list = parts;
    if (model && modelMap[model]) list = list.filter((p) => modelMap[model].parts.has(p.id));
    if (size) list = list.filter((p) => sizeOf(slug, p.name) === size);
    const nq = norm(q.trim());
    if (nq) list = list.filter((p) => norm(p.name).includes(nq));
    return model ? list : compatFirst(list, compatIds, (p) => p.id);
  }, [parts, model, modelMap, size, q, slug, compatIds]);

  const brandList = allBrands ? brands : brands.slice(0, 10);

  return (
    <>
      {guide && (
        <section className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-8">
          <div className="border-t-2 pt-6 grid lg:grid-cols-[300px_1fr] gap-4 lg:gap-10" style={{ borderColor: CARBON }}>
            <div>
              <h2 className="text-xl lg:text-2xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>Comment choisir</h2>
              <p className="mt-2 text-base text-[#374151] leading-relaxed" style={{ fontFamily: FONT }}>{guide.intro}</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              {guide.tips.map((t, i) => (
                <div key={t.k} className="relative bg-white p-4 overflow-hidden" style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` }}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm" style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, color: GREEN }}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-base uppercase" style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, color: CARBON }}>{t.k}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-[#374151] leading-relaxed" style={{ fontFamily: FONT }}>{t.t}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-6" id="cat-parts">
        <div className="border-t-2 pt-6" style={{ borderColor: CARBON }}>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h2 className="text-xl lg:text-2xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>Tous les {name.toLowerCase()}</h2>
            <span className="flex items-baseline gap-1.5" style={{ fontFamily: FONT }}>
              <span className="text-2xl md:text-3xl" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{shown.length}</span>
              <span className="text-sm font-bold uppercase tracking-wider text-gray-500">{shown.length === parts.length ? "références" : `sur ${parts.length}`}</span>
            </span>
          </div>

          <label className="mt-4 flex items-center gap-3 h-14 pl-4 pr-2 bg-white max-w-2xl" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Chercher dans les ${name.toLowerCase()}…`}
              aria-label={`Chercher dans les ${name}`} className="w-full h-full bg-transparent outline-none text-base text-carbon placeholder:text-gray-400" style={{ fontFamily: FONT }} />
            {q && <button type="button" onClick={() => setQ("")} aria-label="Effacer" className="w-10 h-10 flex items-center justify-center"><X className="w-4 h-4 text-gray-500" /></button>}
          </label>

          {brands.length > 0 && (
            <div className="mt-5">
              <Label>Ta trottinette</Label>
              {model && modelMap[model] ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Plate on onClick={() => { setModel(null); setSize(null); }}>{modelMap[model].brandName} {modelMap[model].name.replace(new RegExp(`^${modelMap[model].brandName}\\s+`, "i"), "")} <Num n={modelMap[model].parts.size} on /> <X className="w-4 h-4" /></Plate>
                  <span className="text-sm text-gray-600" style={{ fontFamily: FONT }}>Seules les pièces vérifiées pour ce modèle sont affichées.</span>
                </div>
              ) : brand ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setBrand(null)} className="inline-flex items-center gap-1 h-11 pl-2 pr-3 text-sm font-bold" style={{ fontFamily: FONT, color: CARBON }}><ChevronLeft className="w-4 h-4" />{brands.find((x) => x.slug === brand)?.name}</button>
                    {brandModels.map((m) => (
                      <Plate key={m.id} on={false} onClick={() => { setModel(m.id); setSize(null); }}>{m.name.replace(new RegExp(`^${m.brandName}\\s+`, "i"), "")} <Num n={m.parts.size} on={false} /></Plate>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-600" style={{ fontFamily: FONT }}>Choisis ton modèle : chaque modèle a ses propres tailles.</p>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {brandList.map((b) => (
                      <Plate key={b.slug} on={false} onClick={() => setBrand(b.slug)}>{b.name} <span className="text-sm font-semibold text-gray-500">{b.n} modèle{b.n > 1 ? "s" : ""}</span></Plate>
                    ))}
                    {brands.length > 10 && (
                      <button type="button" onClick={() => setAllBrands(!allBrands)} className="h-11 px-3 text-sm font-bold underline" style={{ fontFamily: FONT, color: CARBON }}>
                        {allBrands ? "Moins" : `+ ${brands.length - 10} marques`}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600" style={{ fontFamily: FONT }}>Choisis ta marque, puis ton modèle.</p>
                </>
              )}
            </div>
          )}

          {(sizes.length > 1 || (size && sizes.length > 0)) && (
            <div className="mt-5">
              <Label>Par taille</Label>
              <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap pb-1" style={{ scrollbarWidth: "none" }}>
                {sizes.map(([s, n]) => (
                  <Plate key={s} on={size === s} onClick={() => setSize(size === s ? null : s)}>{s} <Num n={n} on={size === s} /></Plate>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-20">
        {shown.length === 0 ? (
          <p className="py-10 text-base text-gray-600" style={{ fontFamily: FONT }}>Aucune pièce avec ces critères. <button type="button" onClick={() => { setQ(""); setBrand(null); setModel(null); setSize(null); }} className="font-bold underline min-h-[44px]" style={{ color: CARBON }}>Tout réafficher</button></p>
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
      </section>
    </>
  );
};

export default CategoryExplorer;
