# Roadmap

## En cours
- Traiter les commandes depuis Telegram (plan validé 18/09) : `telegram-webhook` (boutons statut processing/shipped/cancelled, garde atomique, answerCallbackQuery unique, garde-fous remboursement Stripe manuel) + enrichissement `notify-admin` (adresse, client fidèle). Redéploiement + enregistrement setWebhook.

## Signalé, hors périmètre
- `awaiting_payment` absent de `statusConfig` admin (affiche « En attente » par défaut).
- Stock jamais décrémenté à la vente ni restitué à l'annulation.
- `send-order-email` envoie encore une copie vers contact@piecestrottinettes.fr.
