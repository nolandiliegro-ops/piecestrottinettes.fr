# Skill : Trottinette Sync — piecestrottinettes.fr

## Contexte
Import automatique de trottinettes dans piecestrottinettes.fr
Propriétaire : Nolan, Steedy Trott Marseille

## Process en 4 étapes
1. Nolan demande une marque ici sur claude.ai projet
2. Claude fait la recherche web et génère le fichier JSON
3. Dans Claude Code terminal : node scripts/sync-scooters.js --file scripts/data/[marque].json
4. Admin → onglet Bot Import → vérifier → publier

## Infrastructure
- Script : scripts/sync-scooters.js
- Edge Function : bulk-insert-scooters (Supabase)
- Secret : ADMIN_BULK_SECRET dans .env
- URL : https://kqsxscjtlipregkrmucg.supabase.co/functions/v1/bulk-insert-scooters

## Format JSON
{
  "brandName": "Marque",
  "brandSlug": "marque",
  "scooters": [{
    "name": "Nom modèle",
    "slug": "nom-modele",
    "power_watts": 650,
    "voltage": 36,
    "max_speed_kmh": 25,
    "range_km": 40,
    "tire_size": "10 pouces pneumatique",
    "year": 2025,
    "description": "150 mots FR orienté pièces détachées",
    "meta_title": "[Modèle] - Pièces détachées | PiècesTrottinettes.fr",
    "meta_description": "155 caractères max",
    "search_terms": "10 mots-clés séparés virgules",
    "technical_signature": {
      "tire_diameter": "10 pouces",
      "official_page": "URL revendeur officiel",
      "sources": ["URL Google Images pré-remplie"]
    }
  }]
}

## Règles qualité
- Specs vérifiées sur : dualtron-store.com, fastride.fr, segway.com, mi.com/fr
- Un slug par modèle de base (pas une entrée par voltage)
- Descriptions générées par Claude, jamais copiées
- Image = lien Google Images pré-rempli pour trouver en 30 secondes

## Marques faites
- Dualtron (15 modèles — 10/04/2026)
- Xiaomi (9 modèles)
- Ninebot (4 modèles)
- Kaabo (3 modèles)

## Marques à faire
- Vsett, Inokim, Zero, Hiboy, Urbanglide
