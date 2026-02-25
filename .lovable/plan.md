.**📝 Contenu à copier-coller dans le mode EDIT :**

# **Fix barre d'actions flottante — GamingCarouselCard.tsx**

## **Problème**

La barre flottante (favoris, œil, panier) est trop basse (`bottom-8`), ce qui la fait chevaucher le texte ou être coupée lors du zoom.

## **Correction — src/components/showcase/GamingCarouselCard.tsx**

**Ligne 237 — Repositionnement & Style :**

- **Position** : Changer `bottom-8` → `bottom-12` pour remonter la barre franchement au milieu de la zone basse de l'image.
- **Centrage** : S'assurer que les classes `left-1/2 -translate-x-1/2` sont présentes pour un alignement horizontal parfait.
- **Visibilité** : Ajouter la classe `shadow-xl` au conteneur de la barre pour qu'elle ressorte bien sur les produits blancs.
- **Nettoyage** : Conserver `nopin="nopin"` sur l'image (déjà présent lignes 213-214) et le `z-20` pour éviter les interférences avec Pinterest ou d'autres overlays.  

  |                        |               |             |
  | ---------------------- | ------------- | ----------- |
  | **Élément**            | **Avant**     | **Après**   |
  | **Position verticale** | `bottom-8`    | `bottom-12` |
  | **Ombre portée**       | Standard      | `shadow-xl` |
  | **Sécurité Pinterest** | `nopin` actif | Conservé    |


## **Résumé des changements**


|                        |               |             |
| ---------------------- | ------------- | ----------- |
| Élément                | Avant         | Après       |
| **Position verticale** | `bottom-8`    | `bottom-12` |
| **Ombre portée**       | Standard      | `shadow-xl` |
| **Sécurité Pinterest** | `nopin` actif | Conservé    |


  



| Changement               | Avant            | Après       |
| ------------------------ | ---------------- | ----------- |
| Position barre d'actions | `bottom-8`       | `bottom-10` |
| z-index                  | `z-20` (déjà ok) | —           |
| nopin                    | déjà en place    | —           |
