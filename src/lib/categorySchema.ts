// JSON-LD builder for /categorie/:slug — Schema.org CollectionPage + ItemList + BreadcrumbList.
// Returned as an array → rendered in a single <script type="application/ld+json"> by <SEO>.

import { getPrimaryImage, type ImageEntry } from "@/lib/entityImage";

const SITE_URL = "https://piecestrottinettes.fr";

export interface CategorySchemaPart {
  slug: string;
  name: string;
  price: number | null;
  stock_quantity: number | null;
  image_url: string | null;
  images?: ImageEntry[] | null;
}

export interface CategorySchemaInput {
  name: string;
  slug: string;
  description?: string | null;
  parts: CategorySchemaPart[];
}

export const buildCategoryJsonLd = ({
  name,
  slug,
  description,
  parts,
}: CategorySchemaInput): object[] => {
  const url = `${SITE_URL}/categorie/${slug}`;

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url,
    ...(description ? { description } : {}),
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: parts.map((p, i) => {
      // Image primaire (fallback "" → champ image omis si vide).
      const image = getPrimaryImage(p.images, p.image_url, "");
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          url: `${SITE_URL}/piece/${p.slug}`,
          name: p.name,
          ...(image ? { image } : {}),
          // Prix BRUT (jamais ×1.2) pour matcher l'affichage PartCard.
          ...(p.price != null
            ? {
                offers: {
                  "@type": "Offer",
                  price: p.price.toFixed(2),
                  priceCurrency: "EUR",
                  availability:
                    p.stock_quantity === 0
                      ? "https://schema.org/OutOfStock"
                      : "https://schema.org/InStock",
                },
              }
            : {}),
        },
      };
    }),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Catalogue", item: `${SITE_URL}/catalogue` },
      { "@type": "ListItem", position: 3, name, item: url },
    ],
  };

  return [collectionPage, itemList, breadcrumb];
};
