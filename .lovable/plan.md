

# Plan : 2 corrections messagerie admin

## Diagnostic

**Correction 1** : Code vérifié — `Admin.tsx` L12 (import) et L64 (`{activeTab === 'messages' && <ContactMessagesManager />}`) sont **intacts**. `AdminLayout.tsx` L18 contient bien l'entrée nav `messages`. L'onglet existe dans le code. 

**Hypothèse réelle** : le badge unread sur l'onglet Messages compte uniquement `contact_messages` (formulaire public), pas `order_messages` (conversations Garage que l'admin reçoit majoritairement). Résultat → badge à 0 même quand il y a des messages Garage non lus → impression que "rien n'est là". À aligner avec la nouvelle logique `conversation_status`.

**Correction 2** : Confirmé — `send-message-notification/index.ts` L146 pointe vers `https://piecestrottinettes.fr/admin` sans query param.

## Modifications

### Fichier 1 : `supabase/functions/send-message-notification/index.ts`
- L146 : remplacer `href="https://piecestrottinettes.fr/admin"` par `href="https://piecestrottinettes.fr/admin?tab=messages"`
- 1 ligne modifiée

### Fichier 2 : `src/components/admin/AdminLayout.tsx`
Aligner le badge unread sur la nouvelle source de vérité (`conversation_status` avec `status='pending'`) au lieu de `contact_messages.replied`.
- L27-32 : remplacer le `fetchUnread` pour interroger `conversation_status` où `status = 'pending'` (count exact)
- Garder le re-fetch à chaque `activeTab` change
- ~5 lignes touchées

### Fichier 3 : `src/components/admin/AdminSettings.tsx`
Même alignement pour cohérence (badge sur l'onglet "Messages" dans Réglages).
- L19-26 : même remplacement (`conversation_status` filtre `status='pending'`)
- ~5 lignes touchées

## Récap

| Fichier | Action |
|---|---|
| `send-message-notification/index.ts` | URL bouton → `/admin?tab=messages` (1 ligne) |
| `AdminLayout.tsx` | Badge unread basé sur `conversation_status.status='pending'` |
| `AdminSettings.tsx` | Idem pour cohérence |

## Garanties
- `Admin.tsx` non touché (déjà correct)
- Aucune migration SQL (`conversation_status` existe déjà)
- Pas de réécriture de composant
- Edge function redéployée automatiquement après modif

