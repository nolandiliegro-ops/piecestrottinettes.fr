# Plan — Système Brand Assets centralisé

Mission : centraliser logo / favicon / OG image / watermark dans une table Supabase + bucket Storage, exposés via un hook React Query, gérables depuis une nouvelle page admin `/admin/brand`. Objectif final : changement de logo en 1 clic, site clonable sans toucher au code.

---

## 1. État des lieux — usages logo hardcodés

Imports actuels de `@/assets/logo-pt.png` à refactorer :
- `src/components/Header.tsx` (ligne 14, 84)
- `src/components/Footer.tsx` (ligne 2, 11)
- `src/pages/Login.tsx` (ligne 10, 103)
- `src/pages/Register.tsx` (ligne 10, 121)

Autres assets brand :
- `index.html` : `/favicon.png`, `/pwa-192x192.png` (apple-touch), `og:image` (URL Supabase site-assets), JSON-LD logo
- `vite.config.ts` : manifest PWA (déjà OK : short_name "PiècesTrott", name "Pièces Trottinettes", start_url "/"). À ajuster : `theme_color` actuellement `#93B5A1` → demande `#1A1A1A`, `background_color` actuellement `#1A1A1A` → demande `#F5F0E8`. **À confirmer car incohérent avec le design system actuel.**
- `public/` : favicon.png, favicon.ico, pwa-192x192.png, pwa-512x512.png

---

## 2. Infrastructure backend

### 2.1 Migration SQL (table + RLS + seed)

```sql
CREATE TABLE public.brand_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_key text NOT NULL UNIQUE,
  asset_url text NOT NULL DEFAULT '',
  alt_text text,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
CREATE INDEX idx_brand_assets_key ON public.brand_assets(asset_key);

ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read brand assets"
  ON public.brand_assets FOR SELECT USING (true);

CREATE POLICY "Admins can insert brand assets"
  ON public.brand_assets FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update brand assets"
  ON public.brand_assets FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete brand assets"
  ON public.brand_assets FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_brand_assets_updated_at
  BEFORE UPDATE ON public.brand_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.brand_assets (asset_key, description) VALUES
  ('logo_main_light',    'Logo principal (fond clair) — Header desktop & mobile'),
  ('logo_main_dark',     'Logo principal (fond sombre) — futur dark mode'),
  ('logo_compact_light', 'Logo compact / icône sur fond clair'),
  ('logo_compact_dark',  'Logo compact / icône sur fond sombre'),
  ('favicon',            'Favicon 32x32 / 64x64'),
  ('apple_touch_icon',   'Apple touch icon 180x180'),
  ('og_image',           'Image Open Graph (1200x630) pour partages sociaux'),
  ('watermark_product',  'Watermark appliqué sur photos produits')
ON CONFLICT (asset_key) DO NOTHING;
```

### 2.2 Bucket Storage `brand-assets`

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read brand-assets"
  ON storage.objects FOR SELECT USING (bucket_id = 'brand-assets');

CREATE POLICY "Admins upload brand-assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update brand-assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete brand-assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'brand-assets' AND has_role(auth.uid(), 'admin'));
```

---

## 3. Couche application

### 3.1 `src/config/brand.ts` (fallback statique)

Map `asset_key → URL statique` (logo-pt.png importé, /favicon.png, /pwa-192x192.png, og-image actuelle). Utilisé si la requête Supabase échoue.

### 3.2 `src/hooks/useBrandAssets.ts`

- `useBrandAssets()` : `useQuery` (`staleTime: 1h`, `gcTime: 24h`) → renvoie `Record<assetKey, { url, alt }>`.
- `useBrandAsset(key)` : helper renvoyant l'URL d'un asset précis avec fallback automatique sur `BRAND_ASSETS_FALLBACK[key]`.
- En cas d'erreur réseau ou ligne `asset_url` vide → fallback.

### 3.3 Refactor composants

- Header, Footer, Login, Register : remplacer `import logoImage` par `const logoUrl = useBrandAsset('logo_main_light')`. Dimensions / classes inchangées.
- `src/components/SEO.tsx` : nouveau composant `<BrandHelmet />` monté dans `App.tsx` qui injecte via react-helmet-async :
  - `<meta property="og:image" content={og_image}>`
  - `<meta name="twitter:image" content={og_image}>`
  - `<link rel="icon">` dynamique (favicon)
  - `<link rel="apple-touch-icon">`
- react-helmet-async : déjà utilisé dans le projet (`SEO.tsx`), pas d'install.

### 3.4 PWA manifest (vite.config.ts + index.html)

- Icônes PWA restent statiques (`/pwa-192x192.png`, `/pwa-512x512.png`) — limitation manifest.
- Ajustements demandés : `theme_color: "#1A1A1A"`, `background_color: "#F5F0E8"`. **Question :** confirmer ces valeurs (actuellement inversées et `#93B5A1` pour theme). Sans réponse → on applique tel que demandé.
- `index.html` : `apple-mobile-web-app-title` déjà à "PiècesTrott". À passer à "Pièces Trottinettes" si demandé (à confirmer).

