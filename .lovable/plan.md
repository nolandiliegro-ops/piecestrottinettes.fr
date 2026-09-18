# Durcissement des alertes vendeur avant test en production

Audit terminé. Voici les corrections à appliquer, par ordre de priorité. Aucune n'a été appliquée : lecture seule respectée.

## 1. Supprimer le risque de double alerte (bloquant)

Aujourd'hui les deux chemins (webhook Stripe et vérification au retour de paiement) lisent le statut, puis écrivent. Si les deux tournent en même temps, le vendeur reçoit deux alertes et deux emails client.

Correction : passer à une écriture conditionnelle unique — la mise à jour vers « payée » ne cible que les commandes encore « en attente de paiement », et seul l'appel qui obtient réellement la ligne envoie les alertes. Celui qui arrive second ne fait rien.

## 2. Supprimer le doublon d'email vendeur (bloquant)

Le webhook envoie déjà son propre email vendeur (ancien système) EN PLUS de la nouvelle alerte. Deux emails par vente. Correction : retirer l'ancien bloc d'email vendeur du webhook et garder uniquement la nouvelle alerte centralisée.

## 3. Bouton Telegram « Ouvrir la commande » (manquant)

Il n'existe aucun bouton dans le message Telegram, et aucune page d'administration ne permet d'ouvrir une commande précise. Deux options :
- créer une adresse d'administration par commande, puis ajouter le bouton ;
- ou se contenter d'un bouton vers la liste des commandes.

À trancher avec toi.

## 4. Couleurs de l'email vendeur

L'email actuel utilise la palette sombre/vert d'eau, pas la charte demandée (beige #F5F0E8, vert sauge #4A7C59, orange #FF6600). Correction : réaligner le gabarit sur ces trois couleurs, en gardant le tableau des articles.

## 5. Adresse de réception

L'email part vers `contact@piecestrottinettes.fr` par défaut. Si tu veux une autre adresse, elle sera configurable sans toucher au code.

## Détails techniques

- Garde atomique : `update(...).eq("id", orderId).eq("status", "awaiting_payment").select("id")` dans `stripe-webhook` et `verify-payment` ; envoi des notifications uniquement si une ligne est retournée.
- Retrait de `generateSellerNotificationHTML` et de son envoi Resend dans `stripe-webhook` (lignes 490-521).
- `notify-admin` : ajout de `reply_markup.inline_keyboard` si une URL cible est retenue ; refonte de `buildSellerEmailHtml` sur #F5F0E8 / #4A7C59 / #FF6600.
- Aucun changement de schéma, aucune migration, aucun fichier front.
