

# Plan de session — 4 points, ordre recommandé

## État actuel (ce qui est déjà OK)

- PWA `short_name` = "PiècesTrott" ✅ (pas "Admin Studio")
- Bouton admin dans Catalogue = `{isAdmin && ...}` ✅ (déjà corrigé)
- `robots.txt` existe déjà ✅
- `loading="lazy"` déjà sur PartCard, MediaGallery, CategoryBentoGrid ✅
- `noindex` déjà sur Admin, Garage, Profile, Checkout, PaymentSuccess, OrderSuccess ✅
- SEO component avec meta dynamiques déjà utilisé sur Catalogue, Scooters, Pepites, Tutos ✅

**Conclusion Point 3** : La plupart des "corrections techniques rapides" sont déjà en place. Seul le `og:image` expiré dans `index.html` reste à corriger.

---

## Point 1 — Détail commande enrichi dans /garage (5 fichiers)

Actuellement, le panneau expandable (`OrderItemsDetails`) affiche les articles mais manque : timeline de statut, adresse, mode de livraison, numéro de suivi, bouton contact.

### Modifications
1. **`src/components/garage/OrderHistorySection.tsx`**
   - Enrichir le type `Order` pour inclure `address`, `postal_code`, `city`, `delivery_method`, `delivery_price`, `customer_first_name`, `customer_last_name`, `tracking_number` (nouveau champ)
   - Modifier la query pour récupérer ces champs (déjà `select('*')` donc OK après migration)
   - Ajouter dans `OrderItemsDetails` :
     - **Timeline visuelle** horizontale des statuts (5 étapes avec points et lignes, étape active colorée)
     - **Section adresse** avec icône MapPin
     - **Mode de livraison** avec badge
     - **Numéro de suivi** (si statut shipped/delivered) avec lien cliquable
     - **Bouton "Contacter le support"** → lien vers `/contact?order={order_number}`
   - Passer `order` complet au composant enfant (pas juste `orderId`)

2. **`src/pages/Contact.tsx`** — Lire le query param `?order=` et pré-remplir le sujet avec le numéro de commande

---

## Point 2 — Numéro de suivi expédition (4 fichiers + 1 migration)

### Migration SQL
```sql
ALTER TABLE public.orders ADD COLUMN tracking_number text;
```

### Modifications
1. **Migration SQL** — ajouter colonne `tracking_number` sur `orders`
2. **`src/components/admin/OrderDetailSheet.tsx`** — Ajouter un champ texte "Numéro de suivi" qui apparaît quand le statut passe à "shipped". Sauvegarder dans la colonne `tracking_number`
3. **`src/components/admin/OrdersManager.tsx`** — Quand on change le statut vers "shipped", ouvrir un prompt ou afficher l'input pour le tracking number
4. **`src/components/garage/OrderHistorySection.tsx`** — Afficher le tracking number côté client (fait dans Point 1)
5. **Email automatique** : Modifier `send-order-email` ou créer une logique dans le webhook de changement de statut pour envoyer un email avec le numéro de suivi. Option simple : déclencher l'envoi depuis l'admin au moment de la saisie du tracking.

---

## Point 3 — Corrections techniques (1 fichier)

Seule correction restante :
1. **`index.html`** — Remplacer les URLs `og:image` et `twitter:image` Google Storage expirées par une URL permanente (image dans le bucket `site-assets` ou URL stable)

---

## Point 4 — SEO de base (2-3 fichiers + 1 edge function)

### Ce qui est déjà fait
- Meta tags dynamiques sur Catalogue, Scooters, Pepites, Tutos ✅
- `noindex` sur Admin, Garage, Checkout, PaymentSuccess ✅

### Ce qui reste
1. **`supabase/functions/generate-sitemap/index.ts`** (nouveau) — Edge function qui génère un `sitemap.xml` dynamique avec :
   - Pages statiques (`/`, `/catalogue`, `/scooters`, `/tutos`, `/pepites`, `/contact`, `/cgv`, `/mentions-legales`)
   - Pages dynamiques : `/pieces/{slug}` (depuis `parts`), `/scooters/{slug}` (depuis `scooter_models`)
   - Exclure pages privées

2. **`public/robots.txt`** — Déjà OK, pointe vers `/sitemap.xml` ✅

---

## Ordre recommandé

```text
Étape 1 : Migration tracking_number              (5 min)
Étape 2 : Point 1+2 ensemble — OrderHistory      (45 min)
          enrichi + tracking côté admin
Étape 3 : Point 3 — og:image index.html          (5 min)  
Étape 4 : Point 4 — Sitemap edge function        (20 min)
```

**Total estimé : ~1h15**

### Fichiers créés/modifiés
1. Migration SQL — `tracking_number` sur orders
2. `src/components/garage/OrderHistorySection.tsx` — détail enrichi + timeline + tracking + bouton contact
3. `src/components/admin/OrderDetailSheet.tsx` — champ tracking number
4. `src/components/admin/OrdersManager.tsx` — prompt tracking au changement de statut
5. `src/pages/Contact.tsx` — pré-remplissage numéro de commande
6. `index.html` — og:image corrigé
7. `supabase/functions/generate-sitemap/index.ts` (nouveau)

