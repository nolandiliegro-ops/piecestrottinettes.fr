# Extraction Apollo — 2026-10-11

**1 PRÊT / 2 modèles.** Modèle IA : claude-sonnet-5-5.

⚠️ **1 PRÊT sans clé roue** : publiés tels quels, ils n'auront NI pneu NI chambre à air (chargeurs seulement). Cible de la passe pneus.

Coût mesuré : 241952 tokens entrée, 10304 sortie, 13 recherches web.

## Apollo City Pro — MANQUE
- Manque : weight_kg
- Valeur à virgule pour une colonne entière, NON importée : max_speed_private_kmh=51.5
- À valider par Nolan (site de test) : weight_kg=29.5 (https://eridehero.com/apollo-city-pro-electric-scooter-review/)
- Proposé, NON importé (à trancher par Nolan) : solid_conversion=yes (https://rideelectric.com.au/products/apollo-city-pro-tyres)

| Clé | Valeur | Type de source | Source | 2e source |
|---|---|---|---|---|
| voltage | 48 | site_test | https://eridehero.com/apollo-city-pro-electric-scooter-review/ |  |
| amperage | 20 | constructeur | https://apolloscooters.co/blogs/news/how-to-identify-different-apollo-scooter-models-a-comprehensive-guide |  |
| power_watts | 1000 | site_test | https://eridehero.com/apollo-city-pro-electric-scooter-review/ |  |
| range_km | 70 | revendeur | https://www.electrickicks.com.au/products/apollo-city-23-pro-v3-electric-scooter |  |
| max_load_kg | 120 | site_test | https://eridehero.com/apollo-city-pro-electric-scooter-review/ |  |
| year | 2023 | constructeur | https://apolloscooters.co/blogs/news/how-to-identify-different-apollo-scooter-models-a-comprehensive-guide |  |
| suspension | Triple ressort (1 ressort avant, 2 ressorts arrière) | site_test | https://eridehero.com/apollo-city-pro-electric-scooter-review/ |  |
| ip_rating | IP66 | site_test | https://eridehero.com/apollo-city-pro-electric-scooter-review/ |  |
| tire_size | 10 x 2.7 pouces (tubeless auto-réparant) | site_test | https://freshlycharged.com/reviews/227/apollo-city-2023-review |  |
| foldable | true | site_test | https://eridehero.com/apollo-city-pro-electric-scooter-review/ |  |
| wheel_inches | 10 | constructeur | https://apolloscooters.co/blogs/news/how-to-identify-different-apollo-scooter-models-a-comprehensive-guide |  |
| source_image_urls | 2 photo(s) | og:image fiche produit | http://www.electrickicks.com.au/cdn/shop/files/ApolloCityPro2023_1.png?v=1698064814 |  |
| brake_type | drum | constructeur | https://apolloscooters.ca/products/apollo-city-city-pro-2023-drum-brake-assembly |  |
| rim_diameter | 6.5 | revendeur | https://kissmywheels.ch/en/spare-parts/spare-parts-for-e-scooter/outer-tire-apollo-city/ | https://rideelectric.com.au/products/apollo-city-pro-tyres |
| tire_section | 10x2.70 | revendeur | https://kissmywheels.ch/en/spare-parts/spare-parts-for-e-scooter/outer-tire-apollo-city/ | https://alienrides.com/products/apollo-tubeless-tire-with-anti-puncture-glue-for-city-city-pro-2022-2023 |
| tire_family | pneumatic | revendeur | https://kissmywheels.ch/en/spare-parts/spare-parts-for-e-scooter/outer-tire-apollo-city/ |  |

## Apollo Phantom 2.0 — PRÊT
- ⚠️ SANS CLÉ ROUE — aucun pneu ni chambre proposé — inconnu : rim_diameter, tire_section (texte relevé : « 11 x 4 pouces (11x4"), tubeless hybride auto-réparant PunctureGuard », non exploitable seul)
- Publiable SANS disques (règle du 10/10) — inconnu : disc_diameter, disc_pcd, disc_holes

| Clé | Valeur | Type de source | Source | 2e source |
|---|---|---|---|---|
| voltage | 52 | constructeur | https://apolloscooters.ca/products/apollo-phantom-2-0 |  |
| amperage | 27 | constructeur | https://apolloscooters.ca/products/apollo-phantom-2-0 |  |
| power_watts | 3500 | constructeur | https://apolloscooters.co/blogs/news/apollo-scooters-launches-the-apollo-phantom-2-0-legends-are-made-they-aren-t-born |  |
| max_speed_private_kmh | 70 | constructeur | https://apolloscooters.ca/products/apollo-phantom-2-0 |  |
| range_km | 80 | constructeur | https://apolloscooters.ca/products/apollo-phantom-2-0 |  |
| max_load_kg | 150 | revendeur | https://www.ecraft-shop.de/en/produkt/apollo-phantom-2.0/sw10719 |  |
| weight_kg | 46.3 | revendeur | https://turbokids.ca/products/apollo-phantom-2-0-trottinette-electrique-52-volts-27ah-2x1750-watts | https://scooterrank.com/scooters/apollo-phantom-2-0 |
| suspension | Double ressorts (avant et arrière) | constructeur | https://apolloscooters.ca/products/apollo-phantom-2-0 |  |
| ip_rating | IP66 | constructeur | https://apolloscooters.ca/products/apollo-phantom-2-0 |  |
| tire_size | 11 x 4 pouces (11x4"), tubeless hybride auto-réparant PunctureGuard | constructeur | https://apolloscooters.ca/products/apollo-phantom-2-0 |  |
| foldable | true | revendeur | https://www.ecraft-shop.de/en/produkt/apollo-phantom-2.0/sw10719 |  |
| wheel_inches | 11 | constructeur | https://apolloscooters.ca/products/apollo-phantom-2-0 |  |
| source_image_urls | 2 photo(s) | og:image fiche produit | http://apolloscooters.co/cdn/shop/files/A11_Black_springs_update_20250604_2.png?v=1773931411&width=2048 |  |
| brake_type | disc_unknown_actuation | constructeur | https://apolloscooters.co/products/apollo-phantom-2-0 |  |
| tire_family | pneumatic | constructeur | https://support.apolloscooters.co/en-US/apollo-scooter-tires-tubeless-self-healing-and-what-that-means-for-you-6597534 |  |
