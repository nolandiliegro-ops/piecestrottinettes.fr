

# Plan — Edge Function `bulk-insert-scooters`

## Réponses à tes questions

1. **Architecture** : Une Edge Function protégée par un secret API admin (pas de JWT utilisateur). Ton script local envoie un POST avec le secret dans un header, la fonction utilise `service_role` côté serveur pour bypasser le RLS.

2. **Edge Function** : Oui, je la crée ci-dessous.

3. **Déploiement** : Tu n'as rien à faire — les Edge Functions Lovable se déploient automatiquement quand je les crée. Pas besoin de Supabase CLI.

4. **Token Lovable** : Non, il n'existe pas de CLI Lovable pour déployer. Mais ce n'est pas nécessaire — je déploie pour toi.

## Architecture finale

```text
Terminal local                    Lovable Cloud
─────────────                    ─────────────
node scripts/sync-scooters.js "Xiaomi"
  │
  ├─ POST /bulk-insert-scooters
  │  Header: x-admin-secret: <ADMIN_BULK_SECRET>
  │  Body: { scooters: [...], brandName: "Xiaomi" }
  │
  └──────────────────────────────► Edge Function
                                    │
                                    ├─ Vérifie x-admin-secret
                                    ├─ Upsert brand (créer si inexistante)
                                    ├─ Upsert scooter_models (par slug)
                                    ├─ Upsert part_compatibility (optionnel)
                                    └─ Retourne { inserted, updated, errors }
```

## Ce que je fais

### 1. Créer un secret `ADMIN_BULK_SECRET`
Un mot de passe aléatoire que ton script envoie dans le header `x-admin-secret`. La fonction le vérifie côté serveur. Pas de JWT nécessaire.

### 2. Créer `supabase/functions/bulk-insert-scooters/index.ts`
- Vérifie `x-admin-secret` contre le secret stocké
- Accepte `{ brandName: string, scooters: Array<{ name, slug, specs... }> }`
- Upsert la marque dans `brands` (ON CONFLICT slug)
- Upsert chaque modèle dans `scooter_models` (ON CONFLICT slug)
- Retourne un résumé `{ inserted: N, updated: N, errors: [...] }`
- Utilise `SUPABASE_SERVICE_ROLE_KEY` pour bypasser le RLS

### 3. Mettre à jour `supabase/config.toml`
Ajouter `verify_jwt = false` pour cette fonction (l'auth est gérée par le secret custom).

### 4. Créer `scripts/sync-scooters-example.js`
Un exemple de script local que tu adaptes — il fait le POST vers l'Edge Function avec ton secret.

## Utilisation côté local

```bash
export ADMIN_BULK_SECRET="le-secret-que-tu-définis"
export SUPABASE_URL="https://kqsxscjtlipregkrmucg.supabase.co"
node scripts/sync-scooters.js "Xiaomi"
```

Le script prépare le JSON et fait un `fetch()` vers `${SUPABASE_URL}/functions/v1/bulk-insert-scooters`.

## Fichiers créés/modifiés

| Fichier | Action |
|---------|--------|
| `supabase/functions/bulk-insert-scooters/index.ts` | Créer |
| `supabase/config.toml` | Ajouter bloc function |
| `scripts/sync-scooters-example.js` | Créer (exemple local) |
| Secret `ADMIN_BULK_SECRET` | Demander à l'utilisateur de le définir |

