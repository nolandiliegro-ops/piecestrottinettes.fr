

## Diagnostic rapide

**Sources de données disponibles** (vérifiées dans le schéma) :
- `profiles` (id, display_name, performance_points, created_at) — un row par user inscrit
- `orders` (user_id, customer_email, customer_first_name, customer_last_name, total_ttc, status, created_at) — inclut commandes guest (user_id NULL)
- `user_garage` (user_id, scooter_model_id, nickname) → join `scooter_models` (name) + `brands`
- `order_messages` (user_id, message, created_at, sender_type) — dernier message client/admin
- `contact_messages` (email, name, matched_user_id, created_at) — pour clients arrivés via formulaire

**Note** : pas d'accès direct à `auth.users` côté frontend. On utilise `profiles.created_at` comme proxy d'inscription. Pour les guests sans compte, on les identifie via `orders.customer_email` quand `user_id IS NULL`.

## Plan d'exécution

### Étape 1 — Nouveau composant `src/components/admin/ClientsManager.tsx` (~400 lignes)

**Structure** :
- Header : titre + barre recherche (nom/email) + bouton "Exporter CSV"
- Filtres pills : `Tous / Avec commandes / Sans commande / Actifs (90j) / Inactifs`
- Table responsive (desktop) / cards (mobile) :
  - Nom + Email
  - Commandes (count) + CA Total (sum total_ttc, status='paid'+ statuts post)
  - Garage (count scooters + nom du premier)
  - Dernière activité (max de : last order, last message, last contact)
  - Source (badge : Inscription / Garage / Commande / Contact / Guest)
  - Statut pill (vert Actif / gris Inactif)
- Click row → `ClientDetailSheet` (Sheet droit, pattern existant comme `OrderDetailSheet`)

### Étape 2 — Hook de consolidation `useClientsData` (inline ou séparé)

Stratégie : **plusieurs queries parallèles** + consolidation côté client (pas de RPC, plus simple et chirurgical).

```ts
// 4 queries parallèles via TanStack Query
1. profiles → tous les users inscrits
2. orders → group manuel par user_id ET par customer_email (pour guests)
3. user_garage + join scooter_models/brands
4. order_messages → dernier message par user_id
5. contact_messages → matched_user_id ou email
```

Consolidation : Map clé `user_id || email`, fusion des sources, calcul status (last activity > 90j = inactif), tri par dernière activité DESC.

### Étape 3 — `ClientDetailSheet` (sous-composant inline)

Sheet à droite avec sections :
- En-tête identité : nom, email, badge source, performance_points
- Stats : commandes / CA total / scooters garage / messages
- Liste commandes (compacte, click → query param vers onglet Commandes)
- Liste scooters garage (nom + nickname)
- Derniers messages (3-5 derniers, click → deep-link vers Messages avec userId)

### Étape 4 — Export CSV

Fonction `exportToCSV()` :
- Colonnes : Nom, Email, Date inscription, Nb commandes, CA total, Scooters, Dernière activité, Source, Statut
- Encodage UTF-8 BOM + séparateur `;` pour Excel FR
- Trigger via `Blob` + `URL.createObjectURL` + `<a download>`

### Étape 5 — Intégration nav

**`src/components/admin/AdminLayout.tsx`** :
- Ajouter `{ id: 'clients', icon: Users, label: 'Clients' }` dans `NAV_ITEMS` entre Inventaire et Scanner (note : Commandes n'est pas dans la nav principale actuelle ; à placer entre Inventaire et Scanner pour ergonomie, ou Scanner et Messages selon preference)
- Import `Users` depuis lucide-react

**`src/pages/Admin.tsx`** :
- Import `ClientsManager`
- Ajouter `{activeTab === 'clients' && <ClientsManager />}`

## Récap fichiers touchés

| Fichier | Action |
|---|---|
| `src/components/admin/ClientsManager.tsx` | **Nouveau** (~400 lignes) avec table + sheet détail + export CSV |
| `src/components/admin/AdminLayout.tsx` | +1 entrée `clients` dans `NAV_ITEMS` + import icône |
| `src/pages/Admin.tsx` | +1 import + 1 ligne switch |

## Tables interrogées (lecture seule)

- `profiles` (SELECT all — RLS admin OK)
- `orders` (SELECT all — RLS admin OK)
- `user_garage` (SELECT all via admin role) — ⚠️ **vérifier RLS** : actuellement seul "users can view own garage" existe. **Action** : ajouter policy admin SELECT sur `user_garage` via migration légère.
- `order_messages` (SELECT all — RLS admin OK)
- `contact_messages` (SELECT all — RLS admin OK)
- `scooter_models` + `brands` (public read OK)

## Migration SQL nécessaire (1 policy)

```sql
CREATE POLICY "Admins can view all garages"
ON public.user_garage FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

## Garanties

- 0 modification des onglets existants (Dashboard, Inventaire, Scanner, Messages, Réglages)
- 0 modification du flow Garage utilisateur
- Read-only sur toutes les tables
- Guests (user_id NULL) intégrés via email matching
- Pattern UI cohérent (table + Sheet identique à `OrderDetailSheet`)
- Performance : 5 queries TanStack parallèles, cache 60s

