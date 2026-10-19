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
}

export const PARTNERS: Record<string, Partner> = {
  "dualtron-store.com": {
    name: "Dualtron Store",
    tagline: "La boutique officielle Dualtron en France",
    perks: [
      { title: "Officiel", text: "Trottinettes et pièces 100 % officielles, réparation Dualtron" },
      { title: "Paris & Le Mans", text: "2 boutiques avec showroom et atelier : tu peux l'essayer" },
      { title: "Jusqu'à 60 fois", text: "Paiement en 2, 3, 4 ou 10 fois (Alma), jusqu'à 60 fois (Younited)" },
    ],
  },
};

export const partnerOf = (url?: string | null): (Partner & { host: string }) | null => {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return { host, ...(PARTNERS[host] ?? { name: host }) };
  } catch {
    return null;
  }
};
