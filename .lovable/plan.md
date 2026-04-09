

# Plan — 3 corrections finales messagerie

## Diagnostic

### Correction 1 — Sujets cohérents pour threading Gmail
**Fichier : `supabase/functions/send-message-notification/index.ts`**
- Actuellement les sujets sont différents selon le sens (client→admin vs admin→client), ce qui empêche Gmail de grouper les fils
- Pas de headers `In-Reply-To` / `References` pour forcer le threading
- **À faire** : utiliser un sujet stable par conversation (basé sur `orderNumber` ou "Question"), et ajouter `In-Reply-To` + `References` avec un Message-ID déterministe (ex: `<conv-{orderNumber}@piecestrottinettes.fr>`)
- Nouveau champ optionnel `conversationId` dans l'interface (order_id ou user_id) pour générer le Message-ID
- Sujets : `💬 [PT-XXXX] Nouveau message — piecestrottinettes.fr` pour les deux sens, avec `Re:` préfixé pour les réponses admin

### Correction 2 — Supprimer les doubles emails
**Audit complet :**
- `GarageMessages.tsx` : 2 appels `recipient: 'admin'` (lignes 68 et 281) — ✅ OK, pas de double (un pour NewMessageForm, un pour ChatView)
- **Pas de `client-ack`** dans GarageMessages — déjà supprimé ✅
- `Contact.tsx` : un seul appel à `send-contact-email` — ✅ pas de double
- **`send-contact-email/index.ts`** : envoie **2 emails** (lignes 93-112 : notification admin + lignes 116-137 : accusé réception visiteur). L'accusé de réception est un email séparé qui double le flux. **À corriger** : supprimer l'accusé de réception (lignes 114-137) — le visiteur connecté voit son message dans le garage, le visiteur non connecté reçoit juste le toast. Si on veut garder un accusé pour les non-connectés, c'est acceptable, mais pour les connectés (`user_id` fourni), il faut le supprimer.
- `ContactMessagesManager.tsx` (admin reply) : 1 appel `recipient: 'client'` — ✅ OK
- `OrderDetailSheet.tsx` : 1 appel `recipient: 'client'` — ✅ OK, mais c'est un **autre point d'entrée** pour les réponses admin depuis la fiche commande

### Correction 3 — Liens `/garage?tab=messages` partout
- `stripe-webhook` : lignes 191 et 199 — ✅ déjà corrigé (`?tab=messages`)
- `send-message-notification` : lignes 78 et 127 — ✅ déjà corrigé
- `send-order-email` : **aucun lien garage** — rien à faire
- `send-contact-email` : **aucun lien garage** — rien à faire

## Fichiers modifiés (2 fichiers)

### 1. `supabase/functions/send-message-notification/index.ts`
- Ajouter champ `conversationId` (optionnel) dans l'interface pour identifier le fil
- Générer un `Message-ID` déterministe : `<conv-{conversationId}@piecestrottinettes.fr>`
- Ajouter headers `In-Reply-To` et `References` pointant vers ce Message-ID sur toutes les réponses
- Sujets unifiés :
  - Client envoie : `💬 [PT-XXXX] Nouveau message — piecestrottinettes.fr` (ou `💬 [Question] ...` si pas de commande)
  - Admin répond : `Re: 💬 [PT-XXXX] Nouveau message — piecestrottinettes.fr`
- Supprimer le template `client-ack` (plus utilisé nulle part)

### 2. `supabase/functions/send-contact-email/index.ts`
- Supprimer l'accusé de réception au visiteur (lignes 114-137) quand `user_id` est fourni (connecté = voit dans garage)
- Garder l'accusé uniquement pour les visiteurs non connectés (pas de `user_id`)

### 3. Callers côté client (mise à jour des appels)
- `GarageMessages.tsx` : ajouter `conversationId` dans les appels (order_id ou user_id)
- `ContactMessagesManager.tsx` : ajouter `conversationId` dans l'appel admin reply
- `OrderDetailSheet.tsx` : ajouter `conversationId` dans l'appel admin reply

## Ordre d'exécution

```text
1. send-message-notification — threading + sujets + supprimer client-ack    (15 min)
2. send-contact-email — supprimer accusé si connecté                        (5 min)
3. GarageMessages + ContactMessagesManager + OrderDetailSheet — conversationId  (5 min)
4. Déployer les 2 edge functions                                            (2 min)
```

**Total estimé : ~25 min**

