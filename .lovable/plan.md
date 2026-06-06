## Objectif
Redéployer `process-images` pour récupérer le commit 8e211b4 (mode base64 "image déjà détourée").

## Action
1. `supabase--deploy_edge_functions({ function_names: ["process-images"] })`
2. Retour du statut.

## Exclu
Aucun changement code / BDD / secrets / RLS / config / autres functions / front.

## Rollback
Redéployer la version précédente depuis l'historique Supabase si régression.

Confirme pour lancer.