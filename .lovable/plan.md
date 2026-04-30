
# Plan validé — Build prêt à exécuter

Toutes tes réponses aux 5 questions ouvertes sont intégrées. Approuve ce plan pour que je passe en mode build et exécute tout d'un coup.

## 1. Migration SQL (idempotente, commentée)

Fichier : `supabase/migrations/<timestamp>_part_suppliers_and_auto_compat.sql`

```sql
-- 1. Table part_suppliers
CREATE TABLE IF NOT EXISTS public.part_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  supplier_name text NOT NULL,
  supplier_sku text,
  supplier_url text,
  buy_price_ht numeric(10,2),
  stock_supplier integer,
  shipping_time_days integer DEFAULT 2,
  is_primary boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT part_suppliers_supplier_name_check CHECK (
    supplier_name IN ('wattiz','ewheel','voltcorp','bluewaycorp','dualtronstore','weebot','autre')
  )
);

COMMENT ON TABLE public.part_suppliers IS 'Liaisons multi-fournisseurs B2B. Admin only.';
COMMENT ON COLUMN public.part_suppliers.is_primary IS 'Fournisseur principal — un seul par pièce (index unique partiel).';

CREATE INDEX IF NOT EXISTS idx_part_suppliers_part_id ON public.part_suppliers(part_id);
CREATE INDEX IF NOT EXISTS idx_part_suppliers_supplier_name ON public.part_suppliers(supplier_name);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_part_suppliers_primary
  ON public.part_suppliers(part_id) WHERE is_primary = true;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_part_suppliers_part_supplier
  ON public.part_suppliers(part_id, supplier_name);

ALTER TABLE public.part_suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access on part_suppliers" ON public.part_suppliers;
CREATE POLICY "Admins full access on part_suppliers" ON public.part_suppliers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS trg_part_suppliers_updated_at ON public.part_suppliers;
CREATE TRIGGER trg_part_suppliers_updated_at
  BEFORE UPDATE ON public.part_suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. auto_suggested sur part_compatibility
ALTER TABLE public.part_compatibility
  ADD COLUMN IF NOT EXISTS auto_suggested boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.part_compatibility.auto_suggested IS
  'true = pré-suggestion auto bot. false = validé manuellement.';
CREATE INDEX IF NOT EXISTS idx_part_compat_auto_suggested
  ON public.part_compatibility(scooter_model_id) WHERE auto_suggested = true;
```

## 2. Fichiers nouveaux

| Fichier | Rôle |
|---|---|
| `supabase/migrations/<ts>_part_suppliers_and_auto_compat.sql` | Migration ci-dessus |
| `src/components/admin/PartSuppliersManager.tsx` | UI admin fournisseurs (props : `partId`, `partPrice` pour calcul marge) |
| `supabase/functions/bulk-insert-parts/logic_test.ts` | Tests Deno des helpers purs (regex, hints) |

## 3. Fichiers modifiés

| Fichier | Modif |
|---|---|
| `supabase/functions/bulk-insert-parts/index.ts` | Réécriture avec `supplier`, `compatibility_hints`, helpers purs exportés (`extractTireSizeFromName`, `extractVoltageFromName`, `buildTireSizeRegex`, `resolveCompatibilityHints`), upsert supplier, suggestions compat (création uniquement, jamais sur re-import), réponse étendue, logs `console.log` par pièce, try/catch isolant chaque pièce |
| `src/components/admin/PendingPartsManager.tsx` | Ajouter section "Fournisseurs" sous chaque carte pending → `<PartSuppliersManager partId={part.id} partPrice={part.price} />` |
| `src/components/admin/PartsManager.tsx` | Ajouter même section "Fournisseurs" dans le dialog `isEditOpen` (édition pièce publiée) |
| `src/components/admin/CompatibilityManager.tsx` | Fetch `auto_suggested`, Map flag, badges visuels (orange "Suggestion auto" / vert "Validé"), boutons "Valider toutes les suggestions auto" + "Rejeter toutes les suggestions auto" en haut de la colonne droite, toggle 3-states (clic suggestion = valider → `auto_suggested=false`, clic validé = supprimer), bouton "Rejeter" inline par suggestion |
| `scripts/data/parts-import-example.json` | Exemple enrichi avec `supplier` + `compatibility_hints` (3 cas : pneu, chargeur 52V, plaquettes sans hint) |
| `src/integrations/supabase/types.ts` | Auto-régénéré post-migration |

## 4. Logique pré-suggestion (réponses Q3 intégrées)

