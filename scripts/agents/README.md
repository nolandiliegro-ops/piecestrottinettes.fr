# 🦅 Le Veilleur

Agent autonome de veille hebdomadaire qui surveille le marché des trottinettes électriques et pièces détachées, et crée des entries `published=false` dans Bot Import pour validation manuelle par Nolan.

## Fonctionnement

- **Cron** : tous les dimanches 21:00 UTC via GitHub Actions (`.github/workflows/weekly-watcher.yml`)
- **AI** : Claude Sonnet 4.5 avec `web_search_20250305` (8 recherches max par appel) et `tool_use` pour forcer le JSON
- **Tracking** : table `watcher_runs` (admin-only RLS)
- **Scoring** : qualité /100, seuil d'insertion = 60
- **Email** : rapport HTML envoyé à `admin@ndl-agency.com` via Resend

## Architecture

```
config/watcher-sources.json          # Marques + fournisseurs + scoring config
scripts/agents/
  weekly-watcher.js                  # Orchestrateur principal
  test.js                            # Smoke tests
  lib/
    supabase-rest.js                 # REST + invocation Edge Functions
    anthropic-client.js              # Claude + web_search + tool_use
    scoring.js                       # Scoring qualité /100
    slugify.js                       # Slugs propres
    resend-mailer.js                 # Rapport HTML
.github/workflows/weekly-watcher.yml # Cron hebdo + workflow_dispatch
supabase/migrations/                 # Table watcher_runs
```

## Secrets GitHub à configurer

Dans **Settings → Secrets and variables → Actions** :

| Secret | Source |
|---|---|
| `SUPABASE_URL` | `https://kqsxscjtlipregkrmucg.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Lovable Cloud → Secrets |
| `ADMIN_BULK_SECRET` | Lovable Cloud → Secrets |
| `ANTHROPIC_API_KEY` | Lovable Cloud → Secrets |
| `RESEND_API_KEY` | Lovable Cloud → Secrets |
| `LOVABLE_API_KEY` | Lovable Cloud → Secrets |

## Smoke tests

```bash
node scripts/agents/test.js
```

## Trigger manuel (smoke test après déploiement)

Via UI GitHub : **Actions → Le Veilleur → Run workflow → main**

Via CLI :
```bash
gh workflow run weekly-watcher.yml --ref main -f reason="smoke test"
gh run watch
```

Via API REST :
```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GH_TOKEN" \
  https://api.github.com/repos/<owner>/<repo>/actions/workflows/weekly-watcher.yml/dispatches \
  -d '{"ref":"main","inputs":{"reason":"smoke test"}}'
```

## Coût estimé

< 2 $ / run hebdomadaire (Claude Sonnet 4.5 + web_search).

## Sécurité

- `watcher_runs` : RLS admin-only en lecture, écriture via service_role uniquement
- Toutes les insertions de scooters/parts sont `published=false` → validation manuelle requise
- Aucune compatibilité validée n'est touchée (le retrigger respecte `confidence_level='validated'`)
