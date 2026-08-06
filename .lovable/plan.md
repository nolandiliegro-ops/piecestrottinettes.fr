# Carte Rider en modal lightbox

## Objectif
La Carte Rider n'est plus posée au milieu du décor du garage. Elle s'ouvre en plein écran (lightbox sombre), agrandie et confortablement cliquable, depuis un bouton premium dans le garage.

## 1. Nouveau composant `RiderCardLightbox`
- Fichier `src/components/garage/RiderCardLightbox.tsx`.
- Dialog shadcn plein écran : overlay `bg-black/80 backdrop-blur-md`, contenu sans cadre blanc ni bordure, carte centrée verticalement et horizontalement.
- La carte fait 300px de large en CSS natif : on l'agrandit avec un wrapper `transform: scale(...)` (environ 1.35 sur mobile selon la hauteur dispo, 1.6 sur desktop) avec `transform-origin: center`. Les clics restent fonctionnels (carrousel 34px, bouton flip, mods lisibles).
- Bouton de fermeture discret : croix en haut à droite, style verre dépoli sombre, 44px de zone tactile. Clic sur le fond et touche Échap ferment aussi (comportement Dialog par défaut).
- Le contenu reste monté en lazy/Suspense pour ne rien charger avant ouverture.

## 2. Bouton déclencheur dans le garage
- Dans `src/pages/Garage.tsx`, on retire le bloc `<RiderCard mode="owner" />` centré au-dessus de la grille.
- À sa place, dans le panneau latéral droit (là où se trouve aujourd'hui « Partager mon build »), un bouton premium : glassmorphism, bordure brillante, icône carte (Lucide), libellé « Ma Carte Collector », sous-texte court (nombre de likes / « Partage ta carte »).
- Le clic ouvre le lightbox (état local `riderCardOpen`).

## 3. Nettoyage des doublons
- Suppression de l'affichage de `ShareBuildCard` (« Générer ma fiche » / « Partager mon build ») dans le garage : le partage et l'export PNG existent déjà dans la carte elle-même (`RiderCardSocial` + `html-to-image`).
- Le fichier `ShareBuildCard.tsx` est supprimé s'il n'est utilisé nulle part ailleurs.

## Détails techniques
- `RiderCard.tsx` n'est pas modifié : l'export PNG capture toujours `captureRef`, et le `transform: scale` du wrapper parent n'affecte pas le rendu `html-to-image` (il lit le noeud et ses styles propres). Vérification visuelle après implémentation.
- Aucune modification de base de données, de hook ou d'edge function.
- Route publique `/rider/:username` inchangée (la carte y reste rendue en pleine page).
