import DOMPurify from "dompurify";

// Allowlist explicite : on conserve la structure SEO des descriptions générées
// (titres h2/h3/h4, paragraphes, listes, emphase, liens) et on supprime tout le reste.
const ALLOWED_TAGS = ["h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "br", "a"];
const ALLOWED_ATTR = ["href", "target", "rel"];

/**
 * Nettoie du HTML non fiable (descriptions produit générées par IA) avant
 * injection via dangerouslySetInnerHTML. Garde d'entrée : null/undefined/non-string → "".
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== "string" || !html) return "";
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}

/**
 * Strip TOTAL des balises HTML → texte brut. Pour les contextes qui n'acceptent
 * aucun markup (ex. description JSON-LD). Décode les entités via DOMPurify, puis
 * normalise les espaces. Garde d'entrée : null/undefined/non-string → "".
 */
export function stripHtml(html: string | null | undefined): string {
  if (typeof html !== "string" || !html) return "";
  const text = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return text.replace(/\s+/g, " ").trim();
}
