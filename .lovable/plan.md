# Edge Function `ingest-fitment-raw` (Key Hunter)

Passerelle d'écriture pour le job nocturne externe `pt-stock-sync`, qui n'a jamais de clé service_role. La fonction porte la clé côté serveur et n'expose que deux actions, sur deux tables.

## 1. Fichiers touchés — exactement deux

1. `supabase/functions/ingest-fitment-raw/index.ts` — **créé**
2. `supabase/config.toml` — **modifié** : ajout de `[functions.ingest-fitment-raw]` / `verify_jwt = false`

Rien d'autre. Aucune migration, aucune policy, aucun fichier front, aucune autre fonction touchée.

## 2. Authentification

- Secret dédié `KEY_HUNTER_SECRET`, lu via `Deno.env.get`. `ADMIN_BULK_SECRET` n'est jamais utilisé ici.
- `OPTIONS` → `200 "ok"` avec les mêmes `corsHeaders` que `bulk-insert-parts` (`Access-Control-Allow-Origin: *`, headers incluant `x-admin-secret`).
- Secret absent de l'environnement, header absent, ou différent → `401 {"error":"Unauthorized"}`, avant toute création de client Supabase et avant toute lecture.
- Comparaison en temps constant (longueur + XOR octet par octet) pour ne pas fuiter la longueur du secret.
- Méthode ≠ POST (hors OPTIONS) → `405 {"error":"Method not allowed"}`.
- Le secret doit être ajouté dans Paramètres du projet → Secrets (je peux l'enregistrer après approbation).

## 3. Réponses JSON

Toute réponse 200 porte la signature de version, pour qu'un smoke-test puisse identifier le déploiement sans écrire :

`snapshot` (lecture seule) :
```json
{
  "engine": "key-hunter-ingest",
  "contract": 1,
  "action": "snapshot",
  "human_aliases": [{ "source": "wattiz", "raw_model": "Mantis Pro", "scooter_model_slug": "kaabo-mantis-pro" }],
  "dedup_keys": ["..."],
  "alias_pairs": [{ "source": "wattiz", "raw_model": "Mantis Pro" }],
  "counts": { "human_aliases": 55, "dedup_keys": 1234, "alias_pairs": 51 },
  "errors": []
}
```

`ingest` (écriture) :
```json
{
  "engine": "key-hunter-ingest",
  "contract": 1,
  "action": "ingest",
  "received": { "rows": 120, "aliases": 8 },
  "inserted": 100,
  "updated": 20,
  "alias_inserted": 6,
  "alias_ignored": 2,
  "errors": [{ "stage": "rows_with_slug", "batch": 1, "range": "0-499", "message": "..." }],
  "batches": { "rows_with_slug": 1, "rows_without_slug": 2, "aliases": 1 }
}
```

Note de franchise sur `inserted` / `updated` : un upsert PostgREST ne dit pas quelle ligne était neuve. Pour être exact, je calcule avant écriture l'ensemble des `dedup_key` déjà présents (lecture ciblée `in(...)` par paquets de 200 sur les clés du payload) ; `inserted` = clés absentes, `updated` = clés présentes. Idem pour les alias : lecture des couples existants → `alias_inserted` / `alias_ignored`. Sans cette lecture préalable les compteurs seraient inventés.

## 4. Pagination et lots

- **Snapshot** : boucle `range(offset, offset + 999)` tant que la page renvoie 1000 lignes, `order("id")` (ou `source,raw_model`) pour une pagination stable. Trois lectures indépendantes : `supplier_model_alias` filtrée `not("scooter_model_slug","is",null)`, `fitment_raw` (colonne `dedup_key` seule), `supplier_model_alias` (`source, raw_model`). Garde-fou : arrêt à 200 pages avec une entrée dans `errors` plutôt qu'une boucle infinie.
- **Ingest rows** : partition en deux groupes selon la *présence de la clé* `model_slug` dans l'objet (`"model_slug" in row`, pas la valeur), puis tranches de 500 dans chaque groupe, upsert `onConflict: "dedup_key"`, `ignoreDuplicates: false`. Aucune clé absente n'est ajoutée : les payloads sont transmis tels quels, jamais complétés par `null`.
- **Ingest aliases** : tranches de 500, `onConflict: "source,raw_model"`, `ignoreDuplicates: true`.
- Chaque lot est dans son propre `try/catch` : un échec est poussé dans `errors` (stage, index de lot, plage, message) et les lots suivants sont tentés.
- `alias_key` est retiré explicitement des payloads (`rows` et `aliases`) avant écriture, car c'est une colonne générée.
- Les alias sans `scooter_model_slug` sont envoyés avec `status: "unresolved"` (et jamais `resolved`) pour satisfaire `smalias_resolved_chk` ; si le payload fournit un couple incohérent (slug sans status, ou status resolved sans slug), je normalise le `status` d'après la présence du slug.

## 5. Cas d'erreur et codes HTTP

| Cas | Code | Corps |
|---|---|---|
| OPTIONS | 200 | `ok` |
| Méthode ≠ POST | 405 | `{"error":"Method not allowed"}` |
| `KEY_HUNTER_SECRET` absent / header absent / faux | 401 | `{"error":"Unauthorized"}` |
| JSON invalide ou body non-objet | 400 | `{"error":"Invalid JSON body"}` |
| `action` manquante ou inconnue | 400 | `{"error":"Unknown action","allowed":["snapshot","ingest"]}` |
| `rows` ou `aliases` présents mais pas des tableaux | 400 | `{"error":"rows and aliases must be arrays"}` |
| Ligne `rows` sans `source`/`category`/`claim_type`/`dedup_key` | — | ligne écartée, entrée dans `errors` (stage `validation`), le reste passe |
| Alias sans `source` ou `raw_model` | — | idem |
| `ingest` avec rows et aliases vides | 200 | compteurs à zéro, **aucune** écriture, aucun client de lecture sollicité |
| Échec d'un lot (FK, CHECK, réseau) | 200 | compteurs partiels + `errors` détaillés |
| Échec de lecture snapshot | 200 | listes partielles + `errors` (le job décide) |
| `SUPABASE_SERVICE_ROLE_KEY` absente de l'environnement | 500 | `{"error":"Server misconfigured"}` |
| Exception non prévue | 500 | `{"error":"Internal error","detail":"..."}` |

Aucun secret ni token n'apparaît dans les logs ou les réponses.

## 6. Points où la spec me semble incomplète — signalés, pas corrigés

1. **`inserted`/`updated` ne sont pas gratuits.** Un upsert ne distingue pas les deux. Je propose la lecture préalable décrite au §3 (coût : quelques requêtes `in(...)`). Si tu préfères zéro lecture, il faudra accepter `upserted` unique à la place de la paire — dis-moi.
2. **FK `scooter_model_slug` → `scooter_models(slug)`** : un alias déjà résolu par le job avec un slug inexistant fait échouer tout son lot de 500. Je propose de laisser échouer le lot et de le reporter dans `errors` (aucune lecture de `scooter_models`, table interdite). Alternative si tu veux : lots d'alias réduits à 100 pour limiter la casse.
3. **`ignoreDuplicates: true` + compteur `alias_ignored`** : sans la lecture préalable des couples existants, ce compteur est impossible à renseigner. Même arbitrage que le point 1.
4. **Pas de limite de taille de body** : une requête de 50 000 lignes passerait et pourrait dépasser la limite mémoire/temps d'une Edge Function. Je propose un plafond dur (par ex. 5 000 `rows` et 5 000 `aliases` par appel → `413`), à confirmer.
5. **Pas d'idempotence au niveau de l'appel** : deux exécutions du job donneraient les mêmes upserts (donc inoffensif), mais rien ne détecte un rejeu. Suffisant pour ce cas, signalé pour mémoire.
6. **`fitment_raw.id`** : si le job envoie un `id`, l'upsert le respecterait. Je propose de l'ignorer côté fonction (la clé de conflit est `dedup_key`), à confirmer.

Après approbation : écriture des deux fichiers, enregistrement du secret `KEY_HUNTER_SECRET`, déploiement de la fonction, puis smoke-test `{"action":"snapshot"}` (lecture seule) et vérification qu'un appel non signé renvoie 401.
