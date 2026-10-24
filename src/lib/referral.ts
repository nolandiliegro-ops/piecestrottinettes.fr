/**
 * Programme ambassadeurs (24/10/2026) — lien créateur `?ref=CODE`.
 * Le code est mémorisé 30 jours dans le navigateur : il pré-remplit et applique le code promo
 * dans la fenêtre de paiement, et il est transmis à l'inscription Rider (profiles.referred_by).
 * Le code fait foi : c'est lui que le serveur valide (create-checkout-session), pas ce stockage.
 */
import { supabase } from '@/integrations/supabase/client';

const KEY = 'pt-ref';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type PromoCheck = {
  valid: boolean;
  code: string | null;
  discount_type: string | null;
  discount_value: number | null;
  max_discount_eur: number | null;
  reason: 'ok' | 'invalide' | 'expire' | 'pas_encore' | 'epuise' | string;
};

export function normalizeCode(raw: string | null | undefined): string | null {
  const c = (raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 30);
  return c.length >= 2 ? c : null;
}

/** Lit `?ref=` dans l'URL et le mémorise (le dernier lien cliqué gagne). */
export function captureRefFromSearch(search: string): string | null {
  let code: string | null = null;
  try {
    code = normalizeCode(new URLSearchParams(search).get('ref'));
  } catch {
    return null;
  }
  if (!code) return null;
  try {
    localStorage.setItem(KEY, JSON.stringify({ code, ts: Date.now() }));
  } catch {
    /* stockage indisponible (navigation privée) : on ignore */
  }
  return code;
}

/** Code créateur mémorisé, s'il a moins de 30 jours. */
export function getStoredRef(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, ts } = JSON.parse(raw) as { code?: string; ts?: number };
    if (!code || !ts || Date.now() - ts > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return normalizeCode(code);
  } catch {
    return null;
  }
}

/** Identifiant aléatoire du navigateur (aucune donnée personnelle) : sert seulement à ne compter qu'un clic par 24 h. */
function visitorId(): string {
  try {
    let v = localStorage.getItem('pt-visitor');
    if (!v) {
      v = (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);
      localStorage.setItem('pt-visitor', v);
    }
    return v;
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

/** Compte un clic sur un lien créateur (la base ignore les codes inconnus et les doublons de 24 h). */
export async function logRefVisit(code: string): Promise<void> {
  try {
    await (supabase as any).rpc('log_ref_visit', { p_code: code, p_visitor: visitorId() });
  } catch {
    /* un clic non compté ne doit jamais gêner la navigation */
  }
}

/** Vérifie un code côté base (fonction check_promo_code, invités compris). */
export async function checkPromoCode(code: string): Promise<PromoCheck | null> {
  const { data, error } = await (supabase as any).rpc('check_promo_code', { p_code: code });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    ...row,
    discount_value: row.discount_value != null ? Number(row.discount_value) : null,
    max_discount_eur: row.max_discount_eur != null ? Number(row.max_discount_eur) : null,
  } as PromoCheck;
}
