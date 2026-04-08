

# Plan — Modifier l'email de notification contact

## Contexte
Actuellement la notification est envoyee a `contact@piecestrottinettes.fr` (SHOP_EMAIL) avec `reply_to: email` (visiteur). Le user veut inverser : envoyer directement au visiteur avec `reply_to: contact@piecestrottinettes.fr`.

## Modification unique

**Fichier** : `supabase/functions/send-contact-email/index.ts`

Lignes 70-84 — changer le premier `resend.emails.send()` :

```typescript
await resend.emails.send({
  from: "piecestrottinettes.fr <noreply@piecestrottinettes.fr>",
  to: [email],
  reply_to: SHOP_EMAIL,
  subject: `[Contact] ${subject} — de ${escapeHtml(name)}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2C2C2C;">Nouveau message de contact</h2>
      <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
      <p><strong>Email :</strong> ${escapeHtml(email)}</p>
      <p><strong>Sujet :</strong> ${escapeHtml(subject)}</p>
      <hr style="border: 1px solid #e8e4e0; margin: 20px 0;" />
      <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
      <hr style="border: 1px solid #e8e4e0; margin: 20px 0;" />
      <p style="background: #f0f7ff; padding: 12px 16px; border-radius: 8px; color: #1a56db; font-weight: bold;">
        📩 Répondre directement à cet email pour contacter le client.
      </p>
    </div>
  `,
});
```

Changements :
- `to` passe de `[SHOP_EMAIL]` a `[email]` (visiteur)
- `reply_to` passe de `email` a `SHOP_EMAIL` (`contact@piecestrottinettes.fr`)
- `subject` inclut le nom du visiteur
- Ajout d'un encart bleu visible "Repondre directement a cet email pour contacter le client"

Apres modification, deployer la fonction avec `deploy_edge_functions`.

