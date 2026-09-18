# Alertes Telegram pour les messages clients

## 1. Fonctions identifiées (lecture faite, rien modifié)

Deux fonctions seulement envoient l'alerte interne d'un message client :

- `send-contact-email` — formulaire de contact du site. Destinataire interne en dur ligne 20 : `const SHOP_EMAIL = "contact@piecestrottinettes.fr"`.
- `send-message-notification` — fil de messages (garage client et admin). Destinataire interne en dur ligne 224 : `to = 'contact@piecestrottinettes.fr'`, uniquement pour `recipient === 'admin'`.

Ta liste était donc exacte. À signaler sans y toucher : `send-order-email` (ligne 390) envoie aussi vers `contact@piecestrottinettes.fr` — hors périmètre, je n'y touche pas.

## 2. notify-admin — cas `new_message`

Ajout d'une branche `case "new_message"` dans le switch existant, Telegram uniquement (aucun email, pas de doublon).

Message au format demandé, `parse_mode: "HTML"` :

```text
💬 <b>NOUVEAU MESSAGE</b>

Nom · <a href="mailto:…">email</a>
Commande <code>PT-OH4Y</code>

« texte du message »

<i>18/09/2026 à 13:30</i>
```

Règles appliquées :
- La ligne « Commande » est omise entièrement si aucun numéro de commande n'est fourni (pas de valeur vide, pas de « N/A »).
- Texte tronqué à 300 caractères puis « … » si dépassement ; troncature avant échappement HTML pour que `&amp;` ne soit jamais coupé.
- Échappement HTML sur nom, email et texte.
- Date/heure via le formateur Europe/Paris déjà présent dans le fichier.
- `inline_keyboard` : un bouton « 💬 Répondre dans l'admin » → `https://piecestrottinettes.fr/admin`. Aucune route créée.
- Normalisation défensive des champs manquants, mêmes principes que `order_paid` : la notification ne plante jamais, timeout 10 s, réponse 200 en toute circonstance.

Le cas `order_paid` reste strictement inchangé ; la fonction d'envoi Telegram des ventes n'est pas partagée ni refactorisée.

## 3. Branchement de l'appel

Dans `send-contact-email` : après l'insertion en base, l'email interne et l'accusé de réception client, un appel `fetch` vers `notify-admin` avec `type: "new_message"` (nom, email, sujet+message, pas de numéro de commande).

Dans `send-message-notification` : uniquement dans la branche `recipient === 'admin'`, après l'envoi Resend réussi ou non, appel identique avec le numéro de commande quand `orderNumber` est présent.

Dans les deux cas : `try/catch` qui avale toute exception, `console.error` seulement, aucun `throw`, aucune propagation, aucun changement du code de retour. Header `x-internal-secret` lu depuis `INTERNAL_FUNCTION_SECRET` (même nom que côté `notify-admin`, déjà validé en production).

L'accusé de réception client et toute la logique d'enregistrement en base restent intacts.

## 4. Redirection des emails internes

Dans les deux fonctions, le destinataire interne devient `Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "contact@piecestrottinettes.fr"`. Contenu, expéditeur et `reply_to` inchangés.

## Périmètre

- Fichiers touchés : `supabase/functions/notify-admin/index.ts`, `supabase/functions/send-contact-email/index.ts`, `supabase/functions/send-message-notification/index.ts`.
- Aucune migration, aucun schéma, aucun fichier front, aucun refactor.
- `stripe-webhook`, `verify-payment`, `create-checkout-session`, `send-order-email` : non touchés.
- Ensuite : redéploiement des trois fonctions et liste exacte des fichiers modifiés.
