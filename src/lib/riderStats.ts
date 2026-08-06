// Carte Rider v7 — fonctions pures de calcul (aucun appel réseau)

export type RarityKey = "commune" | "peu" | "rare" | "epique" | "legendaire";

export interface RarityPalette {
  key: RarityKey;
  label: string;
  c1: string;
  c3: string;
  tint: string;
}

const RARITIES: Record<RarityKey, RarityPalette> = {
  commune: { key: "commune", label: "Commune", c1: "#9AA5B1", c3: "#333B44", tint: "#3E4854" },
  peu: { key: "peu", label: "Peu commune", c1: "#6FAE82", c3: "#2C4C36", tint: "#33563D" },
  rare: { key: "rare", label: "Rare", c1: "#5FB4D4", c3: "#1E4A5E", tint: "#2A5C74" },
  epique: { key: "epique", label: "Épique", c1: "#A78BFA", c3: "#3F2F80", tint: "#463480" },
  legendaire: { key: "legendaire", label: "Légendaire", c1: "#FFD86B", c3: "#6B4708", tint: "#5C4416" },
};

/** Rareté dérivée de la puissance en watts. */
export const getRarity = (watts?: number | null): RarityPalette => {
  const w = watts ?? 0;
  if (w >= 3000) return RARITIES.legendaire;
  if (w >= 2000) return RARITIES.epique;
  if (w >= 1000) return RARITIES.rare;
  if (w >= 500) return RARITIES.peu;
  return RARITIES.commune;
};

export const getAllRarities = (): RarityPalette[] => Object.values(RARITIES);

export interface StatMod {
  order_item_id?: string | null;
}

/** Holo : au moins une pièce montée, et 100 % viennent d'une commande du site. */
export const isHolo = (mods: StatMod[] | null | undefined): boolean => {
  if (!mods || mods.length === 0) return false;
  return mods.every((m) => !!m.order_item_id);
};

export interface StatMachine {
  id: string;
  power_watts?: number | null;
}

export interface GarageStats {
  totalWatts: number;
  totalMods: number;
  siteMods: number;
  holoCount: number;
  machineCount: number;
}

/**
 * Statistiques globales du garage.
 * @param machines machines du garage
 * @param mods modifications indexées par id de machine (user_garage.id)
 */
export const computeGarageStats = (
  machines: StatMachine[],
  mods: Record<string, StatMod[]>,
): GarageStats => {
  let totalWatts = 0;
  let totalMods = 0;
  let siteMods = 0;
  let holoCount = 0;

  for (const machine of machines) {
    totalWatts += machine.power_watts ?? 0;
    const list = mods[machine.id] ?? [];
    totalMods += list.length;
    siteMods += list.filter((m) => !!m.order_item_id).length;
    if (isHolo(list)) holoCount += 1;
  }

  return { totalWatts, totalMods, siteMods, holoCount, machineCount: machines.length };
};

/** Formate une puissance en kW au-delà de 1000 W. */
export const formatWatts = (watts: number): string =>
  watts >= 1000 ? `${(watts / 1000).toFixed(watts % 1000 === 0 ? 0 : 1)} kW` : `${watts} W`;

const ICON_RULES: Array<[RegExp, string]> = [
  [/batterie|accu|cellule/i, "🔋"],
  [/pneu|chambre|roue|jante/i, "🛞"],
  [/frein|plaquette|disque|étrier|etrier/i, "🛑"],
  [/contr[oô]leur|moteur|transmission/i, "⚙️"],
  [/charge|chargeur|alimentation/i, "🔌"],
  [/phare|led|lumi[eè]re|feu/i, "💡"],
  [/guidon|poign[eé]e|potence|pliage/i, "🔧"],
  [/suspension|amortisseur/i, "🌀"],
  [/[eé]cran|compteur|afficheur/i, "📊"],
  [/garde-boue|carrosserie|coque|deck/i, "🛡️"],
];

/** Icône du mod dérivée du nom de la catégorie de la pièce. */
export const modIconForCategory = (categoryName?: string | null): string => {
  if (!categoryName) return "🔧";
  for (const [pattern, icon] of ICON_RULES) {
    if (pattern.test(categoryName)) return icon;
  }
  return "🔧";
};

export const MOODS: Record<string, string> = {
  daily: "🛣️ Ma daily",
  fini: "⚡ Build fini",
  chantier: "🔧 En chantier",
  rodage: "🔩 En rodage",
  saison: "🏁 Prête pour la saison",
};

export const moodLabel = (key?: string | null): string => MOODS[key ?? "fini"] ?? MOODS.fini;
