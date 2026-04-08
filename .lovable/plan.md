

# Fix — RLS promo_codes pour validation côté client

## Recommandation

**Solution 1 (RLS SELECT public)** — suffisante et recommandée.

Les données exposées (code, type, valeur) ne sont pas sensibles. La validation finale se fait déjà côté serveur dans `create-checkout-session` avec le service role. Ajouter une edge function serait de la sur-ingénierie ici.

## Action unique

### Migration SQL
```sql
CREATE POLICY "Public read active promo codes" ON public.promo_codes
  FOR SELECT TO anon, authenticated
  USING (active = true);
```

Aucun fichier à modifier — `OrderConfirmationModal.tsx` requête déjà `promo_codes` avec `.eq("active", true)`, ce qui fonctionnera dès que la politique SELECT sera en place.

## Fichiers impactés
1. **Migration SQL** — ajout politique SELECT sur `promo_codes`

