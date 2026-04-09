

# Plan — Upload d'images dans la messagerie

## Diagnostic point 1 (client-ack messages généraux)

Le code est déjà correct. Les logs confirment que le `client-ack` est bien envoyé pour tous les messages, y compris les généraux (`conversationId: user.id`). Aucune correction nécessaire.

## Nouvelle fonctionnalité : Upload d'images

### Migration SQL
- Ajouter colonne `image_url text` nullable sur `order_messages`
- Créer le bucket `order-messages-images` (public)
- RLS sur le bucket : authenticated peut upload, public peut lire

### Fichiers modifiés (4 fichiers)

#### 1. `src/hooks/useOrderMessages.ts`
- Ajouter `image_url` au type `OrderMessage`
- Ajouter param `imageUrl` au `useSendMessage`

#### 2. `src/components/garage/GarageMessages.tsx`
- **ChatView** : ajouter bouton 📎 à côté du textarea, input file caché (accept image/*, max 5MB), upload vers `order-messages-images/{userId}/{timestamp}.ext`, passer l'URL dans l'insert, afficher les images dans les bulles (thumbnail cliquable qui ouvre en grand)
- **NewMessageForm** : même bouton 📎 + preview de l'image avant envoi

#### 3. `src/components/admin/ContactMessagesManager.tsx`
- Dans `GarageConversationView`, afficher les images dans les bulles côté admin (même rendu que côté client)
- Ajouter `image_url` au type `OrderMsg`

#### 4. `supabase/functions/send-message-notification/index.ts`
- Ajouter champ optionnel `imageUrl` dans l'interface
- Dans les 3 templates (client, admin, client-ack), si `imageUrl` fourni, insérer une balise `<img>` cliquable sous le message texte

### Ordre d'exécution

```text
1. Migration SQL (colonne + bucket + RLS)           (5 min)
2. useOrderMessages — types + param imageUrl        (3 min)
3. GarageMessages — bouton 📎 + upload + affichage  (15 min)
4. ContactMessagesManager — affichage images admin  (5 min)
5. send-message-notification — image dans email     (5 min)
6. Déployer edge function                           (2 min)
```

**Total estimé : ~35 min**