---

## 4. Page admin `/admin/brand`

- Route protégée admin ajoutée à `Admin.tsx` (suit le pattern existant des managers).
- Composant `src/components/admin/BrandAssetsManager.tsx` :
  - Grille de cards, une par `asset_key`
  - Preview de l'asset (image 200x100 avec fond damier pour transparence)
  - Bouton "Remplacer" → input file → upload Storage `brand-assets/{asset_key}-{timestamp}.{ext}` → update `asset_url` + `updated_by = auth.uid()`
  - Champ alt_text éditable
  - Affichage `updated_at` relatif + email updated_by
  - Invalidation cache `useBrandAssets` après save
- Entrée sidebar admin "Brand Assets" (icône `Palette` ou `Image`).

---

## 5. Fichiers — créés / modifiés

**Créés (6) :**
- `supabase/migrations/<ts>_brand_assets.sql`
- `src/config/brand.ts`
- `src/hooks/useBrandAssets.ts`
- `src/components/admin/BrandAssetsManager.tsx`
- `src/components/BrandHelmet.tsx`
- `.lovable/plan.md` (ce plan)

**Modifiés (7) :**
- `src/components/Header.tsx`
- `src/components/Footer.tsx`
- `src/pages/Login.tsx`
- `src/pages/Register.tsx`
- `src/pages/Admin.tsx` (route + entry sidebar)
- `src/App.tsx` (monter `<BrandHelmet />`)
- `vite.config.ts` + `index.html` (manifest theme/background colors)

**Non touchés (verrouillés) :** CheckoutPage, Edge Functions paiement, design tokens, watermark produit (out of scope).

---

## 6. Plan de tests

- Desktop 1440px : Header logo, Footer logo, Login, Register
- Mobile 375px : Header (logo h-14), MobileNav inchangée
- Admin : upload logo PNG transparent → preview maj → reload page client → nouveau logo visible
- Réseau coupé : fallback `BRAND_ASSETS_FALLBACK` s'applique (test via DevTools offline)
- PWA install (Chrome Android émulé) : nom "Pièces Trottinettes"
- og:image : Facebook debugger sur URL de prod après deploy

---

## 7. Rollback

- Noter le commit hash avant Build.
- Rollback SQL : `DROP TABLE public.brand_assets;` + `DELETE FROM storage.buckets WHERE id='brand-assets';` (les policies storage tombent avec le bucket via cascade des objets).
- Rollback code : revert au commit hash.

---

## 8. Estimation Build

- Migration + bucket + seed : 1 message
- Hook + fallback + refactor 4 composants : 1 message
- BrandHelmet + App.tsx + manifest : 1 message
- BrandAssetsManager + route admin : 1-2 messages
- Upload initial logo + validation visuelle : 1 message

**Total estimé : 5-6 messages Lovable.**

---

## 9. Questions à valider avant Build

1. Confirmer `theme_color: #1A1A1A` et `background_color: #F5F0E8` pour le manifest (actuellement `#93B5A1` / `#1A1A1A`).
2. `apple-mobile-web-app-title` : laisser "PiècesTrott" (compact) ou passer à "Pièces Trottinettes" ?
3. Pour le 1er upload du nouveau logo : tu l'uploades toi via l'admin après Build, ou tu me fournis le fichier maintenant pour que je l'intègre dans le même Build ?
