## Modification ciblée : durcir le prompt système de `generate-part-seo`

**Fichier unique modifié :** `supabase/functions/generate-part-seo/index.ts`
**Portée :** constante `SYSTEM_PROMPT` uniquement. Aucune autre logique, aucun autre fichier.

### Changement

Insertion verbatim, dans la section STRUCTURE de la description du prompt système, juste après la phrase d'intro `STRUCTURE de la description (français, 150-220 mots, en HTML léger : <h2> et <p> uniquement) :`, du bloc suivant :

> RÈGLE STRUCTURE HTML (champ description) : N'utilise JAMAIS la balise `<h1>`. Le titre racine de la description DOIT être un `<h2>`. Hiérarchie autorisée et unique : `<h2>` pour les titres de section (présentation, compatibilité, caractéristiques, installation), `<h3>` pour les questions de la FAQ, `<p>` pour le texte, `<ul>`/`<li>` pour les listes. Toute balise `<h1>` est strictement interdite : la page produit possède déjà son propre `<h1>` (le nom de la pièce), un second `<h1>` casserait le SEO.

### Ce qui ne change pas
- Contrat d'entrée (POST JSON : name, specs, compatibility, ean, category_hint, brand)
- Contrat de sortie (JSON strict : status, description, meta_title, meta_description)
- Auth `x-admin-secret`, modèle `google/gemini-2.5-flash`, `temperature: 0.3`, `response_format: json_object`
- Parse défensif, gestion 429/402, CORS, helpers (`jsonResponse`, `errorPayload`, `extractJsonObject`, `isNonEmptyString`)

### Rappel post-écriture
Après écriture du fichier, je te rappellerai **explicitement** de me dire « **redéploie generate-part-seo** » — sans cet ordre nommé, l'ancienne version reste active (Publish front ne redéploie pas l'Edge Function).

### Rollback
Réinsertion de la version précédente du `SYSTEM_PROMPT` (1 edit). Aucun effet de bord, additif pur dans le prompt.
