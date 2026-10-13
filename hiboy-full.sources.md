# Extraction Hiboy — 2026-10-13

**1 PRÊT / 2 modèles.** Modèle IA : claude-sonnet-5-5.

⚠️ **1 PRÊT sans clé roue** : publiés tels quels, ils n'auront NI pneu NI chambre à air (chargeurs seulement). Cible de la passe pneus.

Coût mesuré : 412040 tokens entrée, 13814 sortie, 20 recherches web.

## Hiboy MAX Pro — MANQUE
- Manque : weight_kg
- Valeur à virgule pour une colonne entière, NON importée : max_speed_private_kmh=35.4
- ⚠️ SANS CLÉ ROUE — aucun pneu ni chambre proposé — inconnu : rim_diameter, tire_section (texte relevé : « 11 x 2.75 pouces (tubeless, gel anti-crevaison) », non exploitable seul)
- Une seule source, NON importé : weight_kg=25.3 (https://www.hiboy.eu/products/hiboy-max-pro-electric-scooter)
- Proposé, NON importé (à trancher par Nolan) : solid_conversion=yes (https://www.alphaproscooters.com/products/hiboy-max-pro-solid-tire)

| Clé | Valeur | Type de source | Source | 2e source |
|---|---|---|---|---|
| voltage | 48 | constructeur | https://www.hiboy.eu/products/hiboy-max-pro-electric-scooter |  |
| amperage | 14.5 | constructeur | https://www.hiboy.eu/products/hiboy-max-pro-electric-scooter |  |
| power_watts | 500 | constructeur | https://www.hiboy.eu/products/hiboy-max-pro-electric-scooter |  |
| range_km | 55 | constructeur | https://www.hiboy.eu/products/hiboy-max-pro-electric-scooter |  |
| max_load_kg | 120 | constructeur | https://www.hiboy.eu/products/hiboy-max-pro-electric-scooter |  |
| suspension | Double suspension avant et arrière | constructeur | https://www.hiboy.eu/products/hiboy-max-pro-electric-scooter-for-heavy-adult |  |
| ip_rating | IPX4 | constructeur | https://www.hiboy.eu/products/hiboy-max-pro-electric-scooter |  |
| tire_size | 11 x 2.75 pouces (tubeless, gel anti-crevaison) | constructeur | https://www.hiboy.eu/products/hiboy-max-pro-electric-scooter-for-heavy-adult |  |
| foldable | true | constructeur | https://www.hiboy.eu/products/hiboy-max-pro-electric-scooter |  |
| wheel_inches | 11 | constructeur | https://www.hiboy.eu/products/hiboy-max-pro-electric-scooter |  |
| source_image_urls | 3 photo(s) | og:image fiche produit | http://www.hiboy.eu/cdn/shop/files/exec-5def050e-0b75-45e8-9935-e7e2f51e9407.png?v=1787736528 |  |
| brake_type | drum_front_ebs_rear | constructeur | https://www.hiboy.ca/products/hiboy-max-pro-electric-scooter |  |
| tire_family | pneumatic | constructeur | https://www.hiboy.com/products/hiboy-max-pro-electric-scooter |  |

## Hiboy Titan Pro — PRÊT
- ⚠️ SANS CLÉ ROUE — aucun pneu ni chambre proposé — inconnu : tire_section (texte relevé : « 10" pneus tubeless remplis de gel (gel-filled tubeless) », non exploitable seul)
- Publiable SANS disques (règle du 10/10) — inconnu : disc_diameter, disc_pcd, disc_holes
- Une seule source, NON importé : disc_diameter=140 (https://www.fnac.com/mp46813024/Trottinette-electrique-HiBoy-Titan-Pro-Noir-1200W-2-48V-17-5Ah-60-65km-Range-MAX/w-4) · tire_section=70/65 (https://www.amazon.com/GLDYTIMES-10x2-75-6-5-10x2-70-6-5-Alpha-Hiboy-Max3-Evercross/dp/B0CL9TYZ1L)

| Clé | Valeur | Type de source | Source | 2e source |
|---|---|---|---|---|
| voltage | 48 | constructeur | https://www.hiboy.com/products/hiboy-titan-pro-electric-scooter-2026 |  |
| amperage | 36 | constructeur | https://www.hiboy.com/products/hiboy-titan-pro-electric-scooter-2026 |  |
| power_watts | 2400 | constructeur | https://www.hiboy.ca/products/hiboy-titan-pro-electric-scooter |  |
| max_speed_private_kmh | 50 | constructeur | https://www.hiboy.ca/products/hiboy-titan-pro-electric-scooter |  |
| range_km | 129 | constructeur | https://www.hiboy.ca/products/hiboy-titan-pro-electric-scooter |  |
| max_load_kg | 150 | constructeur | https://www.hiboy.com/products/hiboy-titan-pro-electric-scooter-2026 |  |
| year | 2026 | constructeur | https://www.hiboy.com/products/hiboy-titan-pro-electric-scooter-2026 |  |
| weight_kg | 47 | constructeur | https://www.hiboy.ca/products/hiboy-titan-pro-electric-scooter | https://www.hiboy.com/products/hiboy-titan-pro-electric-scooter-2026 |
| suspension | Avant et arrière (double suspension) | constructeur | https://www.hiboy.com/products/hiboy-titan-pro-electric-scooter-2026 |  |
| ip_rating | IPX4 (trottinette) / IPX5 (batterie) | constructeur | https://www.hiboy.com/products/hiboy-titan-pro-electric-scooter-2026 |  |
| tire_size | 10" pneus tubeless remplis de gel (gel-filled tubeless) | constructeur | https://www.hiboy.com/products/hiboy-titan-pro-electric-scooter-2026 |  |
| wheel_inches | 10 | constructeur | https://www.hiboy.com/products/hiboy-titan-pro-electric-scooter-2026 |  |
| source_image_urls | 1 photo(s) | og:image fiche produit | http://electricrideco.com/cdn/shop/files/pro_1eebf2a4-873e-453b-856d-2e0d08fd61fe_1200x1200.webp?v=1780545095 |  |
| brake_type | disc_mechanical | site_test | https://scooter.guide/hiboy-titan-pro-electric-scooter-review/ |  |
| rim_diameter | 6.5 | revendeur | https://www.amazon.com/GLDYTIMES-10x2-75-6-5-10x2-70-6-5-Alpha-Hiboy-Max3-Evercross/dp/B0CL9TYZ1L | https://www.fruugo.us/10x275270-65-vacuum-tire-7065-65-electric-tires-scooter-10-inch-off-road-tire/p-376624980-814729494?language=en |
| tire_family | pneumatic | site_test | https://scooter.guide/hiboy-titan-pro-electric-scooter-review/ |  |
