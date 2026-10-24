/**
 * Filtres et tris de la page /trottinettes (16/10/2026).
 * Les valeurs vivent dans l'URL (?puissance=..&tri=..) : lien partageable, retour arrière conservé.
 * Données mesurées le 16/10 sur 437 publiés : vitesse = 25 km/h partout (inutile), pliable = 358/437 (inutile),
 * prix = 17/437 (inutile) → filtres retenus : puissance, autonomie, poids, roues, freins, suspension, pneus.
 */

export interface FilterableScooter {
  name: string;
  power_watts?: number | null;
  range_km?: number | null;
  weight_kg?: number | string | null;
  wheel_inches?: number | string | null;
  wheel_size_inches?: number | string | null;
  brake_type?: string | null;
  suspension?: string | null;
  tire_family?: string | null;
  compatible_parts_count?: number | null;
  created_at?: string | null;
  affiliate_link?: string | null;
  image_url?: string | null;
  brand?: { slug?: string | null; name?: string | null } | null;
  commercial_status?: string | null;
}

/** 24/10 (Nolan) : « Notre sélection » = tri par défaut. Ce qui fait vendre en premier :
 *  lien d'affiliation, beaucoup de pièces compatibles, belles marques ; jamais deux fois la même marque d'affilée en tête. */
const STAR_BRANDS = ["kukirin", "teverun", "dualtron"]; // citées par Nolan le 24/10
const NICE_BRANDS = ["xiaomi", "kaabo", "navee", "iscooter", "segway", "ninebot", "nami", "halo-knight", "inokim", "pure-electric", "zero"];
const selectionScore = (s: FilterableScooter) => {
  const b = s.brand?.slug ?? "";
  return (s.affiliate_link ? 100 : 0) +
    Math.min(Number(s.compatible_parts_count) || 0, 40) * 2 +
    (STAR_BRANDS.includes(b) ? 90 : NICE_BRANDS.includes(b) ? 40 : 0) +
    (s.image_url ? 0 : -200);
};
/** Écarte les doublons de marque consécutifs dans les `head` premières places (ordre de score conservé sinon). */
const spreadBrands = <T extends FilterableScooter>(list: T[], head = 36): T[] => {
  const out: T[] = [];
  const pool = [...list];
  while (out.length < head && pool.length) {
    const last = out[out.length - 1]?.brand?.slug;
    const i = pool.findIndex((x) => !last || x.brand?.slug !== last);
    out.push(...pool.splice(i < 0 ? 0 : i, 1));
  }
  return [...out, ...pool];
};

export interface FilterOption<T = FilterableScooter> {
  value: string;
  label: string;
  test: (s: T) => boolean;
}
export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const range = (get: (s: FilterableScooter) => number | null, min: number, max: number) => (s: FilterableScooter) => {
  const v = get(s);
  return v !== null && v >= min && v < max;
};

export const wheelOf = (s: FilterableScooter) => num(s.wheel_inches) ?? num(s.wheel_size_inches);

