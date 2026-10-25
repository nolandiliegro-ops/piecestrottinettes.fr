/**
 * Nom affiché d'une trottinette (25/10/2026).
 * En base, 461 modèles sur 480 portent déjà la marque dans leur nom (« Teverun Fighter Mini Pro »).
 * Coller marque + nom donnait « Teverun Teverun Fighter Mini Pro » (capture iPhone de Nolan, accueil).
 * Règle : on ne préfixe la marque que si le nom ne commence pas déjà par elle.
 */
export const scooterFullName = (brand: string | null | undefined, name: string | null | undefined): string => {
  const n = (name ?? "").trim(), b = (brand ?? "").trim();
  if (!b) return n;
  return n.toLowerCase().startsWith(b.toLowerCase()) ? n : `${b} ${n}`.trim();
};
