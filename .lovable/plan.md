## Objectif
Redéployer uniquement l'Edge Function `process-images` (code à jour sur le repo, ajout du mode "image déjà détourée" en base64).

## Implémentation
1. `supabase--deploy_edge_functions({ function_names: ["process-images"] })`
2. Retour du statut de déploiement.

## Périmètre exclu
- Aucun changement code / BDD / secrets / RLS / config / autres edge functions / front.

## Rollback
- Redéployer la version précédente depuis l'historique Supabase si régression.

Confirme pour lancer.