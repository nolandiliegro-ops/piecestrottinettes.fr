/**
 * 23/10/2026 — compteur des clics partenaires (table public.affiliate_clicks, visiteurs : insertion seulement).
 * Un seul écouteur sur le document attrape TOUT lien rel="sponsored" (fiche, showroom, blog, variantes du bloc
 * partenaire) : aucun bouton à modifier, et le lien reste direct vers le partenaire (suivi Awin / GoAffPro intact).
 * Les liens partenaires s'ouvrent dans un nouvel onglet : la page reste ouverte, l'insertion a le temps de partir.
 * Échec réseau = silence : un clic non compté ne doit jamais gêner le visiteur.
 */
import { supabase } from "@/integrations/supabase/client";

const hostOf = (raw: string): string | null => {
  try { return new URL(raw).hostname.replace(/^www\./, ""); } catch { return null; }
};

/** Boutique réelle derrière un lien de suivi Awin (`ued=`), sinon le domaine du lien. */
const shopHostOf = (raw: string): string | null => {
  try {
    const u = new URL(raw);
    const ued = u.searchParams.get("ued");
    if (/(^|\.)awin1\.com$/.test(u.hostname) && ued) return hostOf(ued);
    return u.hostname.replace(/^www\./, "");
  } catch { return null; }
};

const scooterSlugOf = (path: string): string | null => {
  const m = path.match(/^\/(?:scooter|showroom)\/([a-z0-9-]+)/);
  return m ? m[1] : null;
};

let installed = false;

export function installAffiliateClickTracker(): void {
  if (installed || typeof document === "undefined") return;
  installed = true;
  const onClick = (e: MouseEvent) => {
    if (e.type === "auxclick" && e.button !== 1) return;
    const a = (e.target as Element | null)?.closest?.("a[rel~='sponsored']") as HTMLAnchorElement | null;
    if (!a?.href) return;
    const target = hostOf(a.href);
    if (!target) return;
    const path = window.location.pathname.slice(0, 300);
    const row = {
      page_path: path || "/",
      target_host: target.slice(0, 120),
      shop_host: shopHostOf(a.href)?.slice(0, 120) ?? null,
      scooter_slug: scooterSlugOf(path),
      placement: (a.dataset.placement || "").slice(0, 40) || null,
    };
    // La table n'est pas dans les types générés : cast local, insertion sans attendre la réponse.
    void (supabase as unknown as { from: (t: string) => { insert: (r: object) => Promise<unknown> } })
      .from("affiliate_clicks").insert(row).then(() => undefined, () => undefined);
  };
  document.addEventListener("click", onClick, { capture: true });
  document.addEventListener("auxclick", onClick, { capture: true });
}
