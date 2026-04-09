# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Contexte projet
Site e-commerce spécialisé pièces détachées trottinettes électriques.
- Propriétaire : Nolan, gérant Steedy Trott Marseille, créateur TikTok mobilité électrique
- Objectif : convertir les visiteurs en acheteurs le plus rapidement possible
- Stack : React 18 + TypeScript + Vite + Tailwind CSS + Supabase + Stripe

## Commandes de développement

```bash
npm run dev        # Serveur de développement (Vite)
npm run build      # Build de production
npm run build:dev  # Build en mode développement
npm run lint       # ESLint
npm run preview    # Preview du build
```

Déploiement des Edge Functions Supabase :
```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy verify-payment
supabase functions deploy send-order-email
```

## Architecture du code

### Routing (src/App.tsx)
Toutes les routes sont dans `App.tsx`. Les routes protégées (`/garage`, `/profile`, `/admin`) utilisent `<ProtectedRoute>`. Le layout global (CartSidebar, MobileNav, SpotlightCommand) est rendu en dehors des routes.

Pages principales :
- `/` → Index (hero + sections home)
- `/catalogue` → liste pièces avec filtres
- `/piece/:slug` → fiche produit (PDP)
- `/trottinettes` → catalogue scooters
- `/scooter/:slug` → fiche scooter avec pièces compatibles
- `/panier` → CartPage
- `/checkout` → CheckoutPage
- `/payment-success?session_id=` → PaymentSuccessPage
- `/garage` → espace personnel utilisateur (protégé)
- `/admin` → back-office (protégé)

### Contextes globaux (src/contexts/ + src/hooks/)
- `AuthContext` — session Supabase, profil utilisateur, rôles
- `CartProvider` (useCart hook) — panier localStorage (`pt-cart`), calcul TVA 20%, gestion stock
- `ScooterContext` — scooter sélectionné pour filtrer les pièces compatibles
- `SpotlightContext` — ouverture/fermeture de la recherche globale (Cmd+K)

### Récupération de données
TanStack Query v5 pour tous les appels Supabase. Pas de fetch manuel dans les composants — utiliser `useQuery`/`useMutation` avec le client Supabase (`src/integrations/supabase/client.ts`).

### Structure des composants
```
src/components/
  admin/       # Back-office complet (inventory, orders, categories, scooters...)
  cart/        # CartSidebar, CartItem, EmptyCart
  checkout/    # OrderConfirmationModal, GuestAccountPrompt
  garage/      # Espace perso : scooters, modifications, XP, timeline
  pdp/         # Fiche produit : PurchaseBlock, MediaGallery, CompatibilityMatrix
  hero/        # Composants de la homepage hero
  scan/        # Feature scan IA trottinette
  navigation/  # MobileNav (bottom nav mobile)
```

### Edge Functions Supabase (Deno, supabase/functions/)
- `create-checkout-session` — valide stock, crée order + order_items en BDD, crée session Stripe
- `stripe-webhook` — écoute `checkout.session.completed`, passe order à `paid`, appelle send-order-email
- `verify-payment` — vérifie la session Stripe, attribue +100 XP, retourne détails de commande
- `send-order-email` — envoie email confirmation via Resend
- `scan-trott` — analyse photo via IA pour identifier modèle de trottinette
- `add-experience-points` — système XP/gamification

### Schema BDD clé
- `parts` — prix HT, stock_quantity, slug, category_id, scooter compatibility
- `orders` — stripe_session_id, status (awaiting_payment → paid → shipped), user_id nullable (guest ok)
- `order_items` — snapshot prix au moment de l'achat
- `user_garage` + `garage_modifications` — scooters et historique maintenances
- `scan_validations` — résultats détection IA
- `profiles` + `user_roles` — auth avec rôle admin/user

## Variables d'environnement

Frontend (`.env`) :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Supabase Secrets (Edge Functions) :
- `STRIPE_SECRET_KEY` (sk_live_...)
- `STRIPE_WEBHOOK_SECRET` (whsec_...)
- `RESEND_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Design System

### Couleurs
- Fond principal : `#F5F0E8` (beige crème)
- Accent principal : `#4A7C59` (vert sauge) → classes Tailwind `bg-green-700`
- Accent hover : `#3A6449` → `hover:bg-green-800`
- Orange CTA forts : `#FF6600` → `bg-orange-600`
- Texte secondaire : `#6B7280` → `text-gray-500`

### Règles UI
- Boutons primaires : `bg-green-700 hover:bg-green-800 rounded-lg px-6 py-3 font-semibold`
- Boutons CTA : `bg-orange-600 hover:bg-orange-700 text-white`
- Cards : `rounded-2xl shadow-md hover:shadow-xl transition-all duration-200`
- Inputs : `border border-gray-300 focus:ring-2 focus:ring-green-600 rounded-lg`
- Navbar : `sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100`
- Titres hero : majuscules, `font-black` (900), `tracking-tight`
- Texte minimum : 14px (jamais en dessous)

## Mobile-First — règle absolue
- Coder pour mobile en premier, desktop en second
- Touch targets minimum 44px
- Pas d'interactions hover-only sur mobile
- Breakpoints standard Tailwind : sm(640) md(768) lg(1024) xl(1280)

## Ce qu'il ne faut jamais faire
- Modifier les noms des tables Supabase ou les Edge Functions sans demander
- Hardcoder des clés API
- Casser le flux de paiement (CheckoutPage → create-checkout-session → stripe-webhook → verify-payment)
- Utiliser des couleurs hors du design system
- Ajouter des animations lourdes
