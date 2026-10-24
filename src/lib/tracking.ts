// Liens de suivi colis — source UNIQUE côté front (lot livraison, 24/10/2026).
// ⚠️ Gabarits DUPLIQUÉS dans supabase/functions/send-shipping-email/index.ts : tenir en phase.
// Un lien collé à la main (orders.tracking_url) passe toujours avant le gabarit.

export const CARRIERS = [
  { id: "colissimo", label: "Colissimo / La Poste" },
  { id: "chronopost", label: "Chronopost" },
  { id: "mondial_relay", label: "Mondial Relay" },
  { id: "dpd", label: "DPD" },
  { id: "ups", label: "UPS" },
  { id: "gls", label: "GLS" },
  { id: "autre", label: "Autre (coller le lien)" },
] as const;

export type CarrierId = (typeof CARRIERS)[number]["id"];

const TEMPLATES: Partial<Record<CarrierId, (n: string) => string>> = {
  colissimo: (n) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${n}`,
  chronopost: (n) => `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${n}`,
  mondial_relay: (n) => `https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition=${n}`,
  dpd: (n) => `https://trace.dpd.fr/fr/trace/${n}`,
  ups: (n) => `https://www.ups.com/track?loc=fr_FR&tracknum=${n}`,
  gls: (n) => `https://gls-group.com/FR/fr/suivi-colis?match=${n}`,
};

export function carrierLabel(carrier: string | null | undefined): string | null {
  return CARRIERS.find((c) => c.id === carrier)?.label ?? null;
}

/** Lien de suivi à afficher, ou null si on ne peut pas en construire un fiable. */
export function trackingLink(order: {
  carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
}): string | null {
  if (order.tracking_url && order.tracking_url.startsWith("https://")) return order.tracking_url;
  const n = order.tracking_number?.trim();
  const tpl = order.carrier ? TEMPLATES[order.carrier as CarrierId] : undefined;
  return n && tpl ? tpl(encodeURIComponent(n)) : null;
}
