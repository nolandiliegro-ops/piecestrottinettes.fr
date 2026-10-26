import { Helmet } from "react-helmet-async";
import { OG_DEFAULT } from "@/lib/ogImage";

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  canonical?: string;
  noindex?: boolean;
  schema?: object;
  prevUrl?: string;
  nextUrl?: string;
  /** og:type — « product » sur les fiches pièce (audit SEO 24/10), « website » partout ailleurs. */
  type?: "website" | "product";
}

const SITE_BRAND = "Pièces Trottinettes";
const MAX_TITLE = 60;

// Retire un suffixe de branding déjà présent dans le titre fourni (site ou marque),
// insensible casse/accents. Exige un séparateur ( | – — - ) + ancre de fin → non destructif.
function stripBranding(raw: string): string {
  return raw
    .replace(/\s*[|–—-]\s*pi[eè]ces?\s+trottinettes?\s*$/i, "")  // | Pièces Trottinettes
    .replace(/\s*[|–—-]\s*pi[eè]cestrottinettes\.fr\s*$/i, "")    // | piecestrottinettes.fr / — piècestrottinettes.fr
    .trim();
}

const SEO = ({ title, description, image, canonical, noindex = false, schema, prevUrl, nextUrl, type = "website" }: SEOProps) => {
  // Le meta_title produit est déjà un titre complet/optimisé. On dédoublonne tout
  // branding existant, puis on rajoute la marque UNE fois — seulement si on reste ≤ 60c
  // (sinon Google tronque). Au-delà, on garde le titre nu.
  const baseTitle = stripBranding(title);
  const withBrand = `${baseTitle} | ${SITE_BRAND}`;
  const fullTitle = withBrand.length <= MAX_TITLE ? withBrand : baseTitle;
  const url = canonical ?? (typeof window !== "undefined" ? window.location.href : "");
  // Toute page a une image d'aperçu de lien : celle de la fiche, sinon celle du site (26/10/2026).
  const ogImg = image || OG_DEFAULT;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImg} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="piecestrottinettes.fr" />
      {url && <meta property="og:url" content={url} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImg} />

      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Pagination hints (brand cycle navigation) */}
      {prevUrl && <link rel="prev" href={prevUrl} />}
      {nextUrl && <link rel="next" href={nextUrl} />}

      {/* Schema.org JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
