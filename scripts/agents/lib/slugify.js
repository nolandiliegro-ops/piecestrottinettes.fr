/**
 * Le Veilleur — Helpers (slug, normalisation).
 *
 * L'implémentation vit dans scripts/lib/slugify.js (module canonique du repo).
 * Ici on ne fait qu'appliquer la troncature à 80 propre au veilleur.
 */

import { slugify as canonicalSlugify } from '../../lib/slugify.js';

export function slugify(str) {
  return canonicalSlugify(str, { maxLength: 80 });
}

export function buildScooterSlug(brand, name, variant) {
  return slugify([brand, name, variant].filter(Boolean).join(' '));
}

export function buildPartSlug(name, brand) {
  return slugify([brand, name].filter(Boolean).join(' '));
}
