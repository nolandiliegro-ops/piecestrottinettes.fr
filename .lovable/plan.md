# Traiter les commandes depuis Telegram

## Étape 1 — Réponses aux 6 questions

**Q1 — Valeurs de statut connues de l'admin**
`src/components/admin/OrdersManager.tsx` lignes 55-97 (`statusConfig`) :
- ligne 61 `pending` → « En attente »
- ligne 67 `paid` → « Payé »
- ligne 73 `processing` → « En préparation »
- ligne 79 `shipped` → « Expédié »
- ligne 85 `delivered` → « Livré »
- ligne 91 `cancelled` → « Annulé »

Le menu déroulant est construit ligne 99-102 (`statusOptions`) à partir de ce même mapping, donc les 6 valeurs sont proposées. « Expédié » = `shipped`, « Livré » = `delivered` : elles existent bien dans le code admin (juste jamais encore utilisées en base). À noter : `awaiting_payment` (présent en base, 4 lignes) n'est PAS dans le mapping — l'admin l'affiche donc avec le style `pending` par défaut (ligne 173). Je le signale, je n'y touche pas.

**Q2 — Identifiant court** : `orders.order_number`, type `text` (ex. `PT-MBG1`). Colonne `NOT NULL`. `orders.id` est un `uuid`, trop long pour un `callback_data`.

**Q3 — Adresse de livraison dans `orders`** : oui — `address` (text), `postal_code` (text), `city` (text). Plus `customer_phone` (text). Aucune colonne pays / complément d'adresse.

**Q4 — Décrément du stock** : NON. Aucune écriture sur `parts.stock_quantity` dans `stripe-webhook` ni dans aucune Edge Function de paiement. Le stock n'est que *lu* pour vérification avant paiement : `supabase/functions/create-checkout-session/index.ts` ligne 115 (`select ... stock_quantity`) et ligne 128 (contrôle de disponibilité). Aucune restitution à l'annulation, puisqu'il n'y a jamais de décrément. **Conséquence : le stock restant ne sera PAS affiché dans l'alerte** — ce serait un chiffre faux.

**Q5 — Pattern public** : `supabase/config.toml` lignes 24-25 :
```
[functions.stripe-webhook]
verify_jwt = false
```
(même forme pour `notify-admin`, lignes 57-58).

**Q6 — Inline keyboard actuel (vente)** : `supabase/functions/notify-admin/index.ts` lignes 109-113 :
```ts
reply_markup: {
  inline_keyboard: [[
    { text: "📦 Ouvrir la commande", url: "https://piecestrottinettes.fr/admin" },
  ]],
},
```

---

## Étape 2 — Plan

### A. Nouvelle Edge Function `telegram-webhook`
- `supabase/functions/telegram-webhook/index.ts`, entrée `[functions.telegram-webhook] verify_jwt = false` dans `config.toml` (même forme que Q5).
- Sécurité, les deux contrôles :
  1. `X-Telegram-Bot-Api-Secret-Token` comparé en temps constant au nouveau secret `TELEGRAM_WEBHOOK_SECRET`. Absent ou faux → `401`, aucun traitement, aucun accès base.
  2. `callback_query.from.id` comparé à `TELEGRAM_CHAT_ID`. Différent → log + `200 { ignored: true }`, aucun traitement.
- `answerCallbackQuery` envoyé immédiatement après validation (avant tout travail base) pour éteindre le spinner ; le texte du toast est ensuite mis à jour par un second `answerCallbackQuery` seulement si Telegram l'autorise, sinon l'information part dans `editMessageText`.
- Réponse `200` systématique et rapide ; tout `update` sans `callback_query` (message texte, autre type) → `200 { skipped: true }`.
- Toute exception catchée, `console.error`, réponse `200`. Jamais de `throw`.
- Client base via `SUPABASE_SERVICE_ROLE_KEY` (contourne RLS, pas de changement de politique).

### B. Boutons sur le message de vente (`notify-admin`, `order_paid`)
Clavier à deux rangées :
- rangée 1 (inchangée) : `📦 Ouvrir la commande` → `https://piecestrottinettes.fr/admin`
- rangée 2 (nouvelle, callback) :
  - `🔧 En préparation` → `s:processing:<order_number>`
  - `🚚 Expédié` → `s:shipped:<order_number>`
  - `❌ Annulé` → `s:cancelled:<order_number>`

Les trois valeurs existent déjà dans le mapping admin (Q1) — aucune valeur nouvelle. `callback_data` = `s:` + statut + `:` + `order_number` : ~22 octets, très en dessous de la limite de 64. Longueur vérifiée à la construction ; si jamais elle dépassait, le bouton est simplement omis (le message part quand même).

### C. Traitement de l'action
- Transitions autorisées, une par action, avec statut attendu :
  - `processing` seulement depuis `paid`
  - `shipped` seulement depuis `processing` ou `paid`
  - `cancelled` seulement depuis `paid` ou `processing`
- `UPDATE orders SET status = ... WHERE order_number = ... AND status IN (...) RETURNING id, status` : garde atomique, comme celle déjà en place dans `stripe-webhook`. 0 ligne → toast « ⚠️ Déjà traité » et aucune modification.
- Après succès : `editMessageText` réécrit le message d'origine avec une ligne d'état ajoutée (`✅ Statut : Expédié · 18/09 09:42`) et un clavier réduit aux seules actions encore pertinentes (plus rien après `shipped` ou `cancelled`, hors le bouton URL). Si `editMessageText` échoue, on tente `editMessageReplyMarkup`, et l'échec des deux ne fait jamais échouer la réponse `200`.
- Idempotence côté Telegram : un même `callback_query.id` rejoué ne peut pas changer deux fois le statut, puisque la garde atomique ne matche plus.

### D. Enrichissement du message de vente (`notify-admin`, `order_paid`)
- **Adresse de livraison** : ajoutée sur ses propres lignes (rue / code postal + ville), ainsi que le téléphone s'il existe. Les champs sont déjà transmis par les appelants (`address.street/postalCode/city`, lignes 383-387) — aucun appelant à modifier.
- **Stock restant** : NON affiché. Q4 démontre qu'aucun décrément n'existe ; afficher une valeur serait mensonger.
- **Marqueur « client déjà venu »** : `notify-admin` fait une requête de comptage `orders` sur `customer_email` avec `status` payé/traité, en excluant la commande en cours. Si ≥ 1 → ligne `🔁 Client fidèle (N commandes)`. Requête isolée, timeout court, échec → ligne simplement omise, la notification part quand même.

### Périmètre
Fichiers touchés : `supabase/functions/telegram-webhook/index.ts` (nouveau), `supabase/functions/notify-admin/index.ts`, `supabase/config.toml` (une entrée). Nouveau secret : `TELEGRAM_WEBHOOK_SECRET` (généré côté serveur), puis enregistrement du webhook auprès de Telegram via `setWebhook` avec ce `secret_token`.

Aucune migration, aucune colonne, aucune valeur de statut nouvelle en base, aucun fichier front. `stripe-webhook`, `create-checkout-session`, `verify-payment`, `send-order-email`, `send-contact-email`, `send-message-notification` ne sont pas touchés.

### Points signalés, non traités
- `awaiting_payment` absent de `statusConfig` (admin l'affiche comme « En attente » par défaut).
- Le stock n'est jamais décrémenté à la vente ni restitué à l'annulation.
- `send-order-email` envoie toujours une copie vers `contact@piecestrottinettes.fr`.
