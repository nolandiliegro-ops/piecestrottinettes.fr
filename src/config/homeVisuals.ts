/**
 * 29/10/2026 (Nolan) — visuels du menu téléphone (4 tuiles) et des 3 portes « L'Atelier » en bas de l'accueil.
 * Défaut constaté : 3 photos sur 7 en double (plaquettes, Dualtron, Navee) et des plaquettes jugées trop grosses.
 * 5 jeux proposés, sans aucune répétition à l'intérieur d'un jeu, à comparer avec ?visuels=1..5 (0 = actuel).
 * Choix de Nolan le 29/10 : jeu 1 « Catalogue », en ligne par défaut.
 */
export type VisualSet = {
  menu: Record<"/catalogue" | "/trottinettes" | "/marques" | "/atelier", string>;
  doors: { question: string; videos: string; guides: string };
  /** Logo de la marque photographiée sur la tuile Marques (plaque blanche en haut à droite). */
  marqueLogo?: string;
};

const V = "/visuels/";
const BH = "/brand-heroes/";
const MENU_BASE = { "/trottinettes": `${BH}navee.webp`, "/marques": `${BH}dualtron.webp`, "/atelier": `${BH}xiaomi.webp` } as const;

export const VISUAL_SETS: Record<number, VisualSet> = {
  0: { menu: { "/catalogue": "/categories/plaquettes-a.webp", ...MENU_BASE }, doors: { question: "/categories/plaquettes-a.webp", videos: `${BH}dualtron.webp`, guides: `${BH}navee.webp` } },
  // 2e tour (29/10, Nolan) : Pièces = des pièces seules, jamais une trottinette ; L'Atelier = un vrai atelier, pas une rue ;
  // Marques = la Dualtron avec le logo Dualtron intégré.
  1: { menu: { "/catalogue": `${V}p5-grille.webp`, "/trottinettes": MENU_BASE["/trottinettes"], "/marques": MENU_BASE["/marques"], "/atelier": `${V}a1-atelier.webp` }, doors: { question: `${V}q1-mecano.webp`, videos: `${V}v1-tournage.webp`, guides: `${V}g1-comparer.webp` }, marqueLogo: `${V}logo-dualtron.png` },
  2: { menu: { "/catalogue": `${V}p2-etabli.webp`, "/trottinettes": MENU_BASE["/trottinettes"], "/marques": MENU_BASE["/marques"], "/atelier": `${V}a3-mur-outils.webp` }, doors: { question: `${V}q2-message.webp`, videos: `${V}v2-camera.webp`, guides: `${V}g2-carnet.webp` }, marqueLogo: `${V}logo-dualtron.png` },
  3: { menu: { "/catalogue": `${V}p3-panneau.webp`, "/trottinettes": MENU_BASE["/trottinettes"], "/marques": MENU_BASE["/marques"], "/atelier": `${V}a2-etabli-outils.webp` }, doors: { question: `${V}q1-mecano.webp`, videos: `${V}v1-tournage.webp`, guides: `${V}g2-carnet.webp` }, marqueLogo: `${V}logo-dualtron.png` },
  4: { menu: { "/catalogue": `${V}p5-grille.webp`, "/trottinettes": MENU_BASE["/trottinettes"], "/marques": MENU_BASE["/marques"], "/atelier": `${V}a3-mur-outils.webp` }, doors: { question: `${V}q2-message.webp`, videos: `${V}v1-tournage.webp`, guides: `${V}g1-comparer.webp` }, marqueLogo: `${V}logo-dualtron.png` },
  5: { menu: { "/catalogue": `${V}p2-etabli.webp`, "/trottinettes": MENU_BASE["/trottinettes"], "/marques": MENU_BASE["/marques"], "/atelier": `${V}a1-atelier.webp` }, doors: { question: `${V}q1-mecano.webp`, videos: `${V}v2-camera.webp`, guides: `${V}g2-carnet.webp` }, marqueLogo: `${V}logo-dualtron.png` },
};

/** Jeu choisi par ?visuels=N (0..5), sinon le jeu en ligne. */
export const DEFAULT_VISUAL_SET = 1; // 29/10 : « Catalogue » validé par Nolan, en ligne pour tous (?visuels=0 = ancien jeu)
export const visualSet = (): VisualSet => {
  try {
    // 29/10 : sans paramètre, get() renvoie null et Number(null) = 0 → l'ancien jeu s'affichait. On teste la présence d'abord.
    const raw = new URLSearchParams(window.location.search).get("visuels");
    const n = raw === null || raw === "" ? NaN : Number(raw);
    if (Number.isInteger(n) && VISUAL_SETS[n]) return VISUAL_SETS[n];
  } catch { /* SSR / pas de window */ }
  return VISUAL_SETS[DEFAULT_VISUAL_SET];
};
