# Extraction Apollo — 2026-10-11

**2 PRÊT / 3 modèles.** Modèle IA : claude-sonnet-5-5.

⚠️ **2 PRÊT sans clé roue** : publiés tels quels, ils n'auront NI pneu NI chambre à air (chargeurs seulement). Cible de la passe pneus.

Coût mesuré : 485812 tokens entrée, 17183 sortie, 27 recherches web.

## Apollo Air — MANQUE
- Manque : weight_kg, source_image_urls
- ⚠️ SANS CLÉ ROUE — aucun pneu ni chambre proposé — inconnu : rim_diameter, tire_section (texte relevé : « 10 pouces, tubeless auto-réparant (avant et arrière) », non exploitable seul)
- Une seule source, NON importé : weight_kg=18.6 (https://turbokids.ca/en/products/apollo-air-2024-trottinette-electrique-36-volts-15ah-500-watts-800-peak)

| Clé | Valeur | Type de source | Source | 2e source |
|---|---|---|---|---|
| voltage | 36 | constructeur | https://apolloscooters.co/products/apollo-air |  |
| amperage | 15 | constructeur | https://apolloscooters.co/products/apollo-air |  |
| power_watts | 500 | constructeur | https://apolloscooters.co/products/apollo-air |  |
| max_speed_private_kmh | 35 | constructeur | https://apolloscooters.ca/fr/products/apollo-air-fr |  |
| range_km | 54 | constructeur | https://apolloscooters.ca/fr/products/apollo-air-fr |  |
| max_load_kg | 120 | revendeur | https://turbokids.ca/en/products/apollo-air-2024-trottinette-electrique-36-volts-15ah-500-watts-800-peak |  |
| year | 2024 | constructeur | https://apolloscooters.ca/fr/products/apollo-air-fr |  |
| suspension | Fourche avant double (ressorts), pas de suspension arrière | constructeur | https://apolloscooters.ca/fr/products/apollo-air-fr |  |
| ip_rating | IP66 | constructeur | https://apolloscooters.ca/fr/products/apollo-air-fr |  |
| tire_size | 10 pouces, tubeless auto-réparant (avant et arrière) | constructeur | https://apolloscooters.ca/fr/products/apollo-air-fr |  |
| foldable | true | revendeur | https://www.bestbuy.ca/fr-ca/produit/trottinette-electrique-air-d-apollo-moteur-de-500-w-autonomie-de-54-km-vitesse-maximale-de-35-km-h-gris-cosmique/17701443 |  |
| wheel_inches | 10 | constructeur | https://apolloscooters.ca/fr/products/apollo-air-fr |  |
| brake_type | drum_front_ebs_rear | revendeur | https://www.electrickicks.com.au/products/apollo-air-2023-electric-scooter |  |
| tire_family | pneumatic | revendeur | https://www.electrickicks.com.au/products/apollo-air-2023-electric-scooter |  |

## Apollo Explore — PRÊT
- ⚠️ SANS CLÉ ROUE — aucun pneu ni chambre proposé — inconnu : rim_diameter, tire_section (texte relevé : « 10 pouces, pneumatique (avec chambre à air) – section non précisée », non exploitable seul)
- Publiable SANS disques (règle du 10/10) — inconnu : disc_pcd, disc_holes

| Clé | Valeur | Type de source | Source | 2e source |
|---|---|---|---|---|
| voltage | 52 | revendeur | https://www.electrickicks.com.au/products/apollo-explore-electric-scooter |  |
| amperage | 18.2 | revendeur | https://www.electrickicks.com.au/products/apollo-explore-electric-scooter |  |
| power_watts | 1000 | revendeur | https://www.electrickicks.com.au/products/apollo-explore-electric-scooter |  |
| max_speed_private_kmh | 50 | revendeur | https://www.electrickicks.com.au/products/apollo-explore-electric-scooter |  |
| range_km | 55 | revendeur | https://www.electrickicks.com.au/products/apollo-explore-electric-scooter |  |
| max_load_kg | 120 | revendeur | https://www.electrickicks.com.au/products/apollo-explore-electric-scooter |  |
| year | 2020 | site_test | https://versus.com/en/apollo-explore |  |
| weight_kg | 23 | revendeur | https://www.electrickicks.com.au/products/apollo-explore-electric-scooter | https://fluidfreeride.com/blogs/news/apollo-explore-review |
| suspension | Ressort à l'avant, double suspension hydraulique à l'arrière | site_test | https://electrek.co/2020/06/26/apollo-explore-32-mph-electric-scooter-review/ |  |
| ip_rating | IP54 | revendeur | https://www.electrickicks.com.au/products/apollo-explore-electric-scooter |  |
| tire_size | 10 pouces, pneumatique (avec chambre à air) – section non précisée | site_test | https://www.electricscooterinsider.com/electric-scooters/reviews/apollo-explore-review/ |  |
| foldable | true | site_test | https://www.electricscooterinsider.com/electric-scooters/reviews/apollo-explore-review/ |  |
| wheel_inches | 10 | revendeur | https://www.electrickicks.com.au/products/apollo-explore-electric-scooter |  |
| source_image_urls | 2 photo(s) | og:image fiche produit | http://www.electrickicks.com.au/cdn/shop/products/apollo-explore-electric-scooter-2021.jpg?v=1686744298 |  |
| brake_type | disc_mechanical | site_test | https://www.electricscooterinsider.com/electric-scooters/reviews/apollo-explore-review/ |  |
| disc_diameter | 140 | revendeur | https://beyondpev.com/products/apollo-brake-disc | https://revrides.com/products/disc-brake-rotor |
| tire_family | pneumatic | site_test | https://scooter.guide/apollo-explore-review/ |  |

## Apollo Ghost — PRÊT
- ⚠️ SANS CLÉ ROUE — aucun pneu ni chambre proposé — inconnu : tire_section
- Publiable SANS disques (règle du 10/10) — inconnu : disc_diameter, disc_pcd, disc_holes
- Une seule source, NON importé : tire_section=80/65 (https://www.amazon.com/Tubeless-Scooter-Thickened-Electric-Replacement/dp/B0DB1QRRX9)

| Clé | Valeur | Type de source | Source | 2e source |
|---|---|---|---|---|
| voltage | 52 | constructeur | https://apolloscooters.co/pages/tech-specs-ghost-2022 |  |
| amperage | 18.2 | constructeur | https://apolloscooters.co/pages/tech-specs-ghost-2022 |  |
| power_watts | 1600 | site_test | https://electrek.co/2021/01/25/apollo-ghost-review-testing-a-34-mph-electric-scooter-with-better-suspension-than-my-first-car/ |  |
| max_speed_private_kmh | 55 | constructeur | https://apolloscooters.co/pages/tech-specs-ghost-2022 |  |
| range_km | 62 | constructeur | https://apolloscooters.co/pages/tech-specs-ghost-2022 |  |
| max_load_kg | 135 | revendeur | https://www.electrickicks.com.au/products/apollo-ghost-electric-scooter |  |
| year | 2021 | site_test | https://electrek.co/2021/01/25/apollo-ghost-review-testing-a-34-mph-electric-scooter-with-better-suspension-than-my-first-car/ |  |
| weight_kg | 29 | constructeur | https://apolloscooters.co/pages/tech-specs-ghost-2022 | https://www.electrickicks.com.au/products/apollo-ghost-electric-scooter |
| suspension | Double suspension à ressorts réglables (avant et arrière) | constructeur | https://apolloscooters.co/pages/tech-specs-ghost-2022 |  |
| ip_rating | IP54 | site_test | https://eridehero.com/apollo-ghost-electric-scooter-review/ |  |
| foldable | true | revendeur | https://www.electrickicks.com.au/products/apollo-ghost-electric-scooter |  |
| wheel_inches | 10 | constructeur | https://apolloscooters.co/pages/tech-specs-ghost-2022 |  |
| source_image_urls | 3 photo(s) | og:image fiche produit | http://www.electrickicks.com.au/cdn/shop/products/apollo-ghost-electric-scooter.jpg?v=1686744417 |  |
| brake_type | disc_mechanical | site_test | https://electrek.co/2021/01/25/apollo-ghost-review-testing-a-34-mph-electric-scooter-with-better-suspension-than-my-first-car/ |  |
| rim_diameter | 6 | revendeur | https://us.amazon.com/clp/B0FH2KM3Y8 | https://www.ebay.de/itm/364839008316 |
| tire_family | pneumatic | site_test | https://electrek.co/2021/01/25/apollo-ghost-review-testing-a-34-mph-electric-scooter-with-better-suspension-than-my-first-car/ |  |
