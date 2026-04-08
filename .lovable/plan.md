

# Batch 5 — Lancement (Responsive + SEO)

## Fichiers modifiés : 4 au total

### Ordre d'exécution

**1. Responsive checkout mobile — `src/pages/CheckoutPage.tsx`**

Le checkout est déjà bien structuré (grid responsive, bouton mobile dédié). Corrections ciblées :
- `grid-cols-2` sur code postal/ville : ajouter `grid-cols-1 sm:grid-cols-2` pour éviter les inputs trop étroits sur petit écran
- Le récapitulatif (sticky sidebar) n'est pas visible sur mobile avant de scroller tout le formulaire — ajouter un mini résumé fixe en bas de l'écran mobile avec le total + bouton (barre fixe `fixed bottom-0`)
- Inputs : ajouter `text-base` pour éviter le zoom iOS sur focus (iOS zoom quand font-size < 16px)

**2. Schema.org Product JSON-LD — `src/pages/PartDetail.tsx`**

Ajouter dans le `<Helmet>` un `<script type="application/ld+json">` avec :
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": part.name,
  "description": part.description,
  "image": part.image_url,
  "offers": {
    "@type": "Offer",
    "price": part.price,
    "priceCurrency": "EUR",
    "availability": stock > 0 ? "InStock" : "OutOfStock",
    "url": canonical URL
  }
}
```

**3. Canonical URLs — `src/components/SEO.tsx`**

Ajouter une prop optionnelle `canonical?: string` au composant SEO. Quand fournie, injecter `<link rel="canonical" href={canonical} />`. L'ajouter sur PartDetail avec l'URL construite dynamiquement (`https://piecestrottinettes.fr/pieces/${slug}`).

**4. Noindex OrderSuccessPage — `src/pages/OrderSuccessPage.tsx`**

Importer SEO, ajouter `<SEO title="Commande confirmée" description="Votre commande a été confirmée." noindex />` en haut du JSX.

## Résumé

| # | Fichier | Action |
|---|---------|--------|
| 1 | `src/pages/CheckoutPage.tsx` | Fix responsive mobile (inputs, sticky bottom bar, iOS zoom) |
| 2 | `src/pages/PartDetail.tsx` | JSON-LD Product schema |
| 3 | `src/components/SEO.tsx` | Ajouter prop `canonical` |
| 4 | `src/pages/OrderSuccessPage.tsx` | Ajouter SEO noindex |

