/**
 * Pouce d'une roue (23/10/2026) — sert à n'afficher au client que les tailles de pneu
 * de SON diamètre dans « Lis la taille sur ton pneu ». Affichage seulement : le moteur
 * de compatibilité ne lit pas ces fonctions (il lit rim_diameter_code / tire_section_code).
 */

const num = (s: string) => parseFloat(s.replace(",", "."));
const half = (n: number) => Math.round(n * 2) / 2;

/** Diamètre extérieur (pouces, arrondi au demi) d'une taille « section + jante » telle qu'elle est en base. */
export const inchOfSize = (section: string, rim: string): number | null => {
  const s = section.toLowerCase().replace(/\s+/g, "").replace(/×/g, "x").replace(/,/g, ".");
  // 10x2.50, 8.5x3, 14x1.95 → le premier nombre est le pouce ; 200x50, 250x64 → millimètres.
  let m = s.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
  if (m) {
    const a = num(m[1]);
    if (a >= 100) return half(a / 25.4);
    if (a <= 20) return half(a);
    return null;
  }
  // 60/70, 90/65, 130/40 + jante 6.5 → jante + 2 × flanc (largeur × rapport).
  m = s.match(/^(\d{2,3})\/(\d{2})$/);
  const r = num(rim);
  if (m && !Number.isNaN(r) && r > 3 && r < 20) {
    const mm = r * 25.4 + (2 * num(m[1]) * num(m[2])) / 100;
    return half(mm / 25.4);
  }
  return null;
};

/** Pouce lu dans le texte libre `scooter_models.tire_size` (« 10 pouces tubeless », « 200 mm (8") », « 130/40-6,5 »). */
export const inchOfScooter = (tireSize?: string | null): number | null => {
  if (!tireSize) return null;
  const t = tireSize.replace(/,/g, ".");
  const metric = t.match(/(\d{2,3})\/(\d{2})\s*-\s*(\d+(?:\.\d+)?)/);
  if (metric) return inchOfSize(`${metric[1]}/${metric[2]}`, metric[3]);
  const first = t.match(/(\d+(?:\.\d+)?)/);
  if (!first) return null;
  const n = num(first[1]);
  if (n >= 100 && n <= 400) return half(n / 25.4);
  if (n >= 5 && n <= 20) return half(n);
  return null;
};

/** Vrai si le constructeur écrit cette section (« 10x3.0 » ≙ « 10x3.00 ») : on met sa taille en tête. */
export const isMakerSection = (section: string, tireSize?: string | null): boolean => {
  if (!tireSize) return false;
  const pair = (s: string) => s.replace(/,/g, ".").replace(/\s+/g, "").toLowerCase().match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/);
  const a = pair(tireSize);
  const b = pair(section);
  return !!a && !!b && num(a[1]) === num(b[1]) && num(a[2]) === num(b[2]);
};

export const inchLabel = (n: number) => `${String(n).replace(".", ",")}"`;