```
helper extractTireSizeFromName(name):
  match /(\d{1,2}(?:\.\d{1,2})?)\s*[x×]\s*\d/i  → groupe 1 sinon null
  // "Pneu 10x2.50" → "10" ; "Chargeur 100V" → null

helper extractVoltageFromName(name):
  match /(\d{2,3})\s*(?:V|volts?)\b/i → number sinon null
  filtre 24 ≤ v ≤ 144

helper buildTireSizeRegex(size):
  return `(^|[^0-9])${escape(size)}([^0-9.]|$)`
  // "10" matche "10x", "10 pouces", " 10 ", mais PAS "100"

helper resolveCompatibilityHints(part):
  si compatibility_hints fourni avec tire_size OU voltage non-nul → retourne explicit
  sinon fallback regex sur name (pneus + chargeurs uniquement)
  sinon null  // plaquettes/disques/etc → pas de suggestion

logique edge function par pièce :
  1. valider name + slug
  2. SELECT existing par slug → wasNew = !existing
  3. UPSERT parts ON CONFLICT slug
  4. SI part.supplier : count existing → is_primary auto si premier ; UPSERT (part_id, supplier_name)
  5. SI wasNew :
       count_compat = SELECT count FROM part_compatibility WHERE part_id=X
       SI count_compat == 0 :
         hints = resolveCompatibilityHints(part)
         SI hints :
           candidats = []
           SI hints.tire_size : SELECT id FROM scooter_models WHERE published AND tire_size ~* buildTireSizeRegex(...)
           SI hints.voltage : SELECT id FROM scooter_models WHERE published AND voltage = X
                              → si tire+voltage tous deux fournis : INTERSECTION
           INSERT batch part_compatibility (auto_suggested=true)
  6. log : console.log(`CREATED|UPDATED "name" — suppliers_added=N compat=N`)
  7. try/catch englobant chaque pièce → on continue sur erreur (pas de fail global)

réponse : { success, category, results: { inserted, updated, suppliers_added, compatibilities_suggested, errors[] } }
```

## 5. UI admin fournisseurs (mobile-first)

`PartSuppliersManager.tsx` :
- Header : compteur + bouton "Ajouter" (min-h 44px)
- Liste cards 1 col, badge "Principal" doré + bordure verte si is_primary
- Pills : prix achat HT, marge calculée (vert si > 0, rouge sinon), stock fournisseur, délai jours
- Actions par ligne : "Définir principal" (caché si déjà), "Modifier" (modal), "Supprimer" (AlertDialog) — tous min-h 44px sur mobile
- Modal form : Select supplier (disabled en édition), grid 1 col mobile / 2 cols sm:, inputs h-11 mobile / h-9 desktop, font-size base 16px sur mobile
- TypeScript strict : pas de `any`, types `PartSupplierRow`, `SupplierFormState`, `SupplierName`

## 6. CompatibilityManager — modifications

- `fetchData` étendu pour récupérer `auto_suggested` + Map
- Badges inline à côté de chaque pièce cochée :
  - orange `bg-orange-500/15 text-orange-300 border-orange-500/30` "Suggestion auto"
  - vert `bg-emerald-500/15 text-emerald-300 border-emerald-500/30` "Validé"
- 2 boutons en haut de la colonne droite (quand un scooter est sélectionné) :
  - "Valider toutes les suggestions auto (N)" → UPDATE batch `auto_suggested=false WHERE scooter_model_id=X AND auto_suggested=true`
  - "Rejeter toutes les suggestions auto (N)" → DELETE WHERE scooter_model_id=X AND auto_suggested=true
- Toggle 3-states sur clic d'une pièce :
  - non cochée → INSERT (auto_suggested=false)
  - cochée + auto_suggested → UPDATE auto_suggested=false (validation)
  - cochée + validée → DELETE
- Bouton "Rejeter" (X rouge) inline visible UNIQUEMENT sur les suggestions auto

## 7. Tests Deno (`logic_test.ts`)

- `extractTireSizeFromName`: pneu 10x2.50 → "10" ; chambre 8.5×2 → "8.5" ; plaquettes → null ; chargeur 100V → null (anti faux positif)
- `extractVoltageFromName`: 52V → 52 ; "60 volts" → 60 ; pneu 10x2.50 → null ; 12V → null ; 200V → null
- `buildTireSizeRegex`: "10" ne matche pas "100 pouces" ni "100x2" mais matche "10 pouces", "10x2.50", "10×2"
- `resolveCompatibilityHints`: explicit prioritaire ; fallback pneu ; fallback chargeur ; plaquettes → null
- (Note : test SQL is_primary unique partial index = vérifié implicitement par la contrainte SQL elle-même ; un test PG nécessiterait un client PG dans Deno test — on s'en remet à la contrainte DB qui est garantie par Postgres)
- (Test re-import = couvert par la logique `wasNew` dans le code, testée manuellement via curl_edge_functions après déploiement)

## 8. Fichiers/composants préservés (zéro modif)

- `bulk-insert-scooters`, `PendingScootersManager`, `ScootersManager`
- `create-checkout-session`, `stripe-webhook`, `verify-payment`, `send-order-email`
- `orders`, `order_items` (table + RLS)
- `useIsCompatibleWithSelected`, `useCompatibleParts` (continuent de retourner toutes les compats sans filtrer)
- `ScooterCompatibilitySelect`
- Tout le frontend public

## 9. Étapes d'exécution en mode build

1. Migration SQL appliquée
2. Régénération `types.ts`
3. Réécriture `bulk-insert-parts/index.ts` + déploiement edge function
4. Création `logic_test.ts` + run des tests Deno
5. Création `PartSuppliersManager.tsx`
6. Patch `PendingPartsManager.tsx` (intégration)
7. Patch `PartsManager.tsx` (intégration dans dialog édition)
8. Patch `CompatibilityManager.tsx` (auto_suggested UI)
9. Update `parts-import-example.json`
10. Smoke test via `curl_edge_functions` avec le payload exemple

## 10. Livrables finaux que je te donnerai

- Résumé clair des fichiers modifiés (path + 1 ligne)
- Payload JSON de test prêt à coller pour valider le système end-to-end
- Sortie console.log attendue
- Vérification que les tests Deno passent

---

**Approuve ce plan pour que je passe en build et exécute tout.**
