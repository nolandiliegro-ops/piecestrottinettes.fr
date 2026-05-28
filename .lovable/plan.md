# Fix V1 — Design Global Manager

Deux corrections ciblées, scope strict (UI/présentation uniquement).

## Fix 1 — Bouton Publier invisible → barre d'action STICKY TOP

**Diagnostic probable** : le footer `fixed bottom-[64px]` se bat avec la barre Lovable en preview ET le `pb-32` du conteneur ne garantit rien si un parent admin clippe. La solution sticky-top que tu proposes est la plus robuste.

**Action** :
- Supprimer le bloc `<div className="fixed ... bottom-[64px] ...">` (footer fixed)
- Le remplacer par une barre `sticky top-0 z-40` placée juste sous le header `DESIGN GLOBAL`, avant la grille editor/preview
- Contenu identique : `[Badge "N changements"] ........ [⌘S hint] [Annuler] [Publier (N)]`
- Quand `pendingCount === 0` : afficher "Aucune modification en attente" (état neutre, pas de pulse)
- Retirer `pb-32` du conteneur racine (plus nécessaire)
- Garder ⌘S / Esc + AlertDialog cancel (>3) inchangés

## Fix 2 — Lisibilité admin (dark mode)

Audit de `DesignGlobalManager.tsx` — remplacer toutes les couleurs hard-codées par des tokens sémantiques qui s'adaptent au thème admin :

| Élément actuel | Problème | Fix |
|---|---|---|
| `bg-white/95 backdrop-blur` (footer) | blanc dur sur dark | `bg-background/95` (s'adapte) — N/A après fix 1 |
| Sticky bar (nouvelle) | — | `bg-background/95 backdrop-blur border-b border-border` |
| Historique `font-mono text-foreground` token keys | OK | conserver |
| Historique valeurs hex `<span className="font-mono">` | hérite parent → peut être trop sombre | wrap explicite `text-foreground/90` + `text-[11px]` |
| Historique "Il y a Xh" `text-muted-foreground` | OK token | conserver |
| Swatch couleur `border-border` w-3 h-3 | bordure parfois invisible | passer à `w-3.5 h-3.5 rounded` + `ring-1 ring-border/60` pour mieux détacher |
| Bouton Publier `bg-[#4A7C59]` hard-codé | OK (vert brand) mais hover ok | conserver, c'est l'accent brand |
| `text-[10px] text-muted-foreground` (raccourcis) | trop faible | passer en `text-[11px] text-muted-foreground/80` |
| Accordion `bg-card` + `border-border` | OK | conserver |
| ColorPickerInput | À vérifier rapidement | audit visuel — si labels hard-codés, basculer en tokens |

Reformatage historique :
```
[Il y a 1h] · [global.background] · [■] #FAFAF8 → [■] #FF0000     [Restaurer]
```
Avec swatches plus visibles + tous textes en `text-foreground` ou `text-muted-foreground`.

## Fichiers modifiés (2)

1. `src/components/admin/DesignGlobalManager.tsx`
   - Supprimer footer fixed (~50 lignes)
   - Ajouter sticky top action bar (~35 lignes) juste après le `<div className="mb-6">` header
   - Refacto historique items pour swatches plus contrastés + tokens cohérents
   - Retirer `pb-32`
2. `src/components/admin/design-global/ColorPickerInput.tsx`
   - Quick audit : remplacer toute couleur hard-codée non-token par `text-foreground`/`text-muted-foreground`/`border-border`

## Hors-scope (interdictions respectées)
- ❌ Pas touche à `useDesignTokens`, `useDesignTokensPreview`, BDD, edge functions
- ❌ Pas touche aux composants home / système de preview postMessage
- ❌ Pas de nouveaux tokens
- ✅ Uniquement UI admin du DesignGlobalManager

## Plan de tests
1. Onglet Design Global → barre d'action visible en haut, reste sticky au scroll
2. Modifier une couleur → badge "1 changement" apparaît, bouton Publier actif
3. Clic Publier → toast succès, badge disparaît, BDD updated
4. ⌘S déclenche publish, Esc annule (avec dialog si >3)
5. Historique : tous les hex lisibles, swatches bien visibles, bouton Restaurer cliquable
6. Mobile 375px : barre sticky reste lisible, boutons accessibles
7. Pas de régression preview iframe (postMessage toujours fonctionnel)
8. Aucun texte avec contraste < WCAG AA sur fond admin sombre

## Rollback
Git revert du commit. Aucune migration BDD, aucun impact runtime hors admin.

## Estimation
- **Crédits** : ~2 messages (1 build + 1 vérif éventuelle)
- **Temps build** : ~1 min
- **Risque** : très faible (UI pure, scope ultra-limité)

Prêt à exécuter dès ton GO BUILD.