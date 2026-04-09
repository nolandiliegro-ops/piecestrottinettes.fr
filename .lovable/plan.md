

# Plan — 4 corrections finales messagerie

## Fichiers modifiés (4 fichiers)

### 1. `supabase/functions/send-message-notification/index.ts`
- Ajouter un 3ème type de notification : `recipient: 'client-ack'` pour l'accusé de réception
- **Template CLIENT** (admin → client) : déjà correct dans le code actuel (header vert sauge, message complet, CTA). Pas de changement majeur — le template est bon.
- **Template ADMIN** (client → admin) : ajouter le même header vert sauge (au lieu du gris actuel), bouton CTA "RÉPONDRE DANS L'ADMIN" → `https://piecestrottinettes.fr/admin`, footer identique
- **Template ACCUSÉ** (nouveau, `recipient: 'client-ack'`) : header vert sauge, titre "✅ Votre message a bien été reçu", corps avec prénom + "nous répondrons sous 48h" + "notification email et suivi dans votre garage", bouton CTA "VOIR MON GARAGE" → `https://piecestrottinettes.fr/garage?tab=messages`, footer

### 2. `src/components/garage/GarageMessages.tsx`
- **NewMessageForm** : refaire le design avec icône ✉️, titre "Nous contacter", description "Une question sur une commande ou un produit ?", champ Sujet, dropdown commandes (affichant `PT-XXXX — premier item`), textarea Message, bouton Envoyer vert
- Après envoi du message (dans `handleSend` de NewMessageForm ET dans `handleSend` de ChatView) : appeler `send-message-notification` avec `recipient: 'client-ack'` pour envoyer l'accusé de réception au client
- Le dropdown commandes doit aussi fetcher le premier `order_items.part_name` pour afficher "PT-XXXX — Chambre à air..."

### 3. `supabase/functions/send-contact-email/index.ts`
- Ajouter un champ optionnel `user_id` dans le schema Zod
- Si `user_id` est fourni : insérer le message dans `order_messages` (avec `order_id = null`, `sender_type = 'client'`, `user_id`, et le message préfixé du sujet `[Sujet]\nMessage`)
- Utiliser `supabaseAdmin` (service role) pour l'insert, bypass RLS

### 4. `src/pages/Contact.tsx`
- Si l'utilisateur est connecté (`user` disponible via `useAuth`), passer `user_id: user.id` dans le payload envoyé à `send-contact-email`

## Ordre d'exécution

```text
1. send-message-notification — 3 templates + déploiement     (15 min)
2. send-contact-email — insert order_messages si connecté     (5 min)
3. Contact.tsx — passer user_id                               (2 min)
4. GarageMessages.tsx — design + accusé de réception          (15 min)
```

**Total estimé : ~40 min**

