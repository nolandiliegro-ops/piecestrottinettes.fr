// Transformation d'image à la volée via Supabase Storage (/render/image).
// resize=contain garantit AUCUN rognage (image produit toujours entière) ; width-only =
// ratio préservé ; sert du WebP auto (transparence conservée).
export const optimizedImage = (url: string | null | undefined, width: number, quality = 75): string => {
  if (!url) return url ?? "";
  const OBJECT = "/storage/v1/object/public/";
  // Ne transforme QUE les objets Supabase Storage publics ; placeholders/URLs externes intacts.
  if (!url.includes(OBJECT)) return url;
  // Ne double-transforme pas et ne casse pas une URL qui a déjà des query params.
  if (url.includes("/render/image/") || url.includes("?")) return url;
  return `${url.replace(OBJECT, "/storage/v1/render/image/public/")}?width=${width}&resize=contain&quality=${quality}`;
};
