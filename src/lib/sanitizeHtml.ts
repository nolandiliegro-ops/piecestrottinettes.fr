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
