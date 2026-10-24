// 25/10/2026 — Tenues de SKOT selon le calendrier (Nolan : « à Noël il met un bonnet… en fonction des événements »).
// Ajouter un événement = une ligne dans EVENTS (dates MM-JJ, bornes incluses). Le premier qui correspond gagne.
// Aperçu / visuels marketing : ?skotsaison=noel|halloween|ete|soldes|fete (gardé pour l'onglet), ?skotsaison=0 = aucune.
// Images : public/skot/p-<id>.webp (480 px) ; sources HD 1024 px dans le document projet claude/skot-poses-25-10.md.

export type SkotSaison = "halloween" | "noel" | "ete" | "soldes" | "fete";

const EVENTS: { id: SkotSaison; from: string; to: string }[] = [
  { id: "halloween", from: "10-24", to: "11-01" },
  { id: "noel", from: "12-01", to: "12-31" },
  { id: "soldes", from: "01-07", to: "02-03" }, // soldes d'hiver (dates approximatives, à caler chaque année)
  { id: "soldes", from: "06-24", to: "07-21" }, // soldes d'été (idem)
  { id: "ete", from: "07-22", to: "08-31" },
  // Exemple pour le jour d'ouverture du shop : { id: "fete", from: "11-15", to: "11-17" },
];

export const SAISON_TEXTE: Record<SkotSaison, [string, string]> = {
  halloween: ["Bouh !", "Même déguisé, je connais toutes les compat."],
  noel: ["Ho ho ho !", "Une pièce sous le sapin ? Dis-moi ta trott."],
  ete: ["Salut l'été !", "Avant la balade, on vérifie les pneus ?"],
  soldes: ["C'est les soldes !", "Dis-moi ta trott, je te trouve la bonne pièce."],
  fete: ["C'est la fête !", "Dis-moi ta trott, je m'occupe du reste."],
};

const IDS: SkotSaison[] = ["halloween", "noel", "ete", "soldes", "fete"];

export function skotSaison(d: Date = new Date()): SkotSaison | null {
  try {
    const q = new URLSearchParams(window.location.search).get("skotsaison");
    if (q !== null) window.sessionStorage.setItem("pt-skot-saison", q);
    const forced = q ?? window.sessionStorage.getItem("pt-skot-saison");
    if (forced === "0") return null;
    if (forced && (IDS as string[]).includes(forced)) return forced as SkotSaison;
  } catch { /* stockage indisponible : calendrier seul */ }
  const md = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return EVENTS.find((e) => md >= e.from && md <= e.to)?.id ?? null;
}
