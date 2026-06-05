## Objectif
Redéployer uniquement l'Edge Function `bulk-insert-parts`.

## Fichiers concernés
Aucun. Appel unique à `supabase--deploy_edge_functions(["bulk-insert-parts"])`.

## Implémentation
1. `supabase--deploy_edge_functions({ function_names: ["bulk-insert-parts"] })`
2. Retour de l'horodatage UTC du déploiement.

## Plan de test
- Vérifier que le déploiement renvoie un succès.
- Tu peux ensuite tester via ton script d'import habituel.

## Plan de rollback
- Redéployer la version précédente depuis l'historique Supabase si régression.

## Périmètre exclu
- Aucun changement code / BDD / secrets / RLS / autres fonctions.

Confirme pour lancer.