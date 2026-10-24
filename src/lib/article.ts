/**
 * Article défini féminin devant un nom de trottinette, avec élision.
 * « la Kukirin G4 » mais « l'Apollo City », « l'iScooter i9 », « l'E-Twow GT ».
 * Le Y initial ne s'élide pas (« la Yeep.me »), le H est traité comme aspiré (« la Hiboy »).
 */
const VOWEL = /^[aeiouàâäéèêëîïôöùûü]/i;

export function laName(name: string): string {
  const n = (name ?? "").trim();
  return VOWEL.test(n) ? `l'${n}` : `la ${n}`;
}

/** Même règle avec une majuscule en tête de phrase : « La Kukirin » / « L'Apollo ». */
export function LaName(name: string): string {
  const s = laName(name);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
