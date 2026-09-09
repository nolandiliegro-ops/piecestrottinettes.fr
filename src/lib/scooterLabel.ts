// Nom AFFICHABLE d'une trottinette.
//
// 43 des 62 `scooter_models` portent déjà la marque dans leur `name`
// (« Dualtron » + « Dualtron Togo » → « Dualtron Dualtron Togo » à l'écran).
// On ne renomme RIEN en base : le nom complet sert au SEO, à la recherche et
// aux imports. On corrige uniquement l'affichage, ici, en un seul endroit.

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const hasBrandPrefix = (model: string, brand: string) =>
  model.toLowerCase().startsWith(brand.toLowerCase() + " ");

/** « Dualtron » + « Dualtron Togo » → « Dualtron Togo ». Marque incluse. */
export function scooterLabel(
  brandName: string | null | undefined,
  modelName: string | null | undefined,
): string {
  const model = (modelName ?? "").trim();
  const brand = (brandName ?? "").trim();
  if (!brand) return model;
  if (!model) return brand;
  if (same(model, brand) || hasBrandPrefix(model, brand)) return model;
  return `${brand} ${model}`;
}

/**
 * Nom SANS la marque — pour les listes déjà groupées par marque, où la répéter
 * sur chaque ligne est du bruit. « Dualtron » + « Dualtron Togo » → « Togo ».
 */
export function scooterLabelShort(
  brandName: string | null | undefined,
  modelName: string | null | undefined,
): string {
  const model = (modelName ?? "").trim();
  const brand = (brandName ?? "").trim();
  if (!brand || !model) return model || brand;
  if (hasBrandPrefix(model, brand)) {
    const rest = model.slice(brand.length).trim();
    return rest.length > 0 ? rest : model;
  }
  return model;
}
