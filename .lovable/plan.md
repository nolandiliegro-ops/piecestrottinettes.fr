

# Batch 12 — Codes promo + Livraison gratuite configurable

## Étape 1 — Codes promo

### 1.1 Migration SQL — Table `promo_codes`
```sql
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL, -- 'shipping' / 'percent' / 'fixed'
  discount_value numeric NOT NULL,
  active boolean DEFAULT true,
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Admins full CRUD
CREATE POLICY "Admins full access on promo_codes" ON public.promo_codes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert TEST1
INSERT INTO public.promo_codes (code, discount_type, discount_value, active)
VALUES ('TEST1', 'shipping', 100, true);
```

### 1.2 `supabase/functions/create-checkout-session/index.ts`
- Ajouter `promoCode?: string` dans le body de la requête
- Si `promoCode` fourni : query `promo_codes` via service role, valider (active, not expired, uses < max_uses)
- Si `discount_type === 'shipping'` et `discount_value === 100` → `deliveryPrice = 0`
- Si `discount_type === 'percent'` → réduire le sous-total du pourcentage
- Si `discount_type === 'fixed'` → soustraire le montant fixe
- Incrémenter `current_uses` après validation
- Stocker le code promo appliqué dans la commande (ajouter colonne `promo_code` à la table `orders` via migration)

### 1.3 Migration complémentaire — Colonne `promo_code` sur orders
```sql
ALTER TABLE public.orders ADD COLUMN promo_code text;
```

### 1.4 `src/components/checkout/OrderConfirmationModal.tsx`
- Ajouter un état `promoCode` (string) et `promoApplied` (objet avec discount_type/discount_value ou null)
- Ajouter un champ texte + bouton "Appliquer" dans la section livraison
- Appel à une edge function `validate-promo` (ou validation inline via supabase query) pour vérifier le code
- Si valide : afficher badge vert "Code appliqué", recalculer le prix de livraison/total
- Modifier `onConfirm` pour passer le `promoCode` au parent
- Mettre à jour l'interface `onConfirm` : ajouter paramètre `promoCode?: string`

### 1.5 `src/pages/CheckoutPage.tsx`
- Modifier `handleConfirmOrder` pour recevoir et transmettre le `promoCode` dans le body envoyé à `create-checkout-session`

### 1.6 `src/components/admin/PromoCodesManager.tsx` (nouveau)
- Liste des codes promo avec colonnes : code, type, valeur, actif, utilisations, expire le
- Formulaire de création : code, discount_type (select), discount_value, max_uses, expires_at
- Bouton activer/désactiver
- Bouton supprimer

### 1.7 `src/components/admin/AdminSettings.tsx`
- Ajouter onglet "Promos" avec icône `Ticket` et composant `PromoCodesManager`

---

## Étape 2 — Livraison gratuite configurable

### 2.1 Données dans `site_assets`
- Insérer une entrée `asset_key = 'shipping_free_threshold'`, `asset_url = '49'`, `section = 'shipping'`, `label = 'Seuil livraison gratuite'`

### 2.2 `src/components/checkout/OrderConfirmationModal.tsx`
- Au montage, fetch `site_assets` avec `asset_key = 'shipping_free_threshold'`
- Si `subtotalHT >= seuil` → forcer livraison gratuite (prix = 0) sur toutes les options
- Afficher message "Livraison gratuite dès {seuil}€"

### 2.3 `supabase/functions/create-checkout-session/index.ts`
- Fetch le seuil depuis `site_assets` côté serveur (anti-fraude)
- Si sous-total ≥ seuil → `deliveryPrice = 0`

### 2.4 `src/components/admin/SiteDesignManager.tsx` (ou section dans AdminSettings)
- Ajouter un champ "Seuil livraison gratuite (€)" qui met à jour `site_assets` avec `asset_key = 'shipping_free_threshold'`

---

## Fichiers modifiés/créés (résumé)
1. **Migration SQL** — table `promo_codes` + colonne `promo_code` sur orders + insert TEST1
2. **Migration SQL** — insert `shipping_free_threshold` dans site_assets
3. `supabase/functions/create-checkout-session/index.ts` — validation promo + seuil livraison gratuite
4. `src/components/checkout/OrderConfirmationModal.tsx` — champ code promo + livraison gratuite auto
5. `src/pages/CheckoutPage.tsx` — passer promoCode à l'edge function
6. `src/components/admin/PromoCodesManager.tsx` (nouveau)
7. `src/components/admin/AdminSettings.tsx` — onglet Promos
8. `src/components/admin/SiteDesignManager.tsx` — champ seuil livraison gratuite

