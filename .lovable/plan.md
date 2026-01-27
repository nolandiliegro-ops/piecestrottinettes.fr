# Intégration Stripe Checkout - piecestrottinettes.fr

## Statut: ✅ IMPLÉMENTÉ

## Résumé

L'intégration Stripe Checkout a été mise en place pour sécuriser les paiements. Le flux est le suivant:

1. L'utilisateur remplit le formulaire checkout et valide
2. Un modal de confirmation s'ouvre avec le récap + choix livraison
3. Au clic "PAYER MAINTENANT", l'Edge Function `create-checkout-session` est appelée
4. La commande est créée en base avec status `awaiting_payment`
5. Redirection vers Stripe Checkout (page hébergée par Stripe)
6. Après paiement, retour sur `/payment-success?session_id=xxx`
7. L'Edge Function `verify-payment` vérifie le paiement et met à jour le status
8. Email de confirmation envoyé

## Fichiers Créés/Modifiés

### Edge Functions
- `supabase/functions/create-checkout-session/index.ts` - Création session Stripe
- `supabase/functions/verify-payment/index.ts` - Vérification paiement

### Pages
- `src/pages/PaymentSuccessPage.tsx` - Page de succès après paiement

### Modifications
- `src/pages/CheckoutPage.tsx` - Intégration appel Edge Function
- `src/components/checkout/OrderConfirmationModal.tsx` - Bouton "PAYER MAINTENANT"
- `src/App.tsx` - Route `/payment-success`
- `supabase/config.toml` - Configuration Edge Functions

### Base de Données
- Nouvelles colonnes sur `orders`:
  - `stripe_session_id` (text)
  - `stripe_payment_intent_id` (text)
  - `paid_at` (timestamp)

## Sécurité Anti-Fraude

- Les prix sont recalculés côté serveur (Edge Function)
- Le stock est vérifié avant création de session
- Le paiement est vérifié via l'API Stripe avant mise à jour du status

## Test

Pour tester en mode Stripe Test:
1. Utiliser une carte de test: `4242 4242 4242 4242`
2. Date d'expiration: n'importe quelle date future
3. CVC: n'importe quel nombre à 3 chiffres
