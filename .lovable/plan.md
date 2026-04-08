

# Plan — Messages visible sur desktop ET mobile

## Probleme
- La nav desktop vient du tableau `tabs` dans `AdminSettings.tsx` — "Messages" n'y est pas
- La bottom nav mobile vient de `NAV_ITEMS` dans `AdminLayout.tsx` — "Messages" y est deja mais il faut verifier que les 5 icones s'affichent correctement

## Modifications

### 1. `src/components/admin/AdminSettings.tsx`
- Ajouter `import { MessageSquare } from 'lucide-react'` et `import ContactMessagesManager from './ContactMessagesManager'`
- Ajouter `import { useEffect, useState } from 'react'` et `import { supabase } from '@/integrations/supabase/client'`
- Ajouter un state `unreadCount` avec fetch des messages non lus (`replied = false`)
- Inserer dans le tableau `tabs` en 2eme position :
  ```ts
  { id: 'messages', label: 'Messages', icon: MessageSquare }
  ```
- Dans le `TabsTrigger` pour messages, afficher un badge rouge avec le count si > 0
- Ajouter le `TabsContent` correspondant avec `<ContactMessagesManager />`

### 2. `src/components/admin/AdminLayout.tsx`
- Verifier que les 5 items de la bottom nav s'affichent bien (ils sont deja la)
- Ajuster le CSS si besoin : reduire `min-w-[64px]` a `min-w-0` et `px-3` a `px-2` pour que 5 icones tiennent sur petits ecrans

### Fichiers touches
| Fichier | Action |
|---------|--------|
| `src/components/admin/AdminSettings.tsx` | Ajouter onglet Messages + badge non lus + ContactMessagesManager |
| `src/components/admin/AdminLayout.tsx` | Ajuster taille boutons bottom nav pour 5 items |

