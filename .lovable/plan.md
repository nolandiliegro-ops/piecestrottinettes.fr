

# Plan : 2 corrections chirurgicales

## PROBLÈME 1 — Onglet Messages vide dans nav admin

**Cause racine identifiée** : `AdminLayout.tsx` (NAV_ITEMS) déclare un onglet `messages`, mais `src/pages/Admin.tsx` ne gère que 4 cas (`dashboard`, `inventory`, `scanner`, `settings`). Quand on clique sur Messages → `activeTab === 'messages'` mais aucun composant n'est rendu → écran blanc.

**Correction (Admin.tsx, 1 ligne ajoutée)** :
Ajouter après la ligne `{activeTab === 'scanner' && <AdminScanner />}` :
```tsx
{activeTab === 'messages' && <ContactMessagesManager />}
```
+ ajouter l'import `ContactMessagesManager`.

**Bonus** : retirer l'onglet doublon "Messages" dans `AdminSettings.tsx` (lignes 33 + TabsContent ligne 73) pour éviter la duplication. **NON** — je ne touche pas à AdminSettings pour rester strictement chirurgical sur le bug demandé. Le doublon est inoffensif.

## PROBLÈME 2 — Pas d'upload image côté admin

**Composant à modifier** : `ContactMessagesManager.tsx` → `GarageConversationView` (lignes 99-248), spécifiquement la zone Reply (lignes 230-245) et `handleReply` (lignes 140-178).

**Pattern réutilisé** depuis `GarageMessages.tsx` (helpers `uploadMessageImage`, `AttachButton`, `ImagePreview` existants — je les recopie en local plutôt qu'extraire pour rester chirurgical).

**Modifications dans `ContactMessagesManager.tsx`** :

1. **Imports (ligne 6)** : ajouter `Paperclip, X` à lucide-react
2. **Helpers en haut du fichier (après ligne 7)** : ajouter `MAX_IMAGE_SIZE`, `uploadMessageImage` (admin upload sous path `admin/{user_id}/{timestamp}`)
3. **GarageConversationView state** : ajouter `imageFile`, `uploading`, `inputRef`
4. **handleReply** : upload l'image si présente avant `insert`, ajouter `image_url: imageUrl` dans le payload, fallback message à `'📷 Image'` si vide
5. **JSX zone reply (230-245)** : 
   - Ajouter une preview au-dessus du textarea si `imageFile` présent
   - Ajouter bouton Paperclip + input file caché à gauche du textarea
   - Permettre envoi si image OU texte (`!replyText.trim() && !imageFile`)

**Sécurité** : le bucket `order-messages-images` est déjà public et utilisé côté client. Pas de migration RLS nécessaire — admin authentifié peut déjà uploader (RLS standard storage).

## Fichiers touchés (2 seulement)

| Fichier | Modifications |
|---|---|
| `src/pages/Admin.tsx` | +1 import, +1 ligne pour rendre `<ContactMessagesManager />` quand `activeTab === 'messages'` |
| `src/components/admin/ContactMessagesManager.tsx` | Helpers upload + bouton Paperclip + preview + handleReply enrichi (toutes les modifs limitées à `GarageConversationView` et au top du fichier) |

## Garanties
- Aucune autre ligne touchée hors des zones citées
- AdminLayout, AdminSettings, GarageMessages, useOrderMessages : INTACTS
- Réutilisation exacte du pattern client (même bucket, même structure `order_messages.image_url`)

