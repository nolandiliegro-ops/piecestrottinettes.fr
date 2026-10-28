# Aperçus WhatsApp : ce qui a été observé (28/10, 21:41 UTC)

## 1. Ce qui est servi aux robots de partage (observé)
J'ai lu les deux pages en me faisant passer pour WhatsApp, pour Facebook (`facebookexternalhit`) et pour un navigateur normal. Les **trois réponses sont identiques, octet pour octet** (6 300 octets, même déploiement) :
- `<title>` : « Pièces Trottinettes | Spécialiste Pièces Détachées »
- `og:title` : « piecestrottinettes.fr — Plus jamais la mauvaise pièce »
- `og:description` : la description générale du site
- `og:image` : `…/og-image?k=page&s=default` (cette image répond bien : JPEG de 63 Ko, HTTP 200)
- `twitter:image` : même adresse, mais **mal échappée** (`&amp;amp;`), donc cassée

La fiche pièce et la fiche Thunder 3 reçoivent exactement le même `index.html` que la page d'accueil. **Aucun pré-rendu n'est servi** à WhatsApp sur ce domaine : il reçoit la page vide, avant que le code de la page tourne.

## 2. Le pré-rendu attend-il les données ?
Je ne peux pas l'observer, puisqu'aucun pré-rendu ne répond. Je ne vois aucune trace d'un rendu côté robot. Ce que je suppose : les balises posées par la fiche (via `SEO.tsx`) ne sont jamais vues par WhatsApp, qu'elles arrivent tôt ou tard. WhatsApp ne lance pas le code de la page.

## 3. Cache
Observé : `cache-control: no-cache, must-revalidate, max-age=0`, et aucun en-tête d'âge ou de cache. Le serveur ne garde donc pas de copie. Ajouter `?v=2` ne change rien à ce qu'il renvoie.

Supposé : c'est WhatsApp qui garde l'aperçu qu'il a lu la première fois. `?v=2` fait une nouvelle adresse pour WhatsApp, donc il relit la page, mais il retombe sur le même HTML par défaut. Pour « rien du tout » sur Thunder 3, je n'ai pas pu reproduire : le serveur renvoie le titre et l'image par défaut. Causes possibles côté WhatsApp : un délai dépassé ou une ancienne lecture ratée. Ce n'est pas vérifié.

## 4. Vider le cache
Côté hébergement, il n'y a rien à vider (pas de cache observé). Je n'ai aucun outil pour vider un cache de pré-rendu. Côté Facebook et WhatsApp : le débogueur de partage de Meta (developers.facebook.com/tools/debug), avec « Scrape Again » pour chaque adresse. Il n'existe pas d'outil pour vider tout le site d'un coup.

## Correction possible (si tu valides, plus tard, sur demande séparée)
- A. Corriger la double échappée de `twitter:image` dans `index.html` (une ligne).
- B. Pour de vrais aperçus par fiche, il faut que le serveur renvoie les bonnes balises. Deux options :
  - une page de partage servie par la fonction `og-image` (déjà en ligne), qui renvoie le HTML avec les balises puis redirige vers la fiche ;
  - ou passer le site en rendu côté serveur (migration TanStack Start).

Rien n'a été modifié.
