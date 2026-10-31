/**
 * Familles de pièces (31/10/2026, demande de Nolan : « les chambres en 10x2.125 avec plusieurs valves = un seul produit »).
 * APERÇU : regroupement calculé ici à partir du nom, en attendant la table `part_families` en base.
 * Règle stricte : même taille ET même jante (les trois 8,5x2 — jante 6.1 / 134 mm / 140 mm — ne se mélangent jamais).
 * Chaque variante reste une pièce à part entière (prix, stock, compat, panier au `parts.id`).
 */
import type { CataloguePart } from "@/hooks/useCatalogueData";

export type Gamme = "Standard" | "Renforcée" | "Premium";
export interface FamilyVariant {
  part: CataloguePart;
  valve: string; // « Droite », « 90×90° », « Droite 32 mm »…
  angle: [number, number] | null; // angles de la valve coudée, pour le picto
  gamme: Gamme;
}
export interface PartFamily {
  key: string;
  title: string; // « Chambre à air 10x2.125 »
  size: string; // « 10x2.125 »
  rim: string | null; // « jante 134 mm » quand elle distingue la famille
  variants: FamilyVariant[];
  minPrice: number | null;
  maxPrice: number | null;
}

const clean = (s: string) => s.replace(/,/g, ".");

/** Jante qui distingue deux familles de même taille, lue dans le nom. */
const rimOf = (name: string): string | null => {
  const n = clean(name).toLowerCase();
  const j = n.match(/jante[^0-9]{0,8}(\d{2,3})\s*mm/) ?? n.match(/\(50-(\d{3})\)/);
  if (j) return `jante ${j[1]} mm`;
  if (/zero 8/.test(n)) return "jante 134 mm";
  return null;
};

/** Taille brute (sans arrondir « 10x3.0 » en « 10x3 » ni « 14x2.50 » en « 14x2.5 » : on ne fusionne que l'identique). */
const sizeOfName = (name: string): string => {
  const n = clean(name);
  // La PREMIÈRE taille écrite fait foi : « 80/65-6 (10x3) » est une 80/65, « 10x3.0 (70/65-6.5) » une 10x3.0.
  const cands = [
    n.match(/\b(\d\.\d{2}\/\d\.\d{2})/),
    n.match(/\b(\d{2,3}\/\d{2,3}-\d+(?:\.\d+)?)/),
    n.match(/\b(\d{1,3}(?:\.\d+)?)\s?[x×]\s?\(?(\d{1,3}(?:\.\d+)?)/i),
  ].filter((m): m is RegExpMatchArray => !!m).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const m0 = cands[0];
  const base = !m0 ? n : m0[2] !== undefined ? `${m0[1]}x${m0[2]}` : m0[1];
  return /draisienne/i.test(n) ? `draisienne ${base}` : base;
};

export const valveOf = (name: string): { valve: string; angle: [number, number] | null } => {
  const n = clean(name).toLowerCase();
  const a = n.match(/(?:valve|tr87)[^0-9]{0,12}(\d{1,3})\s?[x×]\s?(\d{1,3})/) ?? n.match(/coud[ée]e\s+(\d{1,3})\s?[x×]\s?(\d{1,3})/);
  if (a) return { valve: `${a[1]}×${a[2]}°`, angle: [Number(a[1]), Number(a[2])] };
  if (/valve\s+droite/.test(n)) {
    const mm = n.match(/droite\s+(\d{2})\s?mm/);
    return { valve: mm ? `Droite ${mm[1]} mm` : "Droite", angle: null };
  }
  const one = n.match(/coud[ée]e\s+(\d{1,3})\s?°/);
  if (one) return { valve: `Coudée ${one[1]}°`, angle: [Number(one[1]), Number(one[1])] };
  if (/coud[ée]e/.test(n)) return { valve: "Coudée", angle: [90, 90] };
  return { valve: "Droite", angle: null };
};

const gammeOf = (name: string): Gamme => (/premium|black cat/i.test(name) ? "Premium" : /renforc/i.test(name) ? "Renforcée" : "Standard");
const GAMME_RANK: Record<Gamme, number> = { Standard: 0, Renforcée: 1, Premium: 2 };

export const groupFamilies = (parts: CataloguePart[], categoryLabel = "Chambre à air"): PartFamily[] => {
  const map = new Map<string, PartFamily>();
  for (const p of parts) {
    const size = sizeOfName(p.name);
    const rim = rimOf(p.name);
    const key = `${size}|${rim ?? ""}`;
    let f = map.get(key);
    if (!f) {
      const sz = size.replace(/^draisienne /, "");
      f = { key, size: sz, rim, title: `${categoryLabel}${size.startsWith("draisienne") ? " draisienne" : ""} ${sz}`, variants: [], minPrice: null, maxPrice: null };
      map.set(key, f);
    }
    f.variants.push({ part: p, gamme: gammeOf(p.name), ...valveOf(p.name) });
  }
  for (const f of map.values()) {
    f.variants.sort((a, b) => GAMME_RANK[a.gamme] - GAMME_RANK[b.gamme] || (a.angle ? 1 : 0) - (b.angle ? 1 : 0) || a.valve.localeCompare(b.valve, "fr", { numeric: true }));
    const prices = f.variants.map((v) => v.part.price).filter((x): x is number => x != null);
    f.minPrice = prices.length ? Math.min(...prices) : null;
    f.maxPrice = prices.length ? Math.max(...prices) : null;
  }
  return [...map.values()];
};

/** Diamètre utile au tri « Taille » (10x2.125 → 10 ; 90/65 → 90 traité comme ~11 pouces). */
export const sizeRank = (f: PartFamily): number => {
  const m = f.size.match(/^(\d+(?:\.\d+)?)/);
  const v = m ? parseFloat(m[1]) : 99;
  if (/\//.test(f.size) && v > 20) return v === 200 ? 8 : v / 8; // 90/65 ≈ 11", 80/65 ≈ 10"
  return v;
};

export type FamilySort = "reco" | "prix" | "prix-desc" | "taille";
export const FAMILY_SORTS: { value: FamilySort; label: string }[] = [
  { value: "reco", label: "Recommandé" },
  { value: "prix", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
  { value: "taille", label: "Taille" },
];

/** Tri des familles. « Recommandé » en aperçu = compatible avec ta trott, puis le plus de choix, puis prix. En prod : `reco_rank` calculé en base (marge + stock boutique). */
export const sortFamilies = (list: PartFamily[], sort: FamilySort, compatIds?: Set<string> | null): PartFamily[] => {
  const compat = (f: PartFamily) => (compatIds && f.variants.some((v) => compatIds.has(v.part.id)) ? 0 : 1);
  const s = [...list];
  if (sort === "prix") s.sort((a, b) => (a.minPrice ?? 1e9) - (b.minPrice ?? 1e9) || sizeRank(a) - sizeRank(b));
  else if (sort === "prix-desc") s.sort((a, b) => (b.maxPrice ?? 0) - (a.maxPrice ?? 0) || sizeRank(a) - sizeRank(b));
  else if (sort === "taille") s.sort((a, b) => sizeRank(a) - sizeRank(b) || a.size.localeCompare(b.size, "fr", { numeric: true }));
  else s.sort((a, b) => compat(a) - compat(b) || b.variants.length - a.variants.length || (a.minPrice ?? 1e9) - (b.minPrice ?? 1e9));
  return s;
};
