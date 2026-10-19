import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronRight, Eye, EyeOff, Check, Layers, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 19/10/2026 (Nolan) — écran « Tri du catalogue » : les fiches regroupées par taille + valve, avec
 * fournisseur, prix d'achat, prix de vente, marge et stock fournisseur côte à côte, pour repérer et
 * trier les doublons et fixer les prix sans passer par Claude.
 * Mise en page choisie le 19/10 : liste groupée + file de tri des doublons (5 propositions rendues).
 * Lecture : une requête par catégorie. Écriture : publier / dépublier, prix (admin, RLS existante).
 */

type Supplier = { supplier_name: string; buy_price_ht: number | null; stock_supplier: number | null };
type Row = {
  id: string; name: string; slug: string; price: number | null; published: boolean | null;
  image_url: string | null; fitment_specs: { rim_diameters?: string[]; tire_sections?: string[] } | null;
  part_suppliers: Supplier[] | null; part_compatibility: { count: number }[] | null;
};
export type Fiche = Row & {
  achat: number | null; fournisseur: string; stockF: number | null; nCompat: number;
  marge: number | null; taille: string; valve: string; gamme: string; groupKey: string;
};
export type Groupe = { key: string; taille: string; valve: string; fiches: Fiche[]; enLigne: number; doublons: number; prixMin: number | null; prixMax: number | null };

const CATS = [
  { slug: "chambres-a-air", label: "Chambres à air" },
  { slug: "pneus", label: "Pneus" },
  { slug: "pneus-pleins", label: "Pneus pleins" },
  { slug: "plaquettes", label: "Plaquettes" },
  { slug: "chargeurs", label: "Chargeurs" },
  { slug: "disques", label: "Disques" },
];

