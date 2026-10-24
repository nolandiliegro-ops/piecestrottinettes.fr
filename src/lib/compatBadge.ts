/**
 * Badge « compatible » des cartes pièce + raccord trottinette ↔ nombre de pièces (24/10/2026 soir).
 * Nolan : « quand je sélectionne la trottinette, il faut le badge compatible », « les pièces compatibles
 * s'affichent en premier avec le beau badge, pas un badge de merde », et la M365 n'affichait aucun pneu plein
 * (6 pneus pleins « à confirmer » masqués par le filtre « vérifiées seulement »).
 *
 * ?badge=1..5 → 5 propositions ; sans paramètre : DEFAULT_BADGE (null = comportement d'avant).
 * Quand un badge est actif : badge visible aussi en vue filtrée, pièces « à confirmer » montrées APRÈS les
 * vérifiées sous un intertitre, compteurs des familles recalculés pour la trottinette choisie.
 *
 * 1 ÉTIQUETTE   · étiquette carbone à coin coupé « ✓ Compatible » + modèle, posée au pied de la photo
 * 2 LISERÉ      · la carte entière cerclée de vert + ruban « Va sur ta Mi M365 » en haut de la plaque
 * 3 MÉDAILLON   · rond vert coché sur le bord de la photo + « Compatible » en vert à côté du prix
 * 4 BANDEAU     · bande pleine largeur sous la photo, beige foncé : « ✓ Va sur ta Xiaomi Mi M365 »
 * 5 SCEAU       · tampon « Vérifié atelier » contour vert, légèrement incliné, dans le coin de la photo
 */
export type BadgeLook = 1 | 2 | 3 | 4 | 5;

/** Variante en prod sans paramètre (null tant que Nolan n'a pas choisi). */
export const DEFAULT_BADGE: BadgeLook | null = null;

export const readBadgeLook = (): BadgeLook | null => {
  try {
    const v = new URLSearchParams(window.location.search).get("badge");
    if (v === null) return DEFAULT_BADGE;
    const n = Number(v);
    return n >= 1 && n <= 5 ? (n as BadgeLook) : null;
  } catch {
    return DEFAULT_BADGE;
  }
};
