/**
 * Bornes Google des balises (audit SEO 24/10) : title 30-60 caractères, meta description 70-160.
 * Module sans React, importé par les pages (règle : toute fonction appelée par une page vit dans src/lib).
 */

export const TITLE_MAX = 60;
export const DESC_MAX = 158;

/**
 * Titre ≤ max. Trop long : on garde le début ET la fin (« … » au milieu), car la fin porte souvent ce qui distingue
 * deux fiches voisines (couleur, matière, connecteur) — couper la fin seule fabrique des titres en doublon.
 */
export const fitTitle = (t: string, max = TITLE_MAX): string => {
  if (t.length <= max) return t;
  const w = t.split(" ");
  const tail: string[] = [];
  while (w.length > 1 && [...tail, w[w.length - 1]].join(" ").length <= 22) tail.unshift(w.pop() as string);
  const end = tail.join(" ");
  const room = max - end.length - 3;
  const head: string[] = [];
  for (const x of w) {
    if ([...head, x].join(" ").length > room) break;
    head.push(x);
  }
  return `${head.join(" ").replace(/[,;:\s–/-]+$/, "")} … ${end}`;
};

/** Premier titre de la liste qui tient dans la borne, sinon le dernier raccourci. */
export const firstFitting = (candidates: string[], max = TITLE_MAX): string =>
  candidates.find((c) => c.length <= max) ?? fitTitle(candidates[candidates.length - 1], max);

/** Description ≤ max, coupée sur un mot, avec « … ». */
export const clampDescription = (t: string, max = DESC_MAX): string => {
  const s = t.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const c = s.slice(0, max - 1);
  const sp = c.lastIndexOf(" ");
  return `${(sp > max * 0.6 ? c.slice(0, sp) : c).replace(/[,;:\s–-]+$/, "")}…`;
};

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const COLOR_WORD = /\b(noir|rouge|bleu|vert|blanc|jaune|orange|gris|violet|rose|dore|argent)\b/;

/**
 * Un meta_title saisi en base n'est publié que s'il est dans les bornes ET parle de la pièce (il contient le premier mot
 * du nom). Écarte les titres scrapés génériques (« Fournisseur pièces détachées trottinette électrique ») et les
 * titres-références trop courts (« Pneu 200x50-4 »).
 */
export const usableMetaTitle = (meta: string | null | undefined, name: string): string | null => {
  const m = meta?.trim();
  if (!m || m.length < 30 || m.length > TITLE_MAX) return null;
  const fm = fold(m), fn = fold(name);
  // Nom coupé avant la couleur (« … jante 34 mm » pour « … jante 34 mm liseré bleu eWheel ») : les variantes auraient
  // le même titre → on laisse le titre construit, qui garde la fin du nom.
  if (fn.length > fm.length && fn.startsWith(fm) && COLOR_WORD.test(fn.slice(fm.length))) return null;
  const first = fn.match(/[a-z]{3,}/)?.[0];
  return first && fm.includes(first) ? m : null;
};

/** Meta description en base publiée seulement si elle est dans les bornes 70-160. */
export const usableMetaDescription = (meta: string | null | undefined): string | null => {
  const m = meta?.trim();
  return m && m.length >= 70 && m.length <= 160 ? m : null;
};
