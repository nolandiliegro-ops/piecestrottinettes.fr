/**
 * Partenaires d'achat des trottinettes (18/10/2026). On ne vend pas de trottinettes : on recommande un vendeur
 * que l'atelier connaît, par un lien partenaire. Le lien vit en base (scooter_models.affiliate_link, champ admin) ;
 * ce fichier ne donne que le nom affiché à partir du domaine du lien.
 * ⚠️ Un lien sans paramètre de suivi ne rapporte rien : le bloc s'affiche quand même, mais le suivi est à poser.
 */
export interface Partner { name: string; note?: string }

export const PARTNERS: Record<string, Partner> = {
  "dualtron-store.com": { name: "Dualtron Store" },
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
