

# Deux points à traiter

## 1. Logo Header — ajustement taille

Le logo est actuellement en `h-12 lg:h-14` (ligne 82 de Header.tsx). Ta demande : `h-8 sm:h-10 lg:h-12`.

**Modification** : `src/components/Header.tsx` ligne 82
```
className="h-8 sm:h-10 lg:h-12 w-auto object-contain"
```

Un seul fichier, une seule ligne.

## 2. Preview avec ancien cache — explication

C'est **normal** et c'est un problème de cache navigateur + Service Worker PWA. Quand tu ouvres la preview via le lien direct avec le token, le navigateur peut servir une version en cache (surtout avec le Service Worker Workbox qu'on a configuré en `autoUpdate`).

**Solutions immédiates** :
- **Ctrl+Shift+R** (hard refresh) sur la preview
- Ou ouvre les DevTools (F12) → onglet Application → Service Workers → coche "Update on reload" → recharge
- Ou vide le cache : DevTools → Application → Storage → "Clear site data"

Ça ne nécessite aucune modification de code. Les changements sont bien déployés, c'est juste le navigateur qui sert l'ancienne version cachée.

