/**
 * Textes de fiche pièce tirés des données (20/10) : regroupement par marque, modèles représentatifs, base de la compat,
 * titre + description Google générés. Module SANS composant React, importé par la page et par la fiche :
 * extrait pour casser l'import circulaire PartDetail → PartSeoFiche → PartPageVariants → PartSeoFiche
 * (page blanche « reading 'default' » au premier essai).
 */
import type { PartDetail, CompatibleScooter } from "@/hooks/usePartDetail";
import { fitTitle, clampDescription, TITLE_MAX } from "@/lib/seoText";

export const fullName = (s: CompatibleScooter) => {
  const b = s.brand?.name?.trim() ?? "";
  // « Pure Electric » + « Pure Air⁶ » : le nom commence déjà par le premier mot de la marque → pas de doublon.
  const first = b.split(/\s+/)[0]?.toLowerCase() ?? "";
  return b && !s.name.toLowerCase().startsWith(first) ? `${b} ${s.name}` : s.name;
};
export const shortName = (s: CompatibleScooter) => {
  const b = s.brand?.name ?? "";
  return b && s.name.toLowerCase().startsWith(b.toLowerCase() + " ") ? s.name.slice(b.length + 1) : s.name;
};

export type Group = { brand: string; items: CompatibleScooter[] };
export const groupByBrand = (list: CompatibleScooter[]): Group[] => {
  const m = new Map<string, CompatibleScooter[]>();
  for (const s of list) {
    const b = s.brand?.name?.trim() || "Autres";
    m.set(b, [...(m.get(b) ?? []), s]);
  }
  return [...m.entries()]
    .map(([brand, items]) => ({ brand, items: items.sort((a, b) => a.name.localeCompare(b.name, "fr")) }))
    .sort((a, b) => b.items.length - a.items.length || a.brand.localeCompare(b.brand, "fr"));
};

/** Marques les plus cherchées d'abord (volume de recherche), puis par nombre de modèles. */
const POPULAR = ["xiaomi", "segway", "ninebot", "dualtron", "kaabo", "vsett", "zero", "pure electric", "inokim", "kukirin", "teverun", "navee"];
const rank = (b: string) => { const i = POPULAR.indexOf(b.toLowerCase()); return i < 0 ? 99 : i; };
/** Trois modèles représentatifs : une marque chacun, marques cherchées d'abord, nom le plus court de la marque. */
export const topModels = (groups: Group[], n = 3) => {
  const order = [...groups].sort((a, b) => rank(a.brand) - rank(b.brand) || b.items.length - a.items.length);
  return order.slice(0, n).map((g) => [...g.items].sort((a, b) => fullName(a).length - fullName(b).length)[0]).map(fullName);
};

export const listFr = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;

/** Sur quoi la compatibilité est vérifiée, dit dans les mots de la famille. */
export const matchBasis = (part: PartDetail) => {
  const f = part.fitment_specs ?? {};
  if (f.brake_caliper?.length) return "sur la forme d'étrier";
  if (f.brake_disc?.diameters?.length) return "sur le diamètre et la fixation du disque";
  if (part.electrical_specs?.voltages?.length) return part.electrical_specs.connector ? "sur la tension et la prise de charge" : "sur la tension";
  return "sur la cote de montage";
};

/** Nom propre pour un titre : sans parenthèses, sans flèches ni émojis, espaces resserrés. */
const cleanName = (n: string) => n.replace(/\([^)]*\)/g, " ").replace(/\s*[\u2794\u27A1\u2B95]\uFE0F?\s*/g, " → ").replace(/[\u2190-\u2191\u2193-\u21FF\u2700-\u27BF\u2B00-\u2BFF\uFE0F\u{1F000}-\u{1FAFF}]/gu, " ").replace(/\s+/g, " ").replace(/\s+([,.])/g, "$1").trim();

/**
 * Nom pour le title Google (audit SEO 24/10) : les parenthèses restent en texte (connecteur, cote, modèle…), sauf
 * « (2 couleurs) » ; la couleur passe en fin de nom. Avant, toutes les parenthèses sautaient : « (Noir) »/« (Rouge) »
 * et « (connecteur GX16-3p) »/« (connecteur LP16-3) » donnaient le même titre (7 groupes, 17 fiches).
 */
const COLOR = /^(noir|rouge|bleu|vert|blanc|jaune|orange|gris|violet|rose|dor[ée]|argent)$/i;
export const titleName = (n: string) => {
  let color = "";
  const flat = n.replace(/\(([^)]*)\)/g, (_, raw: string) => {
    const p = raw.trim();
    if (COLOR.test(p)) { color = p; return " "; }
    return /^\d+\s*couleurs?$/i.test(p) ? " " : ` ${p} `;
  });
  return cleanName(color ? `${flat} ${color}` : flat);
};

/**
 * Titre et description Google GÉNÉRÉS depuis la compat vérifiée (20/10, go Nolan « a + b »).
 * Pas écrits en base : la synchro Airtable (source de vérité SEO, décision 28/08) écraserait meta_title à chaque passage.
 * Générés, ils suivent la compat sans jamais se périmer. null = pas de compat vérifiée → l'appelant garde le texte en base.
 */
export const seoMeta = (part: PartDetail, scooters: CompatibleScooter[]): { title: string; description: string } | null => {
  const verified = scooters.filter((s) => s.status === "verified");
  if (!verified.length) return null;
  const groups = groupByBrand(verified);
  const top = topModels(groups, 3);
  const name = titleName(part.name);
  // Nom court : on ajoute les modèles les plus courts qui tiennent ; nom long (il cite souvent déjà des modèles) : raccourci seul.
  // Plafond 60 (Google tronque au-delà ; c'était 66 avant l'audit SEO du 24/10).
  const short = [...top].sort((a, b) => a.length - b.length);
  let title = fitTitle(name);
  if (name.length <= 44) {
    title = name;
    for (const m of short) { const t = `${title}${title === name ? " – " : ", "}${m}`; if (t.length <= TITLE_MAX) title = t; }
  }
  const n = verified.length;
  const more = groups.length > top.length ? `, sur ${groups.length} marques` : "";
  const description = clampDescription(`${name} : compatible avec ${n} trottinette${n > 1 ? "s" : ""}, dont ${listFr(top)}${more}. Compatibilité vérifiée ${matchBasis(part)}.`);
  return { title, description };
};

