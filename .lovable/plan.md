Redéployer les deux Edge Functions qui dépendent du code partagé modifié dans `supabase/functions/_shared/` :

1. `bulk-insert-parts`
2. `retrigger-compatibility-matching`

Action unique via `supabase--deploy_edge_functions` avec les deux noms. Aucune modification de code, aucune migration BDD, aucun secret touché.

Après déploiement, je te confirme avec l'horodatage UTC retourné par l'outil pour que tu vérifies qu'il est bien postérieur à ton push (commit e54db70).