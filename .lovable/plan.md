# Intégration Carte Rider v7 — Garage + carte publique partageable

## Vérifications faites avant ce plan

Maquette lue (561 lignes) : CSS 3D isolé (`perspective:1900px`, `preserve-3d`, `backface-visibility`, `rotateY(180deg)`, `@keyframes sheen`, variables `--f1/--m1/--tint`), rendu piloté par `state = {view, back, liked, likes, featured, mood, railFrom}` et deux fonctions de rendu (`riderCard` / `machineCard`) partageant `railHTML` + `socialHTML`.

État réel du projet, contrôlé :

| Élément demandé | Réalité |
| --- | --- |
| `profiles` pseudo / XP / ville / public | OK : `display_name`, `performance_points`, `rider_location`, `avatar_url`, `is_public` |
| `user_garage` surnom / photo | OK sous d'autres noms : `nickname`, `custom_photo_url` |
| `user_garage.is_featured` (machine à la une) | **N'existe pas** |
| `user_card_likes` | **La table n'existe pas** |
| RPC `set_featured_scooter` | **N'existe pas** |
| `scooter_models.rarity` / `holo_effect` | **N'existent pas** — dérivés (voir Étape 1) |
| `garage_modifications.order_item_id` (pour le Holo) | OK, déjà présent et exploitable |
| `html-to-image` | **Non installé** (aucune lib de capture DOM dans `package.json`) |
| Identifiant public `username` | **N'existe pas.** `display_name` n'est pas unique (6 profils, 5 noms distincts) — il ne peut pas servir de clé d'URL en l'état |

Le grade et le niveau (« Mécano », LVL 4) sont déjà centralisés dans `src/lib/xpLevels.ts` : je réutilise, je ne recalcule pas.

## Étape 1 — Migration base de données

Une migration unique, additive :

- `profiles.username` — texte, index unique sur `lower(username)`, rempli automatiquement depuis `display_name` slugifié (suffixe numérique en cas de collision). C'est la clé de l'URL `/rider/:username`.
- `user_garage.is_featured` — booléen, défaut faux. Machine « à la une » (position 0).
- `user_garage.mood` — texte, défaut `fini`.
- `user_card_likes` — nouvelle table : `liker_id` (utilisateur qui like), `owner_id` (rider liké), contrainte d'unicité sur le couple, ce qui garantit **1 like par utilisateur et par carte**. RLS : lecture publique du décompte, insertion/suppression réservées au liker sur sa propre ligne, et un rider ne peut pas liker sa propre carte. GRANTs `authenticated` + `anon` (lecture) + `service_role`, conformément aux règles du projet.
- Fonction `set_featured_scooter(p_garage_id uuid)` — `security definer`, vérifie que la ligne appartient bien à `auth.uid()`, remet `is_featured` à faux sur tout le garage du propriétaire puis à vrai sur la ligne visée. Une seule machine à la une garantie côté serveur.
- Policies de lecture publique : la carte d'un rider n'est visible par un visiteur que si `profiles.is_public` est vrai (le champ existe déjà, 3 profils publics sur 6). Les garages et modifications gagnent une policy de lecture publique **conditionnée à ce drapeau**, sans jamais exposer d'e-mail ni de commande.

La **rareté n'est pas stockée** : dérivée des watts selon ton barème exact (<500 commune, <1000 peu commune, <2000 rare, <3000 épique, ≥3000 légendaire). Le **Holo n'est pas stocké non plus** : calculé à la volée — une machine est holo si elle a au moins une pièce montée et que 100 % de ses `garage_modifications` ont un `order_item_id` non nul.

## Étape 2 — Dépendance

Installation de `html-to-image` (≈ 15 ko, sans dépendance transitive) pour l'export PNG.

## Étape 3 — CSS isolé

`src/components/garage/RiderCard.css` : copie ISO du CSS carte de la maquette (lignes 34→241), **aucune** conversion Tailwind, aucune modification des règles 3D (`perspective`, `preserve-3d`, `backface-visibility`, `rotateY(180deg)`, `@keyframes sheen`) ni des dimensions et ratios (`width:300px`, `aspect-ratio:5/7`). Toutes les classes reçoivent le préfixe `rcv7-` pour l'isolation totale vis-à-vis du CSS global. Les styles de page de démo (`body`, `.wrap`, `h1`, `.lead`, `.hint`) sont écartés : ils appartiennent à la démo, pas au composant.

