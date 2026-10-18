/**
 * Recherche de trottinettes tolérante (18/10/2026 — « E twow » ne trouvait pas « E-Twow »).
 * - insensible à la casse, aux accents, aux espaces, tirets et points (« e twow », « etwow », « E-TWOW »),
 * - chaque mot tapé doit se retrouver dans « marque + modèle + mots-clés » (ordre libre : « g30 ninebot »),
 * - une faute de frappe tolérée sur les mots de 4 lettres et plus (« dualtorn », « kukrin »),
 * - classement : nom qui commence par la recherche > marque exacte > mot entier > contient > faute tolérée.
 */
const DIACRITICS = /[̀-ͯ]/g;
export const fold = (s: string): string => s.toLowerCase().normalize("NFD").replace(DIACRITICS, "");
/** « E-Twow GT SE » → « etwowgtse » */
export const compact = (s: string): string => fold(s).replace(/[^a-z0-9]/g, "");
const words = (s: string): string[] => fold(s).split(/[^a-z0-9]+/).filter(Boolean);

const oneEdit = (a: string, b: string): boolean => {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      // substitution ou inversion de 2 lettres
      if (a[i + 1] === b[j] && a[i] === b[j + 1]) {
        i += 2;
        j += 2;
        continue;
      }
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
};

export interface Searchable {
  name: string;
  brand?: string | null;
  slug?: string | null;
  terms?: string | null;
}

/** Score > 0 si l'objet correspond ; 0 sinon. */
export const scoreScooter = (q: string, s: Searchable): number => {
  const query = q.trim();
  if (!query) return 1;
  const cq = compact(query);
  if (!cq) return 1;
  const full = `${s.brand ?? ""} ${s.name} ${s.slug ?? ""}`;
  const cFull = compact(full);
  const cName = compact(s.name);
  const cBrand = compact(s.brand ?? "");
  const cTerms = compact(s.terms ?? "");
  const hayWords = words(`${full} ${s.terms ?? ""}`);

  if (cName.startsWith(cq) || compact(`${s.brand ?? ""}${s.name}`).startsWith(cq)) return 100;
  if (cBrand && cBrand === cq) return 90;
  if (cFull.includes(cq)) return 70;

  const qWords = words(query);
  let fuzzy = false;
  for (const w of qWords) {
    if (cFull.includes(w) || cTerms.includes(w)) continue;
    if (w.length >= 4 && hayWords.some((h) => oneEdit(w, h) || (h.length > w.length && oneEdit(w, h.slice(0, w.length))))) {
      fuzzy = true;
      continue;
    }
    return 0;
  }
  return fuzzy ? 20 : 50;
};

export const searchScooters = <T>(items: T[], q: string, pick: (t: T) => Searchable): T[] => {
  if (!q.trim()) return items;
  return items
    .map((t, i) => ({ t, i, sc: scoreScooter(q, pick(t)) }))
    .filter((x) => x.sc > 0)
    .sort((a, b) => b.sc - a.sc || a.i - b.i)
    .map((x) => x.t);
};
