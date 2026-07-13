
# Module "Choisis ta marque" — Bento des marques (isolé)

Confirmation data : `scooter_models.brand_id` (FK vers `brands.id`) → count et join showcase alignés sur cette colonne. Les 9 marques ont `showcase_model_id = NULL` → toutes tomberont proprement sur la silhouette SVG générique (aucune tuile ne crash, `showcase_image_url` gardé nullable et testé avant le `<img>`).

## Fichiers créés

### `src/hooks/useBrandWall.ts`
- TanStack Query, `staleTime: 5 min`, client Supabase centralisé.
- Requête 1 : `brands` filtré `published = true` avec toutes les colonnes bento (`signature_color, tile_size, watermark_pos, is_star, entry_style, showcase_model_id, youtube_video_id`).
- Requête 2 : `scooter_models` filtré `published = true`, colonnes `id, brand_id, image_url, images` → agrégation client : `models_count` par `brand_id` + lookup Map pour extraire l'image du `showcase_model_id` via `getPrimaryImage()` (`src/lib/entityImage.ts`).
- Fallbacks défensifs : `tile_size='normal'`, `watermark_pos='tr'`, `entry_style='glide-right'`, `display_order=999`.
- Tri : `is_star DESC, display_order ASC, name ASC`.

### `src/components/home/BrandTile.tsx`
- Wrapper `<Link to="/marque/{slug}">` → navigation en **1 tap** (aucun handler qui `preventDefault`).
- `useIsMobile()` + `usePrefersReducedMotion()` (matchMedia).
- **Reveal mobile** : IntersectionObserver threshold 0.35, une seule fois → toggle `visible` qui déclenche glow + glissement du showcase.
- **Desktop** : hover déclenche glow + tilt 3D (rotateX/Y ∈ [-9°, 9°] calculés sur `mousemove`) + glissement.
- **prefers-reduced-motion** : tilt désactivé, `transition: none` sur le showcase, showcase directement en position finale et pleinement opaque (`active = true` d'office).
- Fond : `linear-gradient(155deg, signature_color, darken(signature_color, 0.82))` via helper `darkenHex()` local.
- Glow : halo `blur(60px)` top-right, opacity 0 → 0.62.
- Watermark : lettre géante `rgba(255,255,255,.10)`, position via `watermark_pos` (tr/bl/cc/tl/br-big), taille dérivée de `tile_size`.
- Logo box blanche `rounded-2xl` — 52 / 66 / 92 px selon `tile_size`. Fallback lettre Unbounded.
- Badge STAR (si `is_star`) : pastille top-left `#FFB300` texte `#1A1A1A` "★ Star".
- Badge "◉ Vidéo" (si `youtube_video_id`, `hidden sm:inline-flex`) : glassmorphism blanc top-right, purement visuel.
- Nom : Unbounded 800 uppercase blanc. Meta Sora : `"{n} modèle{s} · {country}"`.
- Showcase : `<img>` si `showcase_image_url`, sinon `<GenericScooter />` SVG inline (silhouette blanche demi-transparente). Transform + opacity animés selon preset `entry_style` (7 presets exacts, `cubic-bezier(.28,1.4,.5,1)`, durées 750–1250ms).
- Span grille via `gridColumn`/`gridRow` inline styles calculés côté parent + tuile (mobile : wide/tall retombent en 1×1, big reste 2×2).

### `src/components/home/BrandWallSection.tsx`
- Section fond `#F5F0E8`, titre "CHOISIS TA MARQUE" (Unbounded 900), sous-titre Sora.
- Barre de recherche : input contrôlé, filtre live sur `name` insensible casse + accents (NFD strip diacritiques). 44px+ height.
- Grille bento : mobile `repeat(2,1fr) / 140px`, desktop `repeat(4,1fr) / 150px`, `gap: 13px`, `grid-auto-flow: dense`.
- Cap à 12 tuiles en mode `limited` (home). Sur `/marques` : pas de cap.
- États : skeleton (8 blocs pulse), erreur, "aucun résultat" pour recherche vide.
- CTA "Voir les 50 marques" (mode `limited` uniquement) : `#4A7C59` / hover `#3A6449`, blanc, 48px, `<Link to="/marques">`.

### `src/pages/Brands.tsx` (stub)
- Header + `<BrandWallSection limited={false} />` + Footer. SEO title/description/canonical.

## Fichiers modifiés (2 lignes chacun)

### `src/pages/Index.tsx`
Ajout de `<BrandWallSection />` inséré **après `<HomeBridge />`** et avant `<ShopByCompatibility />`. `<BrandCarousel />` **conservé en place** — sera retiré après validation visuelle.

### `src/App.tsx`
Ajout `const Brands = lazy(() => import("./pages/Brands"))` + `<Route path="/marques" element={<Brands />} />` avant la route catch-all.

## Contraintes respectées

- Aucune modification de composant existant (autre que les 2 lignes home + 2 lignes App).
- `BrandCarousel` intact.
- `#FF6600` proscrit dans ce module. STAR en `#FFB300`. CTA en vert sauge `#4A7C59`.
- Aucune vidéo chargée. Badge "◉ Vidéo" purement CSS.
- Aucune migration, aucune table créée.
- Textes ≥ 14px, touch targets ≥ 44px, `aria-label` sur chaque tuile, `focus-visible` ring, `sr-only` label sur la recherche.
- `prefers-reduced-motion` respecté : plus de tilt, plus de glissement.
- Nav marque garantie en **1 tap** sur mobile (aucun `preventDefault`, aucune double-interaction).

## Hors-scope (à ne pas faire)

- Filtres Performance / Petit prix / Tout-terrain / Urbain.
- Modal quick-view marque.
- Retrait de `BrandCarousel`.
- Toute autre modification (checkout, garage, Wallpaper Garage, etc.).
