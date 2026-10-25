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

// 25/10 (poids 4G) : variantes responsives. Supabase → une URL /render/image par largeur ;
// photos de marque statiques (/brand-heroes/x.webp, 1344 px) → copie 480 px dans /brand-heroes/sm/.
// Le navigateur choisit selon `sizes` et la densité d'écran : un téléphone ne télécharge plus le 700 px.
export const responsiveImage = (url: string | null | undefined, widths: number[], quality = 75): { src: string; srcSet?: string } => {
  if (!url) return { src: url ?? "" };
  if (url.startsWith("/brand-heroes/") && !url.startsWith("/brand-heroes/sm/")) {
    return { src: url.replace("/brand-heroes/", "/brand-heroes/sm/"), srcSet: `${url.replace("/brand-heroes/", "/brand-heroes/sm/")} 480w, ${url} 1344w` };
  }
  const first = optimizedImage(url, widths[0], quality);
  if (first === url) return { src: url }; // URL externe ou déjà transformée : intacte
  return { src: optimizedImage(url, widths[widths.length - 1], quality), srcSet: widths.map((w) => `${optimizedImage(url, w, quality)} ${w}w`).join(", ") };
};
