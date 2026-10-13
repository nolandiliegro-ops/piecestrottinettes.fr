// JSON-LD builder for /marque/:slug — Schema.org Brand + BreadcrumbList.
// Returned as an array → rendered in a single <script type="application/ld+json"> by <SEO>.

const SITE_URL = "https://piecestrottinettes.fr";

export interface BrandSchemaInput {
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  foundedYear?: number | null;
  websiteUrl?: string | null;
  faq?: { q: string; a: string }[] | null;
}

export const buildBrandJsonLd = ({
  name,
  slug,
  logoUrl,
  description,
  foundedYear,
  websiteUrl,
  faq,
}: BrandSchemaInput): object[] => {
  const url = `${SITE_URL}/marque/${slug}`;

  const brand = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name,
    url,
    ...(logoUrl ? { logo: logoUrl } : {}),
    ...(description ? { description } : {}),
    ...(foundedYear ? { foundingDate: String(foundedYear) } : {}),
    ...(websiteUrl ? { sameAs: [websiteUrl] } : {}),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Marques", item: `${SITE_URL}/marques` },
      { "@type": "ListItem", position: 3, name, item: url },
    ],
  };

  const faqItems = (Array.isArray(faq) ? faq : []).filter((i) => i?.q?.trim() && i?.a?.trim());
  if (faqItems.length === 0) return [brand, breadcrumb];

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };

  return [brand, breadcrumb, faqPage];
};
