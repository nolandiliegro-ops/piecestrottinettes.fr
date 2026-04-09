

# Plan — Amélioration des cartes PendingScootersManager

## Fichier modifié

**`src/components/admin/PendingScootersManager.tsx`** — réécriture complète avec les 4 fonctionnalités.

## Changements

### 1. Bouton "Tout publier"
En haut, à côté du compteur : un bouton qui fait un `update published = true` sur tous les IDs en attente, avec confirmation AlertDialog.

### 2. Sources web sur chaque carte
Lire `scooter.technical_signature?.sources` (tableau d'objets `{ url, label }` ou strings). Afficher comme liens cliquables sous les specs : "Voir sur mi.com", etc. Extraire le hostname pour le label si c'est juste une URL string.

### 3. Bouton "Modifier image" inline
Un petit bouton 🖼️ sur la carte qui toggle un input URL. On sauvegarde via `update image_url` sur le scooter. Preview instantanée.

### 4. Modale d'édition complète
Bouton "Éditer" (icône Pencil) qui ouvre un Dialog avec tous les champs :
- `image_url` (input + preview)
- `name`, `year` (inputs)
- `power_watts`, `voltage`, `max_speed_kmh`, `range_km`, `tire_size` (inputs number/text)
- `description` (textarea)
- `meta_title`, `meta_description` (inputs)
- `search_terms` (input text, stocké comme string)
- `youtube_video_id`, `affiliate_link` (inputs)

Bouton "Enregistrer" → `update` sur `scooter_models` → invalidate queries → fermer modale.

## Détails techniques

- Un seul fichier modifié : `PendingScootersManager.tsx`
- Composant interne `EditScooterDialog` pour la modale (state local avec `useState` pour chaque champ, initialisé depuis le scooter sélectionné)
- Mutation `updateMutation` pour sauvegarder les modifications
- Mutation `publishAllMutation` pour tout publier
- `technical_signature` est typé `jsonb` — cast avec `as any` pour accéder à `.sources`
- Imports additionnels : `Dialog*`, `Input`, `Textarea`, `Pencil`, `ExternalLink`, `ImageIcon`, `CheckCheck` depuis lucide

