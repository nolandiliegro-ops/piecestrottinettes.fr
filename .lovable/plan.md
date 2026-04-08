

# Plan — Corriger le destinataire de la notification contact

## Modification unique

**Fichier** : `supabase/functions/send-contact-email/index.ts`

Changer le premier `resend.emails.send()` :
- `to`: remettre `[SHOP_EMAIL]` (contact@piecestrottinettes.fr)
- `reply_to`: remettre `email` (adresse du visiteur)
- Garder le subject avec le nom et l'encart bleu

Redéployer avec `deploy_edge_functions`.

