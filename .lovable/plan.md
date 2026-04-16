
Plan confirmé avec option 3 pour l'amélioration 2. J'exécute les 5 modifications chirurgicales en mode default :

**GarageMessages.tsx** (4 zones) :
1. Import `formatDistanceToNow` + `fr` locale (ligne 9)
2. ConversationList L318-353 : badge order vert / "Message général", preview 60 chars, date relative
3. ChatView L481-484 : état vide engageant (icône MessageSquare vert sauge, titre, sous-titre, badge "🔒 Conversation privée")
4. ChatView : message de bienvenue visuel rendu si `messages.length === 0 && selectedConv.order_id !== 'direct'`
5. ChatView L528 : nouveau placeholder
6. ChatView : indicateur "💬 Le support vient de répondre" (3s timer sur nouveau message admin)

**ContactMessagesManager.tsx** (1 zone) :
7. Header GarageConversationView L219-234 : badge vert order_number, nom+email, bouton "Voir la commande" → `/admin?tab=orders`

Aucun autre fichier touché, aucune migration, aucune RLS.
