# Durcissement des alertes vendeur — version validée avec précisions

## 1. Garde atomique anti-doublon

Dans `stripe-webhook` et `verify-payment`, le passage en « paid » devient une écriture conditionnelle unique : mise à jour ciblant uniquement les commandes dont le statut est encore `awaiting_payment`, avec retour de la ligne modifiée. Seul l'appel qui obtient réellement la ligne déclenche les alertes ; le second ne fait rien. La lecture préalable du statut est supprimée.

## 2. Suppression du doublon d'email vendeur

Retrait de `generateSellerNotificationHTML` et de son envoi Resend dans `stripe-webhook` (lignes 36-130 et 490-521). La nouvelle alerte centralisée devient le seul canal vendeur. L'email client de confirmation reste intact.

## 3. Bouton Telegram

Ajout d'un bouton « Ouvrir la commande » (clavier en ligne) pointant simplement vers https://piecestrottinettes.fr/admin. Aucune nouvelle route, aucun fichier front.

## 4. Couleurs de l'email vendeur

Refonte du gabarit sur la charte : fond #F5F0E8, vert sauge #4A7C59, accents orange #FF6600. Tableau des articles conservé.

## 5. Adresse de réception

Le secret `ADMIN_NOTIFICATION_EMAIL` sera défini à `admin@ndl-agency.com` (valeur fournie par toi, enregistrée sans interaction). Le code conserve cette variable en priorité.

## Périmètre strict

- Fichiers touchés : `supabase/functions/stripe-webhook/index.ts`, `supabase/functions/verify-payment/index.ts`, `supabase/functions/notify-admin/index.ts` uniquement.
- Aucune migration, aucun changement de schéma, aucun fichier front.
- `create-checkout-session` et `send-order-email` intouchés.
- Ensuite : redéploiement des trois fonctions et liste exacte des fichiers modifiés.
