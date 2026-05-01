/**
 * Le Veilleur — Helpers (slug, normalisation).
 */

export function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

export function buildScooterSlug(brand, name, variant) {
  return slugify([brand, name, variant].filter(Boolean).join(' '));
}

export function buildPartSlug(name, brand) {
  return slugify([brand, name].filter(Boolean).join(' '));
}
