/**
 * Partenaires d'achat des trottinettes (18/10/2026). On ne vend pas de trottinettes : on recommande un vendeur
 * que l'atelier connaît, par un lien partenaire. Le lien vit en base (scooter_models.affiliate_link, champ admin) ;
 * ce fichier donne le nom affiché et la vitrine du partenaire à partir du domaine du lien.
 * ⚠️ Un lien sans paramètre de suivi ne rapporte rien : le bloc s'affiche quand même, mais le suivi est à poser.
 * 19/10 : vitrine (accroche + atouts). Uniquement des faits lus sur le site du partenaire, jamais inventés :
 * dualtron-store.com (lu le 19/10) = « boutique officielle » FR, pièces 100 % officielles, réparation,
 * 2 boutiques Paris + Le Mans avec showroom et atelier (essai), paiement Alma 2/3/4/10 fois, Younited 10 à 60 fois.
 * ⚠️ dualtron-shop.com est une AUTRE société (Nolan, 19/10) : jamais présentée comme notre partenaire.
 */
export interface PartnerPerk { title: string; text: string }
export interface Partner {
  name: string;
  note?: string;
  /** Une ligne sous le nom : ce que le partenaire est. */
  tagline?: string;
  /** 3 atouts maximum, vérifiés sur le site du partenaire. */
  perks?: PartnerPerk[];
  /** Logo du partenaire (public/partners/…), utilisé avec son accord. */
  logo?: string;
  /** 24/10/2026 — arguments courts affichés sous le prix dans « Où acheter » (2 à 3, lus sur le site du
   *  partenaire le jour indiqué, jamais inventés ; à relire si la boutique change ses conditions). */
  atouts?: string[];
}

export const PARTNERS: Record<string, Partner> = {
  "dualtron-store.com": {
    name: "Dualtron Store",
    tagline: "La boutique officielle Dualtron en France",
    logo: "/partners/dualtron-store.webp",
    atouts: ["Boutique officielle Dualtron", "2 boutiques avec atelier, Paris et Le Mans", "Paiement jusqu'à 60 fois"],
    perks: [
      { title: "Officiel", text: "Trottinettes et pièces 100 % officielles, réparation Dualtron" },
      { title: "Paris & Le Mans", text: "2 boutiques avec showroom et atelier : tu peux l'essayer" },
      { title: "Jusqu'à 60 fois", text: "Paiement en 2, 3, 4 ou 10 fois (Alma), jusqu'à 60 fois (Younited)" },
    ],
  },
};

/**
 * 22/10/2026 — liens Awin (awin1.com/cread.php?…&ued=<url boutique>) : le domaine du lien est celui du tracker,
 * pas de la boutique. On lit la boutique réelle dans `ued` (sinon le bouton affichait « Voir chez awin1.com »).
 * Boutiques des programmes Awin acceptés le 22/10 : sites officiels des marques (lus le 22/10).
 */
const OFFICIAL = (name: string, atouts?: string[]): Partner => ({ name, tagline: "Boutique officielle de la marque", ...(atouts ? { atouts } : {}) });
Object.assign(PARTNERS, {
  "mi.com": OFFICIAL("Xiaomi France"),
  "iscooter.fr": OFFICIAL("iScooter France", ["Livraison gratuite en France", "Paiement en 3 ou 4 fois sans frais", "Retour sous 30 jours"]),
  "naveetech.fr": OFFICIAL("NAVEE France", ["Garantie jusqu'à 3 ans", "Paiement plus tard avec Klarna, 0 % d'intérêt"]),
  "isinwheel.fr": OFFICIAL("isinwheel France", ["Livraison gratuite en 2 à 3 jours", "Paiement en 3 fois sans frais", "Garantie jusqu'à 24 mois"]),
  // 24/10/2026 — atouts lus le 24/10 sur la page d'accueil ou les conditions de chaque boutique (mi.com : aucun).
  // 23/10/2026 — GoAffPro : boutique EU officielle de la marque (livraison FR lue dans /meta.json).
  "haloknights.com": OFFICIAL("HALO KNIGHT Europe", ["Livraison gratuite"]),
  "teverunshop.com": OFFICIAL("Teverun Europe", ["Expédiée sous 1 à 2 jours ouvrés", "Retour sous 14 jours"]),
  "fr.engwe.com": OFFICIAL("ENGWE France", ["Livraison gratuite en 2 à 5 jours", "Expédiée depuis la France ou la Pologne", "Retour sous 30 jours"]),
  // 24/10/2026 — GoAffPro OOTD (o-otd.com, boutique officielle, livraison FR prouvée le 24/10).
  "o-otd.com": OFFICIAL("OOTD", ["Garantie 2 ans", "Retour sous 30 jours"]),
  // 24/10/2026 — Amazon Partenaires : dernier recours, posé à la main par Nolan sur les fiches sans autre offre.
  "amazon.fr": { name: "Amazon" },
});

const shopUrlOf = (url: string): URL => {
  const u = new URL(url);
  const ued = u.searchParams.get("ued");
  if (/(^|\.)awin1\.com$/.test(u.hostname) && ued) {
    try { return new URL(ued); } catch { /* lien Awin mal formé : on garde le domaine du tracker */ }
  }
  return u;
};

export const partnerOf = (url?: string | null): (Partner & { host: string }) | null => {
  if (!url) return null;
  try {
    const host = shopUrlOf(url).hostname.replace(/^www\./, "");
    return { host, ...(PARTNERS[host] ?? { name: host }) };
  } catch {
    return null;
  }
};