/** Suspension : texte libre en base → aucune / avant ou arrière seulement / avant + arrière. null = inconnu. */
export const suspensionClass = (s: FilterableScooter): "none" | "partial" | "full" | null => {
  const t = (s.suspension ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (!t.trim()) return null;
  if (/^(aucune|non|rigide|sans)|pas de suspension avant ni|fourche rigide/.test(t)) return "none";
  const av = /avant|fourche|av\/|av /.test(t);
  const ar = /arriere|ar\b|\/ar/.test(t);
  if ((av && ar) || /double suspension$|integrale|6 suspensions|4 suspensions|quatre bras|cartouches|duo.?shock|airflow|triple ressort|double bras oscillant|kke/.test(t)) return "full";
  if (av || ar || /ressort|hydraulique|amortisseur|suspension/.test(t)) return "partial";
  return null;
};

export const brakeClass = (s: FilterableScooter): "hydraulic" | "disc" | "drum" | null => {
  const b = s.brake_type ?? "";
  if (!b) return null;
  if (b.includes("hydraulic")) return "hydraulic";
  if (b.includes("disc")) return "disc";
  return "drum";
};

export const FILTER_GROUPS: FilterGroup[] = [
  // 24/10 (Nolan) : séparer ce qui s'achète neuf de ce qui ne se vend plus. Statut posé avec preuve (status_source) ;
  // « a_verifier » n'entre dans aucune des deux options : visible seulement sans filtre (« Toutes »).
  {
    key: "vente", label: "Vente",
    options: [
      { value: "oui", label: "En vente neuve", test: (s) => s.commercial_status === "en_vente" },
      { value: "non", label: "Plus vendue neuve", test: (s) => s.commercial_status === "arretee" || s.commercial_status === "fin_de_serie" },
    ],
  },
  {
    key: "puissance", label: "Puissance",
    options: [
      { value: "500", label: "Jusqu'à 500 W", test: range((s) => num(s.power_watts), 0, 501) },
      { value: "1000", label: "501 à 1 000 W", test: range((s) => num(s.power_watts), 501, 1001) },
      { value: "2000", label: "1 001 à 2 000 W", test: range((s) => num(s.power_watts), 1001, 2001) },
      { value: "plus", label: "Plus de 2 000 W", test: range((s) => num(s.power_watts), 2001, 1e9) },
    ],
  },
  {
    key: "autonomie", label: "Autonomie",
    options: [
      { value: "40", label: "Moins de 40 km", test: range((s) => num(s.range_km), 0, 40) },
      { value: "80", label: "40 à 80 km", test: range((s) => num(s.range_km), 40, 81) },
      { value: "plus", label: "Plus de 80 km", test: range((s) => num(s.range_km), 81, 1e9) },
    ],
  },
  {
    key: "poids", label: "Poids",
    options: [
      { value: "15", label: "Moins de 15 kg", test: range((s) => num(s.weight_kg), 0, 15) },
      { value: "25", label: "15 à 25 kg", test: range((s) => num(s.weight_kg), 15, 25.01) },
      { value: "35", label: "25 à 35 kg", test: range((s) => num(s.weight_kg), 25.01, 35.01) },
      { value: "plus", label: "Plus de 35 kg", test: range((s) => num(s.weight_kg), 35.01, 1e9) },
    ],
  },
  {
    key: "roues", label: "Roues",
    options: [
      { value: "8", label: "8,5 pouces et moins", test: range(wheelOf, 0, 8.75) },
      { value: "10", label: "9 à 10 pouces", test: range(wheelOf, 8.75, 10.25) },
      { value: "11", label: "10,5 pouces et plus", test: range(wheelOf, 10.25, 1e9) },
    ],
  },
  {
    key: "freins", label: "Freins",
    options: [
      { value: "hydraulique", label: "Disque hydraulique", test: (s) => brakeClass(s) === "hydraulic" },
      { value: "disque", label: "Disque mécanique", test: (s) => brakeClass(s) === "disc" },
      { value: "tambour", label: "Tambour / électrique", test: (s) => brakeClass(s) === "drum" },
    ],
  },
  {
    key: "suspension", label: "Suspensions",
    options: [
      { value: "double", label: "Avant + arrière", test: (s) => suspensionClass(s) === "full" },
      { value: "simple", label: "Avant ou arrière", test: (s) => suspensionClass(s) === "partial" },
      { value: "aucune", label: "Sans suspension", test: (s) => suspensionClass(s) === "none" },
    ],
  },
  {
    key: "pneus", label: "Pneus",
    options: [
      { value: "gonflables", label: "Gonflables", test: (s) => s.tire_family === "pneumatic" },
      { value: "pleins", label: "Pleins (anti-crevaison)", test: (s) => s.tire_family === "solid" },
    ],
  },
];

export interface SortOption {
  value: string;
  label: string;
  cmp: (a: FilterableScooter, b: FilterableScooter) => number;
}
const desc = (get: (s: FilterableScooter) => number | null) => (a: FilterableScooter, b: FilterableScooter) =>
  (get(b) ?? -Infinity) - (get(a) ?? -Infinity) || a.name.localeCompare(b.name, "fr");
const asc = (get: (s: FilterableScooter) => number | null) => (a: FilterableScooter, b: FilterableScooter) =>
  (get(a) ?? Infinity) - (get(b) ?? Infinity) || a.name.localeCompare(b.name, "fr");

export const SORTS: SortOption[] = [
  { value: "selection", label: "Notre sélection", cmp: (a, b) => selectionScore(b) - selectionScore(a) || a.name.localeCompare(b.name, "fr") },
  { value: "nom", label: "Nom (A → Z)", cmp: (a, b) => a.name.localeCompare(b.name, "fr") },
  { value: "pieces", label: "Plus de pièces compatibles", cmp: desc((s) => num(s.compatible_parts_count)) },
  { value: "puissance", label: "Les plus puissantes", cmp: desc((s) => num(s.power_watts)) },
  { value: "autonomie", label: "Plus grande autonomie", cmp: desc((s) => num(s.range_km)) },
  { value: "leger", label: "Les plus légères", cmp: asc((s) => num(s.weight_kg)) },
  { value: "nouveau", label: "Nouveautés", cmp: desc((s) => (s.created_at ? Date.parse(s.created_at) : null)) },
];

/** Sélection : clé de groupe -> valeurs cochées. OU dans un groupe, ET entre groupes. */
export type Selection = Record<string, string[]>;

export const applyFilters = <T extends FilterableScooter>(list: T[], sel: Selection, sort: string): T[] => {
  const active = FILTER_GROUPS.filter((g) => sel[g.key]?.length);
  const out = active.length
    ? list.filter((s) => active.every((g) => g.options.some((o) => sel[g.key].includes(o.value) && o.test(s))))
    : [...list];
  const so = SORTS.find((x) => x.value === sort) ?? SORTS[0];
  const sorted = out.sort(so.cmp);
  return so.value === "selection" ? spreadBrands(sorted) : sorted;
};

export const readSelection = (params: URLSearchParams): Selection => {
  const sel: Selection = {};
  FILTER_GROUPS.forEach((g) => {
    const v = params.get(g.key);
    if (v) sel[g.key] = v.split(",").filter((x) => g.options.some((o) => o.value === x));
  });
  return sel;
};
