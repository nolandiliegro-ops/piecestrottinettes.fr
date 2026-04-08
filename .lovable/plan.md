

# Batch 6 — Pages légales obligatoires

## Fichiers modifiés : 6 au total

### Ordre d'exécution

**1. `src/pages/CGV.tsx`** — Créer la page Conditions Générales de Vente
- Structure : Header + contenu statique avec sections (objet, prix, commande, livraison, rétractation 14 jours, garanties, responsabilité, données personnelles, droit applicable)
- Composant SEO avec titre "Conditions Générales de Vente | Pièces Trottinettes"
- Mise en page sobre : `prose` Tailwind, max-w-3xl centré, titres h2 pour chaque section

**2. `src/pages/MentionsLegales.tsx`** — Créer la page Mentions Légales
- Sections obligatoires : éditeur du site, hébergeur, propriété intellectuelle, RGPD/données personnelles, cookies
- Composant SEO avec titre "Mentions Légales | Pièces Trottinettes"
- Même mise en page que CGV

**3. `src/pages/Contact.tsx`** — Créer la page Contact
- Email de contact (contact@piecestrottinettes.fr) affiché clairement
- Formulaire simple : nom, email, sujet, message — sans backend pour l'instant (juste un toast de confirmation)
- Composant SEO avec titre "Contact | Pièces Trottinettes"

**4. `src/App.tsx`** — Ajouter les 3 routes
- `/cgv` → CGV
- `/mentions-legales` → MentionsLegales
- `/contact` → Contact
- Lazy-loaded comme les autres pages

**5. `src/components/Footer.tsx`** — Ajouter les liens légaux
- Nouvelle colonne "LÉGAL" dans le grid (passer à 5 colonnes desktop ou ajouter dans la colonne CONTACT)
- Liens : CGV, Mentions Légales, Contact
- Ajouter aussi les liens CGV et Mentions Légales dans la barre du bas (à côté du copyright)

**6. `src/pages/CheckoutPage.tsx`** — Ajouter la mention légale obligatoire
- Sous le bouton de commande : "En passant commande, vous acceptez nos [CGV](/cgv)" avec lien cliquable

## Résumé

| # | Fichier | Action |
|---|---------|--------|
| 1 | `src/pages/CGV.tsx` | Créer — Conditions Générales de Vente |
| 2 | `src/pages/MentionsLegales.tsx` | Créer — Mentions Légales |
| 3 | `src/pages/Contact.tsx` | Créer — Page contact avec formulaire |
| 4 | `src/App.tsx` | Ajouter 3 routes lazy-loaded |
| 5 | `src/components/Footer.tsx` | Ajouter liens légaux |
| 6 | `src/pages/CheckoutPage.tsx` | Mention "J'accepte les CGV" |

