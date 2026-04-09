

# Plan — 5 corrections messagerie

## Analyse

1. **Onglet Messages** : déjà toujours visible (aucune condition). Rien à changer.
2. **Email notification** : le template HTML utilise `${data.messageText}` correctement. Le code admin envoie `messageText: text` (ligne 146). Le template semble correct — le problème pourrait venir d'un déploiement manquant. Je vais redéployer la fonction.
3. **ContactMessagesManager** : ne lit que `contact_messages`, pas `order_messages`.
4. **Message auto** : `stripe-webhook` ne crée aucun `order_messages` après paiement.
5. **Profil client** : juste un petit widget discret, pas de carte identité.

## Fichiers modifiés (4 fichiers + 1 edge function redéployée)

### 1. `src/pages/Garage.tsx`
- Remplacer le widget compact par une **carte profil** en haut de page : avatar avec initiales, nom complet, niveau XP (nom + icône + barre de progression), badge coloré, nombre de commandes (query `orders` count)
- L'onglet Messages est déjà toujours visible — pas de changement

### 2. `src/components/admin/ContactMessagesManager.tsx`
- Ajouter un second fetch sur `order_messages` (jointure manuelle avec `orders` pour récupérer `order_number`, `customer_email`, `customer_first_name`)
- Fusionner les deux sources dans une liste unifiée, triée par date
- Chaque message `order_messages` affiche le numéro de commande, le sender_type, et permet de répondre directement (insert + appel edge function)
- Ajouter un filtre/onglet "Contact" / "Commandes" / "Tous"

### 3. `supabase/functions/stripe-webhook/index.ts`
- Après la mise à jour du statut en "paid" (ligne 303), insérer un message auto dans `order_messages` :
  ```
  sender_type: 'admin'
  message: "Merci pour votre commande ! Nous avons bien reçu votre paiement et préparons votre colis. Vous recevrez votre numéro de suivi dès l'expédition. 🛵"
  ```
- Utiliser `supabaseAdmin` (service role, bypass RLS)

### 4. `supabase/functions/send-message-notification/index.ts`
- Redéployer la fonction pour s'assurer que le template est à jour (le code semble correct mais pourrait ne pas avoir été déployé)

## Ordre d'exécution

```text
1. stripe-webhook — message auto après paiement       (5 min)
2. ContactMessagesManager — messages unifiés admin     (20 min)
3. Garage.tsx — carte profil en haut                   (15 min)
4. Redéployer send-message-notification                (2 min)
```

**Total estimé : ~45 min**

