# Intégration Carte Rider v7 dans le Garage

## Vérifications faites avant ce plan

Maquette lue (561 lignes) : CSS 3D isolé (`perspective:1900px`, `preserve-3d`, `backface-visibility`, `rotateY(180deg)`, `@keyframes sheen`, variables `--f1/--m1/--tint`), rendu piloté par `state = {view, back, liked, likes, featured, mood, railFrom}` et deux fonctions de rendu (`riderCard` / `machineCard`) partageant `railHTML` + `socialHTML`.

Base de données réelle, contrôlée dans le schéma actuel :

| Champ demandé | Réalité en base |
| --- | --- |
| `profiles` pseudo / XP / ville | OK : `display_name`, `performance_points`, `rider_location`, `avatar_url` |
| `user_garage.custom_nickname` / `photo_url` | Existent sous d'autres noms : `nickname`, `custom_photo_url` |
| `user_garage.is_featured` | **N'existe pas** |
| `user_garage.mood` | **N'existe pas** |
| `scooter_models.rarity` / `holo_effect` | **N'existent pas** (`power_watts`, `price_eur` existent) |
| `profiles.card_likes` | **N'existe pas** |
| `garage_modifications` | OK (`part_id`, `installed_at`, `xp_earned`, `order_item_id`) |
| `calculateScooterStats` | **Introuvable dans le repo** — aucune occurrence dans `src/` |

Le niveau et le grade (« Mécano », LVL 4) sont déjà centralisés dans `src/lib/xpLevels.ts` — je réutilise, je ne recalcule pas.

## Ce que je propose de construire

### Étape 1 — Migration base de données (minimale)

Une seule migration ajoute les 4 colonnes manquantes indispensables à la persistance :

- `user_garage.is_featured` (booléen, défaut faux) — machine à la une, position 0 du carrousel
- `user_garage.mood` (texte, défaut `fini`) — mood par machine
- `user_garage.card_likes` (entier, défaut 0) — compteur de likes de la carte
- `scooter_models.holo_effect` (booléen, défaut faux) — carte holo

La **rareté n'est pas migrée** : elle est dérivée de la puissance via un barème déterministe (`commune` < 500 W, `peu` < 1000, `rare` < 2000, `epique` < 3000, `legendaire` ≥ 3000), ce qui donne un résultat exact pour tout le catalogue existant sans travail de saisie. Si tu préfères une colonne `rarity` éditable en admin, dis-le et je l'ajoute à la migration.

### Étape 2 — CSS isolé

`src/components/garage/RiderCard.css` : copie intégrale du CSS carte de la maquette (lignes 34→241), sans conversion Tailwind, sans toucher aux dimensions (`width:300px`, `aspect-ratio:5/7`) ni aux calculs de ratio. Les styles de page de démo (`body`, `.wrap`, `.hint`, `h1`, `.lead`) sont écartés — ils appartiennent à la page de démo, pas au composant. Toutes les classes sont préfixées `rcv7-` pour garantir zéro collision avec le CSS global du projet.

### Étape 3 — Couche données

`src/lib/riderStats.ts` (nouveau, puisque `calculateScooterStats` n'existe pas) :
- puissance cumulée du garage (somme `power_watts`)
- total de pièces montées + part venant du site (`order_item_id` non nul)
- nombre de cartes holo débloquées
- barème de rareté et palette associée (les 5 objets `RAR` de la maquette)

`src/hooks/useRiderCardData.ts` : un seul hook TanStack Query qui agrège `profiles`, `user_garage` + `scooter_models` joint, et `garage_modifications` (avec `parts` + `categories`) pour tout le garage en une passe — pas un appel par machine.

Mutations : `useSetFeaturedMachine`, `useSetMachineMood`, `useToggleCardLike`, avec invalidation du cache garage existant.

### Étape 4 — Composant

`src/components/garage/RiderCard.tsx`, découpé en sous-composants dans le même dossier :
- `RiderCard.tsx` — état (`view`, `back`, `railFrom`), cadre extérieur, flip
- `RiderCardFace.tsx` — carte rider globale (position 0) : machine à la une au premier plan, silhouettes des autres derrière
- `MachineCardFace.tsx` — carte machine (positions 1 à N) : modèle, marque, puissance, mods, rareté
- `MachineRail.tsx` — carrousel, slots pointillés « + », plafonné à 12 vignettes
- `CardBackFace.tsx` — verso photo réelle ou slot d'incitation « +50 XP / Montre-la en vrai »

Verrou du cadre : le cadre acier `#5FB4D4` et le bandeau profil (grade, XP, ville, N° rider) sont rendus par `RiderCard.tsx` **au-dessus** des faces, donc structurellement impossibles à altérer par la machine consultée. Seules les variables `--m1/--m3/--tint` de la vitrine changent selon la rareté sélectionnée.

Comportement carrousel : clic sur une vignette → navigue vers sa carte machine ; re-clic sur la vignette de la carte déjà affichée → la machine passe « à la une » (position 0) via `useSetFeaturedMachine`.

### Étape 5 — Branchement et cas limites

Le composant est branché sur `/garage` en remplacement du bloc carte actuel. Garage vide → un seul slot d'ajout, pas de carte machine. Garage < 5 machines → slots pointillés « + » vers l'ajout de trottinette. Photo absente → verso incitation. Utilisateur non connecté → le composant n'est pas rendu (la route est déjà protégée).

### Étape 6 — Vérification

Typecheck, puis contrôle visuel sur `/garage` en desktop et 375 px : flip recto/verso, défilement carrousel, changement de machine à la une, persistance du like et du mood après rechargement.

## Points techniques

- Polices Unbounded / Sora / Chakra Petch : la maquette les charge via Google Fonts. J'ajoute les `<link>` manquants dans `index.html` (les autres pages ne sont pas touchées).
- Les SVG trottinette de la maquette sont des placeholders génériques : j'utilise `custom_photo_url` puis `scooter_models.image_url`, et je retombe sur la silhouette SVG uniquement si les deux sont absents.
- `emoji` des mods : dérivés de la catégorie de la pièce via un mapping local, aucune colonne ajoutée.
- Aucun composant existant du garage n'est supprimé dans ce lot ; le remplacement se limite à l'insertion du nouveau bloc.
