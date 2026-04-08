

# Plan — Mettre à jour STRIPE_WEBHOOK_SECRET

## Contexte
Le secret `STRIPE_WEBHOOK_SECRET` doit être mis à jour avec le signing secret LIVE du webhook Stripe (format `whsec_...`).

## Action
Utiliser l'outil `add_secret` (disponible en mode implémentation) pour demander la saisie sécurisée de la nouvelle valeur du secret `STRIPE_WEBHOOK_SECRET`.

## Étape unique
1. Appeler l'outil d'ajout de secret avec le nom `STRIPE_WEBHOOK_SECRET` — cela ouvrira un formulaire sécurisé pour saisir la nouvelle valeur `whsec_...`

## Après mise à jour
- Les fonctions backend `stripe-webhook` et `verify-payment` utiliseront automatiquement la nouvelle valeur
- Aucun redéploiement nécessaire — les secrets sont injectés à l'exécution

