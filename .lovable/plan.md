

## Diagnostic

`Admin.tsx` n'importe pas `OrdersManager` et n'a aucune ligne `{activeTab === 'orders' && <OrdersManager />}`. Quand l'URL est `/admin?tab=orders`, le state `activeTab` passe bien à `'orders'` (le useEffect fonctionne), mais aucun bloc conditionnel ne match → rendu vide sous `AdminLayout` = page blanche.

## Fix chirurgical (2 lignes)

`src/pages/Admin.tsx` :
- L13 +1 : `import OrdersManager from '@/components/admin/OrdersManager';`
- L67-72 +1 : `{activeTab === 'orders' && <OrdersManager />}`

## Vérifications

- `OrdersManager.tsx` : déjà existant, pas de crash potentiel détecté à l'import (composant fonctionnel utilisé ailleurs dans la nav).
- `useEffect` sync `activeTab` : OK, pas de modif nécessaire.

## Fichier touché

| Fichier | Action |
|---|---|
| `src/pages/Admin.tsx` | +1 import, +1 ligne de rendu conditionnel |