## Étape 4 — `src/lib/riderStats.ts`

Fonctions pures, sans appel réseau :
- `getRarity(watts)` — barème ci-dessus + palette (les 5 objets `RAR` de la maquette : `c1`, `c3`, `tint`, libellé)
- `isHolo(mods)` — 100 % des pièces issues du site
- `computeGarageStats(machines, modsByMachine)` — puissance cumulée, total pièces montées dont part site, nombre de cartes holo
- `modIconForCategory(name)` — emoji du mod dérivé de la catégorie de la pièce

## Étape 5 — Données

`src/hooks/useRiderCardData.ts` : un hook TanStack Query qui prend soit l'utilisateur connecté, soit un `username` public, et agrège en une passe `profiles`, `user_garage` + `scooter_models` joint (marque via `scooter_models_brand_id_fkey`), et `garage_modifications` de tout le garage — pas un appel par machine.

Mutations : `useSetFeaturedMachine` (RPC), `useSetMachineMood`, `useToggleCardLike`, `useUploadMachinePhoto` (bucket `scooter-photos` existant, +50 XP via l'Edge Function `add-experience-points` déjà en place, une seule fois par machine).

## Étape 6 — `src/components/garage/RiderCard.tsx`

Découpé dans le même dossier :
- `RiderCard.tsx` — état (`view`, `back`, `railFrom`), **cadre extérieur verrouillé**, flip
- `RiderCardFace.tsx` — position 0 : machine à la une au premier plan, silhouettes des autres derrière
- `MachineCardFace.tsx` — positions 1→N : modèle, marque, puissance, mods, rareté
- `MachineRail.tsx` — carrousel, slots pointillés « + » si moins de 5 machines, plafonné à 12 vignettes
- `CardBackFace.tsx` — verso photo réelle, sinon slot d'incitation « Montre-la en vrai / +50 XP » avec téléversement
- `RiderCardSocial.tsx` — vues, like, partage

Verrou du cadre : le cadre acier `#5FB4D4` et le bandeau rider (grade, XP, ville, N°) sont rendus par `RiderCard.tsx` **au-dessus** des faces, hors du flux des faces — structurellement impossibles à altérer par la machine consultée. Seules les variables `--m1/--m3/--tint` de la vitrine intérieure changent selon la rareté.

Carrousel : clic sur une vignette → navigue vers sa carte machine ; re-clic sur la vignette de la carte déjà affichée → la machine passe « à la une » via `set_featured_scooter`.

Partage : bouton « Partager ma carte » → capture PNG haute définition de la carte position 0 avec `html-to-image` (pixelRatio 3, sans le carrousel ni les boutons), puis `navigator.share` avec le fichier si supporté, sinon téléchargement direct. Le lien partagé pointe sur `/rider/:username`.

Le composant reçoit une prop `mode: "owner" | "public"` : en public, aucune action d'écriture n'est rendue sauf le like.

## Étape 7 — Route publique

`src/routes/RiderPublicCard.tsx` + route `/rider/:username` dans `src/App.tsx` (route non protégée, chargée en `React.lazy` comme le reste). Profil introuvable ou non public → écran neutre « Cette carte n'est pas publique ». Métadonnées SEO via le composant `SEO` existant, `noindex` retiré uniquement pour les profils publics.

## Étape 8 — Branchement et vérification

Insertion dans `/garage` en mode `owner`. Typecheck, puis contrôle visuel desktop et 375 px : flip, défilement du carrousel, changement de machine à la une, like depuis un autre compte, export PNG, verso avec et sans photo, garage vide.

## Points techniques

- Polices Unbounded / Sora / Chakra Petch : ajout des `<link>` Google Fonts manquants dans `index.html`.
- Visuel machine : `custom_photo_url` → `scooter_models.image_url` → silhouette SVG générique de la maquette en dernier recours (aucune tuile ne casse sans photo).
- Le compteur de vues de la maquette est décoratif dans ce lot (aucune table de vues) : il est retiré plutôt que faussé.
- Aucun composant existant du garage n'est supprimé ; seule l'insertion du nouveau bloc est faite.