const norm = (s: string) => s.toLowerCase().replace(/&#215;|×/g, "x").replace(/,/g, ".");

export function lireValve(name: string): string {
  const n = norm(name);
  if (/presta/.test(n)) return "Presta";
  const ang = n.match(/(\d{1,3})\s?[x°]\s?(\d{1,3})\s?°?/);
  if (/coud/.test(n) || ang) {
    if (ang && !/^\d{1,2}(\.\d)?x\d/.test(ang[0])) return `Coudée ${ang[1]}x${ang[2]}°`;
    const deg = n.match(/coud[ée]+e?\s?(\d{2,3})\s?°/);
    if (deg) return `Coudée ${deg[1]}°`;
    if (/coud/.test(n)) return "Coudée";
  }
  if (/droite/.test(n)) return "Droite";
  return "—";
}

function lireValveSure(name: string): string {
  // les angles de valve s'écrivent 90x90, 0x90, 45x45, 135x45, 65x65 : jamais une taille de pneu
  const n = norm(name);
  const m = n.match(/\b(0|30|45|65|70|90|135)\s?x\s?(45|65|90)\s?°?/);
  if (m) return `Coudée ${m[1]}x${m[2]}°`;
  if (/presta/.test(n)) return "Presta";
  const deg = n.match(/coud[ée]+e?\s?(\d{2,3})\s?°/);
  if (deg) return `Coudée ${deg[1]}°`;
  if (/coud/.test(n)) return "Coudée";
  // 19/10 : « valve droite 28 mm » / « 32 mm » = longueur de tige, produits différents (CMM628 / CMM629 eWheel)
  const longueur = n.match(/droite\s?(\d{2})\s?mm/);
  if (longueur) return `Droite ${longueur[1]} mm`;
  if (/droite/.test(n)) return "Droite";
  const v = lireValve(name);
  return v === "—" ? "non écrite" : v;
}

function lireGamme(name: string): string {
  const n = norm(name);
  // 19/10 (Nolan) : un tubeless et un pneu à chambre de même taille sont deux produits, jamais des doublons
  const montage = /tubeless|sans chambre/.test(n) ? " tubeless" : /tube type|avec chambre|\+ chambre/.test(n) ? " à chambre" : "";
  // ni la sculpture, ni le gel, ni le runflat, ni la couleur ne font un doublon : ce sont des produits différents
  const traits = [
    /semi[\s-]?off[\s-]?road|semi road/.test(n) ? "semi-offroad" : /off[\s-]?road|tout[\s-]terrain/.test(n) ? "offroad" : /slick/.test(n) ? "slick" : /city[\s-]?road|route/.test(n) ? "route" : "",
    /gel|anti[\s-]?crev/.test(n) ? "gel" : "",
    /run[\s-]?flat/.test(n) ? "runflat" : "",
    /radial/.test(n) ? "radial" : "",
    /flottant/.test(n) ? "flottant" : "",
    /\br6\b/.test(n) ? "R6" : "",
    /ultra[\s-]?l[ée]ger/.test(n) ? "ultra-léger" : "",
    /perfor|alv[ée]ol/.test(n) ? "alvéolé" : "",
    /gomme tendre/.test(n) ? "gomme tendre" : "",
    /diamant/.test(n) ? "diamant" : "",
    (n.match(/jante (\d{2}) ?mm/) ?? [])[1] ? `jante ${(n.match(/jante (\d{2}) ?mm/) ?? [])[1]} mm` : "",
    // couleur, liseré, points, tricolore : une variante de couleur n'est jamais le doublon d'une autre
    ...(n.match(/\b(liser|points?|tricolore|rouges?|noire?s?|bleue?s?|vertes?|jaunes?|fluo|blanc(?:he)?s?|violets?|grises?|or)\b/g) ?? []),
  ].filter(Boolean);
  return gammeBase(n) + montage + (traits.length ? ` · ${traits.join(" · ")}` : "");
}

function gammeBase(n: string): string {
  const lot = /lot de 5|5\s?uds/.test(n);
  if (/black cat/.test(n)) return (/premium/.test(n) ? "Black Cat premium" : "Black Cat") + (lot ? " lot de 5" : "");
  if (/premium/.test(n)) return "Premium";
  if (/renforc/.test(n)) return "Renforcée";
  return "Standard";
}

export const NON_LUE = "Taille non lue";

function lireTaille(r: Row, cat: string): string {
  const fs = r.fitment_specs ?? {};
  // 19/10 : un disque se lit en Ø mm (+ nombre de trous), jamais avec le motif des pneus
  if (cat === "disques") {
    const n = norm(r.name);
    const d = n.match(/(\d{2,3})\s?mm/);
    const e = n.match(/entraxe\s?(\d{2})\s?mm?/);
    const t = n.match(/(\d{1,2})\s?trous/);
    // sans l'entraxe, deux disques de même Ø peuvent ne pas se monter sur la même roue : on ne juge pas
    return d && e ? `Ø ${d[1]} mm · entraxe ${e[1]}${t ? ` · ${t[1]} trous` : ""}` : NON_LUE;
  }
  // plaquettes et chargeurs : pas de taille lisible dans le nom → jamais de doublon annoncé
  if (cat !== "chambres-a-air" && cat !== "pneus" && cat !== "pneus-pleins") return NON_LUE;
  const sec = fs.tire_sections?.[0];
  const rims = fs.rim_diameters ?? [];
  if (sec) return rims.length ? `${sec} · jante ${rims.join(" / ")}` : sec;
  const m = norm(r.name).match(/(\d{2,3}\/\d{2,3}(?:-\d(?:\.\d)?)?|\d{1,2}(?:\.\d{1,3})?\s?x\s?\(?[\d./]+\)?(?:-\d(?:\.\d)?)?)/);
  return m ? m[1].replace(/\s/g, "") : NON_LUE;
}

// 19/10 : pour les chambres, une fiche sans valve écrite n'est jamais comptée en doublon
// (CA-06 coudée 90x90 et CA-25 droite étaient regroupées à tort faute de valve dans le nom).
// 19/10 (Nolan) : « Garder les deux » — un lot de fiches déclarées distinctes n'est plus un doublon.
// Clé = ids triés des fiches en ligne de la même gamme ; si une nouvelle fiche arrive, le lot change et revient en file.
export const cleLot = (ids: string[]) => [...ids].sort().join("|");

export function construireGroupes(rows: Row[], cat: string, distincts: Set<string> = new Set()): Groupe[] {
  const valveObligatoire = cat === "chambres-a-air";
  const avecValve = cat === "chambres-a-air" || cat === "pneus";
  const fiches: Fiche[] = rows.map((r) => {
    const sups = r.part_suppliers ?? [];
    const best = [...sups].sort((a, b) => (a.buy_price_ht ?? 1e9) - (b.buy_price_ht ?? 1e9))[0];
    const achat = best?.buy_price_ht ?? null;
    const taille = lireTaille(r, cat);
    const valve = avecValve ? lireValveSure(r.name) : "—";
    return {
      ...r,
      achat,
      fournisseur: sups.map((s) => s.supplier_name).filter(Boolean).join(" + ") || "—",
      stockF: best?.stock_supplier ?? null,
      nCompat: r.part_compatibility?.[0]?.count ?? 0,
      marge: r.price != null && achat != null ? r.price - achat : null,
      taille, valve, gamme: lireGamme(r.name),
      groupKey: `${taille}|${valve}`,
    };
  });
  const map = new Map<string, Fiche[]>();
  for (const f of fiches) { const l = map.get(f.groupKey) ?? []; l.push(f); map.set(f.groupKey, l); }
  return [...map.entries()].map(([key, l]) => {
    const enLigne = l.filter((f) => f.published);
    const prix = enLigne.map((f) => f.price ?? 0).filter((p) => p > 0);
    // doublon = même taille + même valve + même gamme, plusieurs fiches en ligne (fournisseurs différents)
    const parGamme = new Map<string, string[]>();
    for (const f of enLigne) parGamme.set(f.gamme, [...(parGamme.get(f.gamme) ?? []), f.id]);
    const valveInconnue = valveObligatoire && l[0].valve === "non écrite";
    const tailleInconnue = l[0].taille === NON_LUE;
    const doublons = valveInconnue || tailleInconnue ? 0 : [...parGamme.values()]
      .filter((ids) => !distincts.has(cleLot(ids)))
      .reduce((n, ids) => n + Math.max(0, ids.length - 1), 0);
    return {
      key, taille: l[0].taille, valve: l[0].valve, doublons,
      fiches: l.sort((a, b) => Number(!!b.published) - Number(!!a.published) || (a.price ?? 0) - (b.price ?? 0)),
      enLigne: enLigne.length,
      prixMin: prix.length ? Math.min(...prix) : null, prixMax: prix.length ? Math.max(...prix) : null,
    };
  }).sort((a, b) => a.taille.localeCompare(b.taille, "fr", { numeric: true }) || b.enLigne - a.enLigne);
}

const useCatalogue = (slug: string) =>
  useQuery<Row[], Error>({
    queryKey: ["admin-tri", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select("id, name, slug, price, published, image_url, fitment_specs, part_suppliers(supplier_name, buy_price_ht, stock_supplier), part_compatibility(count), category:categories!inner(slug)")
        .eq("category.slug", slug)
        .order("name")
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

const eur = (v: number | null | undefined) => (v == null ? "—" : `${v.toFixed(2).replace(".", ",")} €`);
const pct = (f: Fiche) => (f.marge != null && f.price ? Math.round((f.marge / f.price) * 100) : null);
const margeTone = (f: Fiche) => { const p = pct(f); return p == null ? "text-[hsl(var(--al55))]" : p < 20 ? "text-red-400" : p < 45 ? "text-amber-300" : "text-emerald-400"; };

function useActions() {
  const qc = useQueryClient();
  const publish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("parts").update({ published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tri"] }),
  });
  const setPrice = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const { error } = await supabase.from("parts").update({ price }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tri"] }),
  });
  return { publish, setPrice };
}

/* ------------------------------ briques communes ------------------------------ */

const Thumb = ({ f, size = 48 }: { f: Fiche; size?: number }) => (
  <div className="shrink-0 rounded-lg bg-white/90 overflow-hidden flex items-center justify-center" style={{ width: size, height: size }}>
    {f.image_url ? <img src={f.image_url} alt="" loading="lazy" className="max-w-full max-h-full object-contain" /> : <Layers className="w-5 h-5 text-neutral-400" />}
  </div>
);

const Toggle = ({ f }: { f: Fiche }) => {
  const { publish } = useActions();
  return (
    <button
      onClick={() => publish.mutate({ id: f.id, published: !f.published })}
      className={cn("min-h-[44px] min-w-[44px] px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 border",
        f.published ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10" : "border-[hsl(var(--al25))] text-[hsl(var(--al60))]")}
      aria-label={f.published ? "Dépublier" : "Publier"}
    >
      {publish.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : f.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      {f.published ? "En ligne" : "Masquée"}
    </button>
  );
};

const PriceInput = ({ f }: { f: Fiche }) => {
  const { setPrice } = useActions();
  const [v, setV] = useState(f.price != null ? f.price.toFixed(2).replace(".", ",") : "");
  const commit = () => {
    const n = Number(v.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0 || n === f.price) return;
    setPrice.mutate({ id: f.id, price: Math.round(n * 100) / 100 });
  };
  return (
    <input
      value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()}
      inputMode="decimal" aria-label="Prix de vente"
      className="w-[84px] min-h-[44px] rounded-lg bg-[hsl(var(--al14))] border border-[hsl(var(--al25))] px-2 text-right text-base font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
};

const Chiffres = ({ f }: { f: Fiche }) => (
  <div className="text-sm tabular-nums leading-tight">
    <div className="text-[hsl(var(--al60))]">achat {eur(f.achat)} · {f.fournisseur}</div>
    <div className={margeTone(f)}>marge {eur(f.marge)}{pct(f) != null ? ` (${pct(f)} %)` : ""}</div>
    <div className="text-[hsl(var(--al60))]">stock fourn. {f.stockF ?? "—"} · {f.nCompat} trott.</div>
  </div>
);

const Entete = ({ g }: { g: Groupe }) => (
  <div className="min-w-0">
    <div className="text-base font-extrabold truncate">{g.taille}</div>
    <div className="text-sm text-[hsl(var(--al60))]">
      {g.valve !== "—" && `Valve ${g.valve} · `}{g.enLigne} en ligne{g.doublons > 0 && <span className="text-amber-300 font-bold"> · {g.doublons} en double</span>}
      {g.prixMin != null && ` · ${eur(g.prixMin)}${g.prixMax !== g.prixMin ? ` → ${eur(g.prixMax)}` : ""}`}
    </div>
  </div>
);

/* ------------------------------ 1. Liste groupée ------------------------------ */
const V1Liste = ({ groupes }: { groupes: Groupe[] }) => {
  const [open, setOpen] = useState<string | null>(groupes.find((g) => g.doublons > 0)?.key ?? null);
  return (
    <div className="space-y-2">
      {groupes.map((g) => (
        <div key={g.key} className="rounded-xl border border-[hsl(var(--al18))] bg-[hsl(var(--al12))]">
          <button onClick={() => setOpen(open === g.key ? null : g.key)} className="w-full min-h-[56px] px-3 py-2 flex items-center gap-2 text-left">
            {open === g.key ? <ChevronDown className="w-5 h-5 shrink-0" /> : <ChevronRight className="w-5 h-5 shrink-0" />}
            <Entete g={g} />
            {g.doublons > 0 && <span className="ml-auto shrink-0 text-sm font-bold px-2 py-1 rounded-md bg-amber-400/15 text-amber-300">+{g.doublons}</span>}
          </button>
          {open === g.key && (
            <div className="border-t border-[hsl(var(--al18))] divide-y divide-[hsl(var(--al18))]">
              {g.fiches.map((f) => (
                <div key={f.id} className={cn("p-3 flex gap-3", !f.published && "opacity-55")}>
                  <Thumb f={f} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold leading-snug">{f.name}</div>
                    <div className="text-sm text-[hsl(var(--al60))]">{f.gamme}</div>
                    <Chiffres f={f} />
                  </div>
                  <div className="flex flex-col items-end gap-2"><PriceInput f={f} /><Toggle f={f} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ------------------------------ 2. File de tri (doublons d'abord) ------------------------------ */
const V2File = ({ groupes, marquerDistincts }: { groupes: Groupe[]; marquerDistincts: (lots: string[], retirer?: boolean) => void }) => {
  const file = groupes.filter((g) => g.doublons > 0);
  const [i, setI] = useState(0);
  const { publish } = useActions();
  // on ne masque que les fiches de la MÊME gamme : une Black Cat lot de 5 n'est pas le doublon d'une chambre à l'unité
  const [dernier, setDernier] = useState<{ texte: string; ids: string[] } | null>(null);
  const [distinctsAnnulables, setDistinctsAnnulables] = useState<string[] | null>(null);
  const g = file[Math.min(i, file.length - 1)];
  if (!g) return (
    <div className="space-y-3">
      {distinctsAnnulables && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 flex items-center gap-3 text-sm">
          <span className="flex-1">Toutes gardées, ce ne sont pas des doublons.</span>
          <button onClick={() => { marquerDistincts(distinctsAnnulables, true); setDistinctsAnnulables(null); }} className="min-h-[44px] px-4 rounded-lg border border-[hsl(var(--al30))] font-bold shrink-0">Annuler</button>
        </div>
      )}
      <p className="text-base text-emerald-300 p-4">Plus aucun doublon en ligne dans cette catégorie.</p>
    </div>
  );
  // 19/10 (Nolan) : « Garder les deux » — deux produits différents qui se ressemblent, aucun n'est masqué
  const lotsDuGroupe = () => {
    const parGamme = new Map<string, string[]>();
    for (const f of g.fiches.filter((x) => x.published)) parGamme.set(f.gamme, [...(parGamme.get(f.gamme) ?? []), f.id]);
    return [...parGamme.values()].filter((ids) => ids.length > 1).map(cleLot);
  };
  const garderTout = () => {
    const lots = lotsDuGroupe();
    marquerDistincts(lots);
    setDistinctsAnnulables(lots);
    setDernier(null);
  };
  const garder = (keep: Fiche) => {
    const ids = g.fiches.filter((f) => f.published && f.id !== keep.id && f.gamme === keep.gamme).map((f) => f.id);
    ids.forEach((id) => publish.mutate({ id, published: false }));
    setDernier({ texte: `Gardée : ${keep.name} — ${ids.length} masquée${ids.length > 1 ? "s" : ""}.`, ids });
    setDistinctsAnnulables(null);
  };
  // 19/10 (Nolan) : retirer UNE fiche précise sans toucher aux autres. Masquer = dépublier, jamais supprimer :
  // la fiche reste en base (prix, fournisseur, compat) et se republie d'un clic (Annuler, ou « Masquée » dans la liste).
  const masquer = (f: Fiche) => {
    publish.mutate({ id: f.id, published: false });
    setDernier({ texte: `Masquée : ${f.name} (toujours en base, republiable).`, ids: [f.id] });
    setDistinctsAnnulables(null);
  };
  const annuler = () => {
    if (!dernier) return;
    dernier.ids.forEach((id) => publish.mutate({ id, published: true }));
    setDernier(null);
  };
  const nbEnDouble = g.fiches.filter((f) => f.published && g.fiches.filter((x) => x.published && x.gamme === f.gamme).length > 1).length;
  return (
    <div className="space-y-3">
      {distinctsAnnulables && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 flex items-center gap-3 text-sm">
          <span className="flex-1">Toutes gardées, ce ne sont pas des doublons.</span>
          <button onClick={() => { marquerDistincts(distinctsAnnulables, true); setDistinctsAnnulables(null); }} className="min-h-[44px] px-4 rounded-lg border border-[hsl(var(--al30))] font-bold shrink-0">Annuler</button>
        </div>
      )}
      {dernier && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 flex items-center gap-3 text-sm">
          <span className="flex-1">{dernier.texte}</span>
          <button onClick={annuler} className="min-h-[44px] px-4 rounded-lg border border-[hsl(var(--al30))] font-bold shrink-0">Annuler</button>
        </div>
      )}
      <div className="flex items-center justify-between text-sm text-[hsl(var(--al60))]">
        <span>Doublon {Math.min(i, file.length - 1) + 1} sur {file.length}</span>
        <div className="flex gap-2">
          <button className="min-h-[44px] px-3 rounded-lg border border-[hsl(var(--al25))]" onClick={() => setI(Math.max(0, i - 1))}>Précédent</button>
          <button className="min-h-[44px] px-3 rounded-lg border border-[hsl(var(--al25))]" onClick={() => setI(Math.min(file.length - 1, i + 1))}>Passer</button>
        </div>
      </div>
      <div className="rounded-2xl border border-amber-400/30 bg-[hsl(var(--al12))] p-4">
        <Entete g={g} />
        <p className="text-sm text-[hsl(var(--al60))] mt-1">« Garder celle-ci » masque les autres de la même gamme · « Masquer » retire seulement cette fiche · « Garder les … » si ce ne sont pas des doublons. Rien n'est supprimé, « Annuler » juste après.</p>
      </div>
      {g.fiches.filter((f) => f.published && g.fiches.filter((x) => x.published && x.gamme === f.gamme).length > 1).map((f) => (
        <div key={f.id} className="rounded-2xl border border-[hsl(var(--al20))] bg-[hsl(var(--al12))] p-3">
          <div className="flex gap-3">
            <Thumb f={f} size={72} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold leading-snug">{f.name}</div>
              <div className="text-xl font-black tabular-nums mt-1">{eur(f.price)}</div>
              <Chiffres f={f} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => garder(f)} className="flex-1 min-h-[48px] rounded-lg bg-primary text-primary-foreground text-base font-extrabold flex items-center justify-center gap-2 active:scale-[0.99]">
              <Check className="w-5 h-5" /> Garder celle-ci
            </button>
            <button onClick={() => masquer(f)} className="shrink-0 min-h-[48px] px-4 rounded-lg border-2 border-[hsl(var(--al30))] text-[hsl(var(--al70))] text-base font-bold flex items-center justify-center gap-2 active:scale-[0.99]" aria-label={`Masquer ${f.name}`}>
              <EyeOff className="w-5 h-5" /> Masquer
            </button>
          </div>
        </div>
      ))}
      <button onClick={garderTout} className="w-full min-h-[48px] rounded-lg border-2 border-primary text-primary text-base font-extrabold flex items-center justify-center gap-2 active:scale-[0.99]">
        <Layers className="w-5 h-5" /> {nbEnDouble > 2 ? `Garder les ${nbEnDouble}` : "Garder les deux"} — ce ne sont pas des doublons
      </button>
    </div>
  );
};

/* ------------------------------ écran ------------------------------ */
const CLE_DISTINCTS = "pt-admin-tri-distincts";
const lireDistincts = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(CLE_DISTINCTS) ?? "[]")); } catch { return new Set(); }
};
// 19/10 (Nolan) : choix « 1 Liste + 2 File » — liste groupée par défaut, file de tri des doublons à la demande.

const CatalogueTriage = () => {
  const [cat, setCat] = useState(CATS[0].slug);
  const [mode, setMode] = useState<"liste" | "file">("liste");
  const { data = [], isLoading, error } = useCatalogue(cat);
  const [distincts, setDistincts] = useState<Set<string>>(() => lireDistincts());
  const marquerDistincts = (lots: string[], retirer = false) => {
    setDistincts((prev) => {
      const next = new Set(prev);
      lots.forEach((l) => (retirer ? next.delete(l) : next.add(l)));
      try { localStorage.setItem(CLE_DISTINCTS, JSON.stringify([...next])); } catch { /* stockage indisponible : marquage gardé pour la session */ }
      return next;
    });
  };
  const groupes = useMemo(() => construireGroupes(data, cat, distincts), [data, cat, distincts]);
  const enLigne = data.filter((r) => r.published).length;
  const enTrop = groupes.reduce((n, g) => n + g.doublons, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATS.map((c) => (
          <button key={c.slug} onClick={() => { setCat(c.slug); setMode("liste"); }}
            className={cn("shrink-0 min-h-[44px] px-4 rounded-full text-sm font-semibold border", cat === c.slug ? "bg-primary text-primary-foreground border-primary" : "border-[hsl(var(--al25))] text-[hsl(var(--al70))]")}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[{ k: "En ligne", v: enLigne }, { k: "Tailles", v: new Set(groupes.filter((g) => g.enLigne > 0).map((g) => g.taille)).size }, { k: "En double", v: enTrop }].map((s) => (
          <div key={s.k} className="rounded-xl border border-[hsl(var(--al18))] bg-[hsl(var(--al12))] p-3">
            <div className={cn("text-2xl font-black tabular-nums", s.k === "En double" && s.v > 0 && "text-amber-300")}>{s.v}</div>
            <div className="text-sm text-[hsl(var(--al60))]">{s.k}</div>
          </div>
        ))}
      </div>
      {mode === "liste" ? (
        enTrop > 0 && (
          <button onClick={() => setMode("file")} className="w-full min-h-[52px] rounded-xl bg-amber-400 text-[#1A1A1A] text-base font-extrabold">
            Trier les doublons ({enTrop})
          </button>
        )
      ) : (
        <button onClick={() => setMode("liste")} className="min-h-[44px] text-base text-primary font-semibold">← Retour à la liste</button>
      )}
      <p className="text-sm text-[hsl(var(--al55))]">Marge = prix de vente − prix d'achat HT du fournisseur le moins cher (hors port, TVA espagnole non récupérable). « — » : prix d'achat absent en base.</p>
      {isLoading && <Loader2 className="w-6 h-6 animate-spin" />}
      {error && <p className="text-red-400 text-sm">{error.message}</p>}
      {!isLoading && mode === "liste" && <V1Liste groupes={groupes} />}
      {!isLoading && mode === "file" && <V2File groupes={groupes} marquerDistincts={marquerDistincts} />}
    </div>
  );
};

export default CatalogueTriage;
