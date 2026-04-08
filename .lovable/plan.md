
Plan — Ajuster uniquement l’objet de la notification vendeur

- Fichier concerné : `supabase/functions/send-contact-email/index.ts`
- État actuel vérifié :
  - `to: [SHOP_EMAIL]` est déjà correct
  - `reply_to: email` est déjà présent
  - le problème vient donc surtout de l’usage Gmail, pas de l’absence de `reply_to`

Modif prévue
- Conserver la logique actuelle d’envoi vendeur :
  - `from: "piecestrottinettes.fr <noreply@piecestrottinettes.fr>"`
  - `to: [SHOP_EMAIL]`
  - `reply_to: email`
- Changer uniquement le `subject` de la notification vendeur pour inclure clairement le nom + l’email du client :
  ```ts
  subject: `[Contact] ${subject} — de ${escapeHtml(name)} <${escapeHtml(email)}>`
  ```
- Garder l’encart bleu visible dans le HTML :
  - “Répondre directement à cet email pour contacter le client.”

Pourquoi cette approche
- L’adresse `from` ne doit pas être remplacée par l’email librement saisi par le visiteur, sinon il y a un risque de non-délivrabilité / rejet SPF-DKIM-DMARC.
- La configuration la plus sûre reste :
  - expéditeur technique = votre domaine
  - destinataire = `contact@piecestrottinettes.fr`
  - `reply_to` = email du visiteur
- Comme Gmail peut parfois privilégier l’expéditeur affiché dans certains contextes, ajouter l’email du client dans l’objet permet de l’avoir immédiatement visible et de lancer un nouveau message manuellement si besoin.

Fichier touché
- `supabase/functions/send-contact-email/index.ts`

Après implémentation
- Redéployer la fonction backend
- Tester avec un vrai message :
  1. envoyer via `/contact`
  2. vérifier que l’email arrive sur `contact@piecestrottinettes.fr`
  3. vérifier que l’objet contient bien `Nom <email>`
  4. vérifier si le bouton “Répondre” utilise bien le client ; sinon au minimum l’email du client reste visible directement dans l’objet
