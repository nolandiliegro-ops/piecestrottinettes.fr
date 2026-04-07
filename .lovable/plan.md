
Plan validé après lecture du code : le composant `ScanTrottButton` n’est plus branché dans l’UI publique, mais il reste encore 2 entrées visiteur “scanner” visibles en dur.

Fichiers où je vais intervenir avant build :

1. `src/components/hero/CommandPanel.tsx`
- Supprimer le bouton desktop “Scanner ma Trottinette”
- Retirer l’icône `Scan` si elle devient inutilisée
- Conserver intact le reste du panel : recherche, marques, bouton “Mon Garage”

2. `src/components/hero/ExpertJourneySection.tsx`
- Supprimer le bouton mobile “Scanner ma Trottinette”
- Nettoyer tout wording visible lié au scan dans cette section
- Remplacer le texte `Scannez ou recherchez votre modèle` par une version 100% recherche
- Remplacer aussi l’icône/étape si nécessaire pour qu’aucune référence au scan ne reste visible au visiteur

Constat important :
- `src/components/scan/ScanTrottButton.tsx` restera intact
- `supabase/functions/scan-trott/index.ts` restera intact
- Les éléments admin liés au scanner ne seront pas touchés
- Je n’ai pas identifié d’autre rendu public actif de “Scanner ma Trottinette” en dehors de ces 2 fichiers

Résultat attendu après implémentation :
- Plus aucun bouton ni libellé “Scanner ma trott/trottinette” visible côté visiteur
- Le moteur scan reste présent dans le code pour réactivation plus tard
