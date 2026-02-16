

# Mise à jour des Secrets Stripe et Resend

## Ce qui sera fait

Deux secrets à mettre à jour dans le backend du projet :

1. **RESEND_API_KEY** - Clé API pour l'envoi d'emails de confirmation de commande
2. **STRIPE_WEBHOOK_SECRET** - Secret pour valider les notifications de paiement Stripe

## Impact

- Les emails de confirmation de commande fonctionneront (Edge Function `send-order-email`)
- Le webhook Stripe validera correctement les signatures des événements de paiement (Edge Function `stripe-webhook`)

## Temps estimé

1 seul message, 1 crédit. Il restera environ 10 crédits pour publier et tester.

## Après la mise à jour

Pour tester ce soir :
1. Publier le projet
2. Faire un achat test sur Stripe (mode test)
3. Vérifier que l'email de confirmation arrive
4. Vérifier dans l'admin que la commande passe en statut "paid"

