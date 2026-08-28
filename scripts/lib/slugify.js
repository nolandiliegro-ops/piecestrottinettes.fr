/**
 * Slug canonique — implémentation UNIQUE du repo (famille B).
 *
 * Reprend au caractère près le slugify historique de PartsManager.tsx :
 * toLowerCase → NFD → suppression des diacritiques → [^a-z0-9]+ → "-" → trim
 * des tirets de tête/queue. « Chambre à air 10x2.125 » → "chambre-a-air-10x2-125".
 *
 * Le point est remplacé par un tiret, jamais supprimé : "10x2.75" → "10x2-75".
 *
 * Périmètre : front (src/) et scripts Node. Les Edge Functions (Deno) ne peuvent
 * pas importer hors de supabase/functions/ — elles gardent leur copie locale.
 * N'est PAS destiné aux normalisations de recherche ([^a-z0-9] → "", sans tiret).
 */

// Écrit via new RegExp plutôt qu'en littéral : les diacritiques combinants sont
// invisibles dans le source. Même convention que scripts/lib/validate-part-keys.js.
const DIACRITICS_RE = new RegExp('[\\u0300-\\u036f]', 'g');

/**
 * @param {unknown} input
 * @param {{ maxLength?: number }} [options] maxLength tronque PUIS re-trim le
 *   tiret final, pour ne jamais produire un slug qui se termine par "-".
 * @returns {string}
 */
export function slugify(input, { maxLength } = {}) {
  const slug = String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  if (!maxLength || slug.length <= maxLength) return slug;
  return slug.slice(0, maxLength).replace(/-+$/, '');
}
