

# Plan — Messages dans la navigation principale admin

## Ce qui va etre modifie

| # | Fichier | Modification |
|---|---------|-------------|
| 1 | `src/components/admin/AdminLayout.tsx` | Ajouter "Messages" (icone `MessageSquare`) dans `NAV_ITEMS` entre Scanner et Reglages. Ajouter un state pour le count des messages non lus via `supabase.from('contact_messages').select('id', { count: 'exact' }).eq('replied', false)`. Afficher un badge rouge sur l'icone Messages quand count > 0. |
| 2 | `src/pages/Admin.tsx` | Ajouter l'import de `ContactMessagesManager` et le rendu conditionnel `{activeTab === 'messages' && <ContactMessagesManager />}`. |
| 3 | `src/components/admin/AdminSettings.tsx` | Retirer l'onglet "Messages" et l'import de `ContactMessagesManager` puisqu'il sera au niveau principal. |

## Details techniques

**AdminLayout.tsx** :
- Import `supabase`, `useEffect`, `useState`, `MessageSquare` de lucide
- NAV_ITEMS : ajouter `{ id: 'messages', icon: MessageSquare, label: 'Messages' }` en position 4 (avant settings)
- Fetch au mount : `const { count } = await supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('replied', false)` — stocker dans un state `unreadCount`
- Dans le bouton de navigation, si `item.id === 'messages' && unreadCount > 0`, afficher un `<span>` rouge absolu en haut a droite avec le nombre

**Admin.tsx** :
- Ajouter `import ContactMessagesManager from '@/components/admin/ContactMessagesManager'`
- Ajouter `{activeTab === 'messages' && <ContactMessagesManager />}`

**AdminSettings.tsx** :
- Retirer `messages` du tableau `tabs` et le `TabsContent` correspondant
- Retirer l'import de `ContactMessagesManager` et `MessageSquare`

