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
import { Search, X, ChevronLeft, ChevronDown, SlidersHorizontal } from "lucide-react";
import { inchOfSize, inchLabel } from "@/lib/tireSize";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import { readPickerLook } from "@/components/catalogue/ScooterPicker";
import { classifyCompat } from "@/lib/compatibilityStatus";
import PartCard from "@/components/parts/PartCard";
import FamilyGrid, { FamilySortBar, readFamillesLook } from "@/components/category/FamilyGrid";
import { groupFamilies, sortFamilies, type FamilySort } from "@/lib/partFamilies";
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
    // 31/10 : 10x3 = 10x3.0, 10x2.5 = 10x2.50 → une seule pastille (nombres comparés, pas le texte).
    // « 4.10/3.50 » reste tel quel ; en « AxB » : 10x3.0 → 10x3, 14x2.5 → 14x2.50 (écriture des flancs).
    if (!m) return null;
    const a = m[1].replace(",", "."), b = m[3].replace(",", ".");
    if (m[2] === "/") return `${a}/${b}`;
    const bb = String(parseFloat(b));
    return `${parseFloat(a)}x${/\.\d$/.test(bb) ? `${bb}0` : bb}`;
  }
  return null;
};
const sizeNum = (s: string) => parseFloat(s.replace(/[^\d.]/g, "")) || 0;
const TIRE_SLUGS = ["pneus", "pneus-pleins", "chambres-a-air"];
/** Diamètre de roue (pouces, au demi) d'une pièce pneu/chambre, lu dans son nom (24/10 : regrouper les ~70 tailles). */
const inchOfPart = (name: string): number | null => {
  const n = name.replace(/,/g, ".");
  const metric = n.match(/\b(\d{2,3})\/(\d{2})\s*-\s*(\d+(?:\.\d+)?)/);
  if (metric) return inchOfSize(`${metric[1]}/${metric[2]}`, metric[3]);
  const m = n.match(/\b(\d{1,3}(?:\.\d+)?)\s?[x×]\s?(\d{1,3}(?:\.\d+)?)/i);
  if (m) return inchOfSize(`${m[1]}x${m[2]}`, "");
  return null;
};
/** 31/10 : 5 nouvelles zones de filtres (?zone=1..5) ; sans paramètre = rendu actuel. */
const readZoneLook = (): number => {
  try {
    const n = Number(new URLSearchParams(window.location.search).get("zone"));
    return n >= 1 && n <= 5 ? n : 0;
  } catch {
    return 0;
  }
};
/** 24/10 : 5 compositions de la zone de filtres (?filtres=1..5) ; sans paramètre = rendu actuel. */
const readFiltresVariant = (): number => {
  try {
    const n = Number(new URLSearchParams(window.location.search).get("filtres"));
    return n >= 1 && n <= 5 ? n : 0;
  } catch {
    return 0;
  }
};

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
  const { selectedScooter, setSelectedScooter, clearSelection, allScooters } = useSelectedScooter();
  const pickerOn = typeof window !== "undefined" && readPickerLook(new URLSearchParams(window.location.search)) !== null;

  const [q, setQ] = useState("");
  const [brand, setBrand] = useState<string | null>(null); // marque ouverte (étape 1), ne filtre pas
  const [model, setModel] = useState<string | null>(null); // modèle choisi (étape 2), filtre
  const [size, setSize] = useState<string | null>(null);
  const [allBrands, setAllBrands] = useState(false);
  const [variant] = useState(readFiltresVariant);
  const [zoneLook] = useState(readZoneLook);
  const [inch, setInch] = useState<number | null>(null);
  const [moreSizes, setMoreSizes] = useState(false);
  const [tab, setTab] = useState<"trott" | "taille">("taille");
  const [pop, setPop] = useState<null | "trott" | "taille">(null);
  const [visible, setVisible] = useState(12);
  useEffect(() => { setQ(""); setBrand(null); setModel(null); setSize(null); setInch(null); setMoreSizes(false); setVisible(12); }, [slug]);
  useEffect(() => setVisible(12), [q, model, size]);
  // 24/10 (sélecteur de trott) : le modèle choisi ici devient LA trottinette du site (gardée sur /catalogue et partout).
  useEffect(() => {
    if (!pickerOn || !model || selectedScooter?.id === model) return;
    const s = allScooters.find((x) => x.id === model);
    if (s) setSelectedScooter({ id: s.id, name: s.name, slug: s.slug, brandName: s.brandName, imageUrl: s.imageUrl });
  }, [model, allScooters]); // eslint-disable-line react-hooks/exhaustive-deps
  // Trottinette du garage / sélecteur : présélectionnée si elle a des pièces ici.
  // 25/10 (Nolan : « problème entre la sélection des trottinettes en haut et en bas ») : UNE seule sélection.
  // La trott du site (en-tête) pilote le choix d'ici : changée en haut → suivie ici ; retirée en haut → retirée ici.
  useEffect(() => {
    if (selectedScooter && modelMap[selectedScooter.id]) { if (model !== selectedScooter.id) { setModel(selectedScooter.id); setBrand(modelMap[selectedScooter.id].brand); } }
    else if (!selectedScooter && model) { setModel(null); setBrand(null); setSize(null); }
  }, [selectedScooter?.id, modelMap]); // eslint-disable-line react-hooks/exhaustive-deps
  /** Retirer la trott ici la retire aussi en haut (badges, tri « compatibles d'abord », icône de l'en-tête). */
  const clearTrott = () => { setModel(null); setBrand(null); setSize(null); setInch(null); if (pickerOn) clearSelection(); };

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

  const isTire = TIRE_SLUGS.includes(slug);
  /** Taille → diamètre ; diamètres présents (pneus / chambres / pleins seulement). */
  const sizeInch = useMemo(() => {
    const m = new Map<string, number | null>();
    if (!isTire) return m;
    parts.forEach((p) => { const sz = sizeOf(slug, p.name); if (sz && !m.has(sz)) m.set(sz, inchOfPart(p.name)); });
    return m;
  }, [parts, slug, isTire]);
  const inches = useMemo(() => {
    const c = new Map<number, number>();
    sizes.forEach(([sz, n]) => { const i = sizeInch.get(sz); if (i != null && i >= 6 && i <= 14) c.set(i, (c.get(i) ?? 0) + n); });
    return [...c.entries()].sort((a, b) => a[0] - b[0]);
  }, [sizes, sizeInch]);
  const sizesByCount = useMemo(() => [...sizes].sort((a, b) => b[1] - a[1]), [sizes]);
  const sizesOfInch = inch == null ? sizesByCount : sizesByCount.filter(([sz]) => sizeInch.get(sz) === inch);

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

  // 31/10 : une carte par FAMILLE (taille + jante), valves et gammes dedans — ?familles=1..5, chambres à air d'abord.
  const [famLook] = useState(readFamillesLook);
  const [famSort, setFamSort] = useState<FamilySort>("reco");
  const families = useMemo(
    () => (famLook && slug === "chambres-a-air" ? sortFamilies(groupFamilies(shown), famSort, model ? null : compatIds) : null),
    [famLook, slug, shown, famSort, compatIds, model],
  );


  /* ─── Zone de filtres : rendu d'origine (0) et 5 compositions (?filtres=1..5), 24/10 ─── */
  const origTrott = (
    <>
          {brands.length > 0 && (
            <div className="mt-5">
              <Label>Ta trottinette</Label>
              {model && modelMap[model] ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Plate on onClick={clearTrott}>{modelMap[model].brandName} {modelMap[model].name.replace(new RegExp(`^${modelMap[model].brandName}\\s+`, "i"), "")} <Num n={modelMap[model].parts.size} on /> <X className="w-4 h-4" /></Plate>
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

    </>
  );
  const origSize = (
    <>
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
    </>
  );
  const chosenModel = model && modelMap[model] ? modelMap[model] : null;
  const modelLabel = chosenModel ? `${chosenModel.brandName} ${chosenModel.name.replace(new RegExp(`^${chosenModel.brandName}\\s+`, "i"), "")}` : null;
  /** Choix marque → modèle compact, en deux listes déroulantes natives (lisible au pouce, 0 pastille). */
  const trottSelects = (
    <div className="flex flex-wrap items-center gap-2">
      <select value={brand ?? ""} onChange={(e) => { setBrand(e.target.value || null); setModel(null); setSize(null); }} aria-label="Marque de ta trottinette"
        className="h-11 pl-3 pr-8 text-sm font-bold bg-white" style={{ fontFamily: FONT, color: CARBON, clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
        <option value="">Marque…</option>
        {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name} ({b.n})</option>)}
      </select>
      <select value={model ?? ""} disabled={!brand} onChange={(e) => { setModel(e.target.value || null); setSize(null); setInch(null); }} aria-label="Modèle de ta trottinette"
        className="h-11 pl-3 pr-8 text-sm font-bold bg-white disabled:opacity-50" style={{ fontFamily: FONT, color: CARBON, clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
        <option value="">Modèle…</option>
        {brandModels.map((m) => <option key={m.id} value={m.id}>{m.name.replace(new RegExp(`^${m.brandName}\\s+`, "i"), "")} ({m.parts.size})</option>)}
      </select>
      {chosenModel && <button type="button" onClick={clearTrott} className="h-11 px-2 text-sm font-bold underline" style={{ fontFamily: FONT, color: CARBON }}>Effacer</button>}
    </div>
  );
  const inchRow = inches.length > 1 && (
    <div className="flex flex-wrap gap-2">
      {inches.map(([i, n]) => (
        <button key={i} type="button" onClick={() => { setInch(inch === i ? null : i); setSize(null); setMoreSizes(false); }} aria-pressed={inch === i}
          className="min-w-[64px] h-14 px-3 flex flex-col items-center justify-center leading-none"
          style={{ fontFamily: FONT, clipPath: CHAMFER, background: inch === i ? CARBON : "#fff", color: inch === i ? "#fff" : CARBON, boxShadow: inch === i ? "none" : `inset 0 0 0 1px ${LINE}` }}>
          <span className="text-lg font-extrabold">{inchLabel(i)}</span>
          <span className="text-sm mt-1 opacity-70">{n} réf.</span>
        </button>
      ))}
    </div>
  );
  const sizeChips = (list: [string, number][], limit: number) => (
    <div className="flex flex-wrap gap-2">
      {(moreSizes ? list : list.slice(0, limit)).map(([sz, n]) => (
        <Plate key={sz} on={size === sz} onClick={() => setSize(size === sz ? null : sz)}>{sz} <Num n={n} on={size === sz} /></Plate>
      ))}
      {list.length > limit && !moreSizes && (
        <button type="button" onClick={() => setMoreSizes(true)} className="h-11 px-3 text-sm font-bold underline" style={{ fontFamily: FONT, color: CARBON }}>+ {list.length - limit} tailles</button>
      )}
    </div>
  );
  const hint = (t: string) => <p className="mt-2 text-sm text-gray-600" style={{ fontFamily: FONT }}>{t}</p>;
  const showSizes = sizes.length > 1 || (size && sizes.length > 0);

  let filtersZone: React.ReactNode;
  if (variant === 0) {
    filtersZone = <>{origTrott}{origSize}</>;
  } else if (variant === 1) {
    // 1 · Repassé : mêmes blocs, la liste des tailles réduite aux 8 plus vendues (+ le reste replié), 6 marques.
    filtersZone = (
      <>
        {brands.length > 0 && <div className="mt-5"><Label>Ta trottinette</Label>{trottSelects}</div>}
        {showSizes && <div className="mt-5"><Label>Les tailles les plus demandées</Label>{sizeChips(sizesByCount, 8)}</div>}
      </>
    );
  } else if (variant === 2) {
    // 2 · Diamètre d'abord : la roue, puis la taille exacte (pneus / chambres / pleins) ; sinon tailles directes.
    filtersZone = (
      <>
        {showSizes && (
          <div className="mt-5">
            <Label>{isTire && inches.length > 1 ? "1 · Ta roue fait" : "Taille"}</Label>
            {isTire && inches.length > 1 ? (
              <>
                {inchRow}
                <div className="mt-4"><Label>2 · Ce qui est écrit sur le flanc</Label>{inch == null ? hint("Choisis d'abord le diamètre de ta roue.") : sizeChips(sizesOfInch, 8)}</div>
              </>
            ) : sizeChips(sizesByCount, 10)}
          </div>
        )}
        {brands.length > 0 && <div className="mt-5"><Label>Ou par ta trottinette</Label>{trottSelects}</div>}
      </>
    );
  } else if (variant === 3) {
    // 3 · Onglets : un seul chemin ouvert à la fois.
    filtersZone = (
      <div className="mt-5">
        <div className="flex gap-1.5">
          {([["taille", "Par taille"], ["trott", "Par ma trottinette"]] as const).filter(([k]) => k === "trott" ? brands.length > 0 : showSizes).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k}
              className="h-11 px-4 text-sm font-extrabold uppercase tracking-[0.06em]"
              style={{ fontFamily: FONT, clipPath: CHAMFER, background: tab === k ? CARBON : "#fff", color: tab === k ? "#fff" : CARBON, boxShadow: tab === k ? "none" : `inset 0 0 0 1px ${LINE}` }}>{l}</button>
          ))}
        </div>
        <div className="mt-3 p-4 bg-white" style={{ boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)" }}>
          {tab === "trott" ? <>{trottSelects}{hint("Seules les pièces vérifiées pour ton modèle restent affichées.")}</> : (
            isTire && inches.length > 1 ? <>{inchRow}{inch != null && <div className="mt-3">{sizeChips(sizesOfInch, 10)}</div>}</> : sizeChips(sizesByCount, 10)
          )}
        </div>
      </div>
    );
  } else if (variant === 4) {
    // 4 · Barre de filtres : deux boutons déroulants, comme la page Trottinettes (PUISSANCE ▾…).
    const btn = (k: "trott" | "taille", label: string, value: string | null) => (
      <button type="button" onClick={() => setPop(pop === k ? null : k)} aria-expanded={pop === k}
        className="inline-flex items-center gap-2 h-11 pl-3.5 pr-3 text-sm font-extrabold uppercase tracking-[0.04em] max-w-[260px]"
        style={{ fontFamily: FONT, clipPath: CHAMFER, background: value ? CARBON : "#fff", color: value ? "#fff" : CARBON, boxShadow: value ? "none" : `inset 0 0 0 1px ${LINE}` }}>
        <span className="truncate">{value ?? label}</span><ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${pop === k ? "rotate-180" : ""}`} />
      </button>
    );
    filtersZone = (
      <div className="mt-5">
        <div className="flex flex-wrap gap-2">
          {brands.length > 0 && btn("trott", "Ma trottinette", modelLabel)}
          {showSizes && btn("taille", "Taille", size ?? (inch != null ? inchLabel(inch) : null))}
          {(model || size || inch != null) && <button type="button" onClick={clearTrott} className="h-11 px-2 text-sm font-bold underline" style={{ fontFamily: FONT, color: CARBON }}>Tout effacer</button>}
        </div>
        {pop && (
          <div className="mt-2 p-4 bg-white max-w-3xl" style={{ boxShadow: `inset 0 0 0 1px ${LINE}, 0 12px 30px rgba(0,0,0,0.08)` }}>
            {pop === "trott" ? trottSelects : isTire && inches.length > 1 ? <>{inchRow}<div className="mt-3">{sizeChips(sizesOfInch, 10)}</div></> : sizeChips(sizesByCount, 12)}
          </div>
        )}
      </div>
    );
  } else {
    // 5 · Carte « Flanc » : une seule question mise en avant, la trottinette en ligne secondaire.
    filtersZone = (
      <div className="mt-5 p-4 md:p-5" style={{ background: CARBON, clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)" }}>
        <p className="text-lg md:text-xl uppercase text-white" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>{isTire ? "Quelle taille est écrite sur ton pneu ?" : "Ta taille"}</p>
        {isTire && inches.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {inches.map(([i]) => (
              <button key={i} type="button" onClick={() => { setInch(inch === i ? null : i); setSize(null); setMoreSizes(false); }} aria-pressed={inch === i}
                className="min-w-[56px] h-11 px-3 text-base font-extrabold" style={{ fontFamily: FONT, clipPath: CHAMFER, background: inch === i ? GREEN : "#2A2A2A", color: "#fff" }}>{inchLabel(i)}</button>
            ))}
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(moreSizes ? sizesOfInch : sizesOfInch.slice(0, 6)).map(([sz, n]) => (
            <button key={sz} type="button" onClick={() => setSize(size === sz ? null : sz)} aria-pressed={size === sz}
              className="min-h-[60px] px-3 py-2 text-left" style={{ clipPath: CHAMFER, background: size === sz ? GREEN : "#2A2A2A", color: "#F5F0E8" }}>
              <span className="block text-base font-extrabold tracking-[0.08em]" style={{ fontFamily: FONT }}>{sz}</span>
              <span className="block text-sm text-white/60" style={{ fontFamily: FONT }}>{n} réf.</span>
            </button>
          ))}
        </div>
        {sizesOfInch.length > 6 && !moreSizes && <button type="button" onClick={() => setMoreSizes(true)} className="mt-2 h-11 text-sm font-bold text-white underline" style={{ fontFamily: FONT }}>+ {sizesOfInch.length - 6} tailles</button>}
        {brands.length > 0 && (
          <div className="mt-4 pt-4 flex flex-wrap items-center gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <span className="text-sm font-bold text-white/80" style={{ fontFamily: FONT }}>Ou ta trottinette :</span>
            {trottSelects}
          </div>
        )}
      </div>
    );
  }

  /* ─── 31/10 (Nolan : « trop de cases, on le met à la fin peut-être, et plus joli ») : 5 propositions ?zone=1..5 ─── */
  let bottomZone: React.ReactNode = null;
  const sizeLabel = size ?? (inch != null ? inchLabel(inch) : null);
  const activeCount = (model ? 1 : 0) + (size || inch != null ? 1 : 0);
  const sizePanel = isTire && inches.length > 1
    ? <>{inchRow}{inch != null && <div className="mt-3">{sizeChips(sizesOfInch, 12)}</div>}{inch == null && hint("Choisis d'abord le diamètre de ta roue.")}</>
    : sizeChips(sizesByCount, 12);
  const clearAll = () => { clearTrott(); setSize(null); setInch(null); };
  const ClearLink = () => (activeCount ? <button type="button" onClick={clearAll} className="h-11 px-2 text-sm font-bold underline" style={{ fontFamily: FONT, color: CARBON }}>Tout effacer</button> : null);
  if (zoneLook === 1) {
    // 1 · EN BAS (littéral) : rien au-dessus de la grille sauf la recherche ; les filtres arrivent après la liste.
    filtersZone = (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {activeCount ? <Plate on onClick={clearAll}>{[modelLabel, sizeLabel].filter(Boolean).join(" · ")} <X className="w-4 h-4" /></Plate> : null}
        <a href="#cat-filtres-bas" className="inline-flex items-center min-h-[44px] text-sm font-bold underline" style={{ fontFamily: FONT, color: CARBON }}>Filtrer par ta trottinette ou ta taille ↓</a>
      </div>
    );
    bottomZone = (
      <section id="cat-filtres-bas" className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-20">
        <div className="border-t-2 pt-6" style={{ borderColor: CARBON }}>
          <h2 className="text-xl lg:text-2xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>Pas trouvé ?</h2>
          <div className="mt-4 grid lg:grid-cols-2 gap-6">
            {brands.length > 0 && <div><Label>Ta trottinette</Label>{trottSelects}</div>}
            {showSizes && <div><Label>Ta taille</Label>{sizePanel}</div>}
          </div>
        </div>
      </section>
    );
  } else if (zoneLook === 2) {
    // 2 · DEUX BOUTONS : une seule ligne « Ma trottinette ▾ · Taille ▾ », le détail s'ouvre au toucher.
    const btn = (k: "trott" | "taille", label: string, value: string | null) => (
      <button type="button" onClick={() => setPop(pop === k ? null : k)} aria-expanded={pop === k}
        className="inline-flex items-center gap-2 h-12 pl-4 pr-3 text-sm font-extrabold max-w-[280px]"
        style={{ fontFamily: FONT, clipPath: CHAMFER, background: value ? CARBON : "#fff", color: value ? "#fff" : CARBON, boxShadow: value ? "none" : `inset 0 0 0 1px ${LINE}` }}>
        <span className="truncate">{value ?? label}</span><ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${pop === k ? "rotate-180" : ""}`} />
      </button>
    );
    filtersZone = (
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          {brands.length > 0 && btn("trott", "Ma trottinette", modelLabel)}
          {showSizes && btn("taille", "Taille", sizeLabel)}
          <ClearLink />
        </div>
        {pop && <div className="mt-2 p-4 bg-white max-w-3xl" style={{ boxShadow: `inset 0 0 0 1px ${LINE}, 0 12px 30px rgba(0,0,0,0.08)` }}>{pop === "trott" ? trottSelects : sizePanel}</div>}
      </div>
    );
  } else if (zoneLook === 3) {
    // 3 · ROUES : les diamètres dessinés en roue (8", 10", 11"…), la taille exacte n'apparaît qu'après.
    const wheels = isTire && inches.length > 1 ? inches : [];
    filtersZone = (
      <div className="mt-5">
        {wheels.length > 0 && (
          <>
            <Label>Ta roue</Label>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1" style={{ scrollbarWidth: "none" }}>
              {wheels.map(([i, n]) => {
                const on = inch === i; const d = 40 + Math.min(i, 14) * 2.2;
                return (
                  <button key={i} type="button" onClick={() => { setInch(on ? null : i); setSize(null); }} aria-pressed={on} className="shrink-0 flex flex-col items-center justify-end w-[68px] h-[96px]">
                    <span className="rounded-full flex items-center justify-center" style={{ width: d, height: d, border: `${on ? 7 : 6}px solid ${on ? GREEN : CARBON}`, background: "#fff" }} />
                    <span className="mt-1 text-sm font-extrabold" style={{ fontFamily: FONT, color: on ? GREEN : CARBON }}>{inchLabel(i)}</span>
                    <span className="text-[13px] text-gray-500" style={{ fontFamily: FONT }}>{n} réf.</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
        {inch != null && <div className="mt-3">{sizeChips(sizesOfInch, 12)}</div>}
        {wheels.length === 0 && showSizes && sizeChips(sizesByCount, 8)}
        {brands.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-gray-600" style={{ fontFamily: FONT }}>Ou ta trottinette :</span>{trottSelects}
          </div>
        )}
      </div>
    );
  } else if (zoneLook === 4) {
    // 4 · FILTRER : un seul bouton, tout le détail dans une fenêtre qui monte du bas.
    filtersZone = (
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setPop("trott")} className="inline-flex items-center gap-2 h-12 px-4 text-sm font-extrabold"
          style={{ fontFamily: FONT, clipPath: CHAMFER, background: activeCount ? CARBON : "#fff", color: activeCount ? "#fff" : CARBON, boxShadow: activeCount ? "none" : `inset 0 0 0 1px ${LINE}` }}>
          <SlidersHorizontal className="w-4 h-4" /> Filtrer{activeCount ? ` · ${activeCount}` : ""}
        </button>
        {activeCount ? <span className="text-sm font-bold" style={{ fontFamily: FONT, color: CARBON }}>{[modelLabel, sizeLabel].filter(Boolean).join(" · ")}</span> : <span className="text-sm text-gray-600" style={{ fontFamily: FONT }}>par ta trottinette ou ta taille</span>}
        <ClearLink />
        {pop && (
          <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center" role="dialog" aria-modal aria-label="Filtrer">
            <button type="button" aria-label="Fermer" onClick={() => setPop(null)} className="absolute inset-0 bg-black/40" />
            <div className="relative w-full md:max-w-xl bg-[#FAFAF8] max-h-[85vh] overflow-y-auto rounded-t-2xl md:rounded-2xl p-5 pb-8">
              <div className="flex items-center justify-between"><p className="text-lg uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Filtrer</p>
                <button type="button" onClick={() => setPop(null)} aria-label="Fermer" className="w-11 h-11 flex items-center justify-center"><X className="w-5 h-5" /></button></div>
              {brands.length > 0 && <div className="mt-3"><Label>Ta trottinette</Label>{trottSelects}</div>}
              {showSizes && <div className="mt-5"><Label>Ta taille</Label>{sizePanel}</div>}
              <button type="button" onClick={() => setPop(null)} className="mt-6 w-full min-h-[48px] text-sm font-extrabold uppercase tracking-wider text-white" style={{ fontFamily: FONT, background: CARBON, clipPath: CHAMFER }}>{families ? `Voir les ${families.length} tailles` : `Voir les ${shown.length} résultats`}</button>
            </div>
          </div>
        )}
      </div>
    );
  } else if (zoneLook === 5) {
    // 5 · PHRASE : « Je cherche pour ma [marque] [modèle] · ou en taille [ ] » sur une ligne, en listes déroulantes.
    const sel = "h-11 pl-3 pr-8 text-sm font-extrabold bg-white";
    const st = { fontFamily: FONT, color: CARBON, clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` };
    filtersZone = (
      <div className="mt-4 p-4 bg-white" style={{ boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` }}>
        <p className="flex flex-wrap items-center gap-2 text-base font-bold" style={{ fontFamily: FONT, color: CARBON }}>
          {brands.length > 0 && <>
            <span>Pour ma</span>
            <select value={brand ?? ""} onChange={(e) => { setBrand(e.target.value || null); setModel(null); setSize(null); }} aria-label="Marque" className={sel} style={st}>
              <option value="">marque</option>{brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
            </select>
            <select value={model ?? ""} disabled={!brand} onChange={(e) => { setModel(e.target.value || null); setSize(null); setInch(null); }} aria-label="Modèle" className={`${sel} disabled:opacity-50`} style={st}>
              <option value="">modèle</option>{brandModels.map((m) => <option key={m.id} value={m.id}>{m.name.replace(new RegExp(`^${m.brandName}\\s+`, "i"), "")}</option>)}
            </select>
          </>}
          {showSizes && <>
            <span>{brands.length > 0 ? "ou en taille" : "En taille"}</span>
            <select value={size ?? ""} onChange={(e) => { setSize(e.target.value || null); setInch(null); }} aria-label="Taille" className={sel} style={st}>
              <option value="">toutes</option>{sizes.map(([sz, n]) => <option key={sz} value={sz}>{sz} ({n})</option>)}
            </select>
          </>}
          <ClearLink />
        </p>
      </div>
    );
  }

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
              <span className="text-2xl md:text-3xl" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{families ? families.length : shown.length}</span>
              <span className="text-sm font-bold uppercase tracking-wider text-gray-500">{families ? "tailles" : shown.length === parts.length ? "références" : `sur ${parts.length}`}</span>
            </span>
          </div>

          <label className="mt-4 flex items-center gap-3 h-14 pl-4 pr-2 bg-white max-w-2xl" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Chercher dans les ${name.toLowerCase()}…`}
              aria-label={`Chercher dans les ${name}`} className="w-full h-full bg-transparent outline-none text-base text-carbon placeholder:text-gray-400" style={{ fontFamily: FONT }} />
            {q && <button type="button" onClick={() => setQ("")} aria-label="Effacer" className="w-10 h-10 flex items-center justify-center"><X className="w-4 h-4 text-gray-500" /></button>}
          </label>

          {filtersZone}
        </div>
      </section>

      <section className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-20">
        {shown.length === 0 ? (
          <p className="py-10 text-base text-gray-600" style={{ fontFamily: FONT }}>Aucune pièce avec ces critères. <button type="button" onClick={() => { setQ(""); clearTrott(); }} className="font-bold underline min-h-[44px]" style={{ color: CARBON }}>Tout réafficher</button></p>
        ) : families ? (
          <>
            <FamilySortBar sort={famSort} onSort={setFamSort} />
            <FamilyGrid families={families} look={famLook} />
          </>
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
      {bottomZone}
    </>
  );
};

export default CategoryExplorer;
