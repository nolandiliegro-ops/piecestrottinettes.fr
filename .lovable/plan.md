

# Batch 4 — SEO de base

## Plan validé avec un ajustement

Le plan est bon. Un point : `robots.txt` existe déjà (Allow only), il faut le **remplacer**, pas le créer.

## Fichiers modifiés (10 au total)

### Ordre d'exécution

**1. Installer react-helmet-async** — ajout dépendance + wrap `HelmetProvider` dans `src/main.tsx`

**2. Créer `src/components/SEO.tsx`** — composant réutilisable avec props `title`, `description`, `image?`, `noindex?`. Utilise `<Helmet>` pour injecter `<title>`, `meta description`, `og:title`, `og:description`, `og:image`, `robots`.

**3. Pages publiques — ajouter SEO avec titres uniques :**
- `src/pages/PartDetail.tsx` — titre dynamique : `{part.name} | Pièces Trottinettes`
- `src/pages/Catalogue.tsx` — "Catalogue Pièces Détachées | Pièces Trottinettes"
- `src/pages/Scooters.tsx` — "Trottinettes Électriques | Pièces Trottinettes"
- `src/pages/Tutos.tsx` — "Tutoriels & Guides | Pièces Trottinettes"
- `src/pages/Pepites.tsx` — "Les Pépites — Sélection Premium | Pièces Trottinettes"

**4. Pages privées — ajouter SEO avec noindex :**
- `src/pages/Admin.tsx` — noindex
- `src/pages/Garage.tsx` — noindex
- `src/pages/Profile.tsx` — noindex
- `src/pages/CheckoutPage.tsx` — noindex
- `src/pages/PaymentSuccessPage.tsx` — noindex

**5. `public/robots.txt`** — remplacer le contenu existant par :
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /garage
Disallow: /profile
Disallow: /checkout
Disallow: /payment-success

Sitemap: https://piecestrottinettes.fr/sitemap.xml
```

**6. `index.html`** — ajouter `og:locale` → `fr_FR` et `og:url` → `https://piecestrottinettes.fr`

## Résumé fichiers

| # | Fichier | Action |
|---|---------|--------|
| 1 | `src/main.tsx` | Wrap HelmetProvider |
| 2 | `src/components/SEO.tsx` | Créer |
| 3 | `src/pages/PartDetail.tsx` | Ajouter SEO |
| 4 | `src/pages/Catalogue.tsx` | Ajouter SEO |
| 5 | `src/pages/Scooters.tsx` | Ajouter SEO |
| 6 | `src/pages/Tutos.tsx` | Ajouter SEO |
| 7 | `src/pages/Pepites.tsx` | Ajouter SEO |
| 8 | `src/pages/Admin.tsx` + `Garage.tsx` + `Profile.tsx` + `CheckoutPage.tsx` + `PaymentSuccessPage.tsx` | Ajouter SEO noindex |
| 9 | `public/robots.txt` | Remplacer |
| 10 | `index.html` | Ajouter og:locale + og:url |

**Total : 13 fichiers modifiés/créés**, exécutés dans cet ordre.

