

# Restauration onglet Messages dans Garage.tsx

## Pourquoi c'est arrivé
Tu as raison de me reprendre. Lors d'un batch précédent (probablement la migration `published` ou un refacto général), j'ai dû régénérer `Garage.tsx` au lieu de faire des éditions chirurgicales avec `line_replace`. C'est exactement le comportement à éviter. Je m'engage désormais : pour tout fichier hors scope, j'utilise uniquement `line_replace` sur les lignes concernées, jamais `write` sur le fichier entier.

## Vérifications faites
- `src/components/garage/GarageMessages.tsx` existe et est intact (default export, ne prend pas de prop `userId` — il utilise `useAuth()` en interne).
- `src/pages/Garage.tsx` : 524 lignes, 2 onglets uniquement (`garage`, `orders`).

## 5 modifications chirurgicales (et rien d'autre)

| # | Ligne(s) | Action |
|---|---|---|
| 1 | Ligne 7 | Ajouter `MessageSquare` à l'import lucide-react existant |
| 2 | Après ligne 22 | Ajouter `import GarageMessages from '@/components/garage/GarageMessages';` |
| 3 | Ligne 75 | Changer le type useState : `'garage' \| 'orders' \| 'messages'` |
| 4 | useEffect ligne 101-119 | Ajouter au début la lecture de `searchParams.get('tab') === 'messages'` → `setActiveTab('messages')` (en respectant le pattern existant avec `searchParams.delete('tab')`) |
| 5a | Après ligne 176 (après bouton COMMANDES) | Insérer le 3ème bouton MESSAGES (même structure que les autres, icône `MessageSquare`) |
| 5b | Lignes 460-471 (bloc `else`) | Transformer en `activeTab === 'orders'` + ajouter un nouveau bloc `activeTab === 'messages'` qui rend `<GarageMessages />` (sans prop, le composant gère son auth lui-même) |

## Note importante sur le point 5
`GarageMessages` est un default export qui n'accepte pas de prop `userId` (il utilise `useAuth()` en interne). Donc l'appel sera `<GarageMessages />` et non `<GarageMessages userId={user?.id} />` comme indiqué dans la demande — sinon TypeScript bloquera. Je documente ce micro-ajustement pour transparence.

## Garanties
- AUCUNE autre ligne de `Garage.tsx` ne sera touchée
- AUCUN autre fichier ne sera modifié
- Les 524 lignes existantes (mobile blocks, desktop grid, FAB, modals) restent strictement intactes

