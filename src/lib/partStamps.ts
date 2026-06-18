// src/lib/partStamps.ts
// Logique partagee des stamps produit (BEST / SECU / NOUVEAU).
// Source unique : importe par PartCard (catalogue) et, a terme, PartCardSlim (home).

export type BadgeKind = "BEST" | "SÉCU" | "NOUVEAU" | null;

// Categories "securite" (freinage / visibilite / protection). Liste alignee sur PartCardSlim.
export const SECU_SLUGS = new Set<string>([
  "plaquettes",
  "disques-plaquettes",
  "casques",
  "eclairage",
]);

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Entree structurelle minimale : marche pour CataloguePart (sans created_at)
// comme pour CompatiblePartRich (avec created_at). created_at absent => NOUVEAU jamais.
export interface StampInput {
  is_featured?: boolean | null;
  category?: { slug?: string | null } | null;
  created_at?: string | null;
}

// Priorite stricte : BEST > SECU > NOUVEAU. Un seul stamp a la fois.
export function pickBadge(part: StampInput): BadgeKind {
  if (part.is_featured === true) return "BEST";
  const catSlug = part.category?.slug ?? "";
  if (SECU_SLUGS.has(catSlug)) return "SÉCU";
  if (part.created_at) {
    const createdMs = new Date(part.created_at).getTime();
    if (!Number.isNaN(createdMs) && Date.now() - createdMs < THIRTY_DAYS_MS) {
      return "NOUVEAU";
    }
  }
  return null;
}

// Metadonnees de rendu :
// - full      : couleur pleine (theme sombre, ex. PartCardSlim)
// - lightText : texte assombri (theme clair, ex. catalogue)
// - label     : libelle affiche
export const STAMP_META: Record<Exclude<BadgeKind, null>, { full: string; lightText: string; label: string }> = {
  BEST: { full: "#D4AF37", lightText: "#8a6a12", label: "Best" },
  "SÉCU": { full: "#9AA6B4", lightText: "#566071", label: "Sécu" },
  NOUVEAU: { full: "#4A7C59", lightText: "#3a6449", label: "Nouveau" },
};

// hex (#RRGGBB) -> rgba(r,g,b,alpha) pour fills/bordures teintes.
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
