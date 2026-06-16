-- ============================================================================
-- Reprix Plaquettes de frein + Chambres à air
-- price = opt_b  =  PUBLIC_PRICE_TTC Wattiz x 0,85 (-15%), arrondi catalogue ,90
-- Source : C:/Users/User/Downloads/wattiz (1).csv (croisement par SKU)
-- Généré le 2026-06-16 — À RELIRE avant exécution dans le SQL editor Lovable.
-- Pas de BEGIN/COMMIT (la transaction est gérée par l'éditeur).
-- Chaque UPDATE est filtré par sku ET protégé par WHERE price_override = false.
--
-- NB décompte : 49 UPDATE (pas 48). 52 fiches retrouvées dans le CSV,
--   moins les 3 exclues ci-dessous = 49. PL-01 n'est pas dans les 52
--   (introuvable au CSV), donc l'exclure ne retire rien aux 52.
--
-- FICHES EXCLUES (4) :
--   SP-60  Plaquettes Xiaomi M365 Pro / Dualtron — PUBLIC_PRICE_TTC 6,90 anormalement bas vs médiane cat. 24,90
--   SP-61  Plaquettes Xiaomi M365                — PUBLIC_PRICE_TTC 6,90 anormalement bas vs médiane cat. 24,90
--   PF-100 Plaquette Kaabo Skywalker E-cross     — opt_b laisse 67% de marge (< 70%) + bas/cat
--   PL-01  Plaquettes de Frein N°1               — introuvable dans le CSV Wattiz (aucune source de reprixage)
-- ============================================================================

-- ----- Chambres à air (16) -----
UPDATE parts SET price = 11.90 WHERE sku = 'CA-34' AND price_override = false; -- Chambre à air CLASSIQUE 8,5x2 valve 90x90° (TTC 15,00 -> 11,90)
UPDATE parts SET price = 15.90 WHERE sku = 'CA-06' AND price_override = false; -- Chambres à air Dualtron Mini et Speedway Leger (TTC 19,00 -> 15,90)
UPDATE parts SET price = 11.90 WHERE sku = 'CA-07' AND price_override = false; -- Chambre à air 8,5X2 Zéro 8 & 9 (TTC 14,90 -> 11,90)
UPDATE parts SET price = 11.90 WHERE sku = 'CA-09' AND price_override = false; -- Chambre à air Speedway Mini4 pro (200X50) (TTC 14,90 -> 11,90)
UPDATE parts SET price = 11.90 WHERE sku = 'CA-02' AND price_override = false; -- Chambre à air 10 x 2.50 Valve 0 X 90° (TTC 14,90 -> 11,90)
UPDATE parts SET price = 11.90 WHERE sku = 'CA-12' AND price_override = false; -- Chambre à air 8,5X2 valve 90x90° 134mm (TTC 14,90 -> 11,90)
UPDATE parts SET price = 11.90 WHERE sku = 'CA-27' AND price_override = false; -- Chambre à air 8x2 pouces E-road Ciwo (TTC 14,90 -> 11,90)
UPDATE parts SET price = 11.90 WHERE sku = 'CA-42' AND price_override = false; -- Chambre à air Draisienne 12x1.75 valve 70x70° (TTC 14,90 -> 11,90)
UPDATE parts SET price = 15.90 WHERE sku = 'CA-35' AND price_override = false; -- Chambre à air renforcé 10x2.125 90x90° (TTC 19,00 -> 15,90)
UPDATE parts SET price = 11.90 WHERE sku = 'CA-13' AND price_override = false; -- Chambre à air 8,5x2 (diam 140mm) pour Z8 Pro (TTC 14,90 -> 11,90)
UPDATE parts SET price = 11.90 WHERE sku = 'CA-14' AND price_override = false; -- Chambre à air 10x2/2.125 valve 45x45° (TTC 14,90 -> 11,90)
UPDATE parts SET price = 15.90 WHERE sku = 'CA-03' AND price_override = false; -- Chambre à air 90/65-6,5 11 pouces (TTC 19,50 -> 15,90)
UPDATE parts SET price = 11.90 WHERE sku = 'CA-33' AND price_override = false; -- Chambre à air 10x2.125 valve 0x90° (TTC 14,90 -> 11,90)
UPDATE parts SET price = 20.90 WHERE sku = 'CA-28' AND price_override = false; -- Chambre à air CST 4,10/3.50/4 (TTC 24,90 -> 20,90)
UPDATE parts SET price = 11.90 WHERE sku = 'CA-23' AND price_override = false; -- Chambre à air 10x3.0 (70/65-6.5) 90x90° (TTC 14,90 -> 11,90)
UPDATE parts SET price = 16.90 WHERE sku = 'CA-32' AND price_override = false; -- Chambre à air 90/65-6.5 valve droite (TTC 20,00 -> 16,90)

-- ----- Plaquettes de frein (33) -----
UPDATE parts SET price = 16.90 WHERE sku = 'PF-01' AND price_override = false; -- Plaquette de freins Speedway et Dualtron (TTC 19,91 -> 16,90)
UPDATE parts SET price = 16.90 WHERE sku = 'PF-16' AND price_override = false; -- Plaquettes de frein etrier Jak 5 Laotie (TTC 19,90 -> 16,90)
UPDATE parts SET price = 24.90 WHERE sku = 'PF-25' AND price_override = false; -- Plaquettes de freins draisienne (TTC 29,90 -> 24,90)
UPDATE parts SET price = 16.90 WHERE sku = 'PF-07' AND price_override = false; -- Plaquettes de freins Eroad (TTC 19,91 -> 16,90)
UPDATE parts SET price = 16.90 WHERE sku = 'PF-03' AND price_override = false; -- Plaquettes de freins Zero 10x 11x Vsett 10 (TTC 19,91 -> 16,90)
UPDATE parts SET price = 11.90 WHERE sku = 'PF-80' AND price_override = false; -- Plaquettes de frein Dualtron Togo Ltd Kukirin (TTC 14,90 -> 11,90)
UPDATE parts SET price = 16.90 WHERE sku = 'PF-02' AND price_override = false; -- Plaquettes de frein Shimano B01S Kaabo Mantis (TTC 19,91 -> 16,90)
UPDATE parts SET price = 11.90 WHERE sku = 'SP-1259' AND price_override = false; -- Plaquettes de frein Zoom Semi-Metallique (TTC 15,00 -> 11,90)
UPDATE parts SET price = 16.90 WHERE sku = 'PF-06' AND price_override = false; -- Plaquettes de freins Kugoo Gbooster 11E (TTC 19,91 -> 16,90)
UPDATE parts SET price = 16.90 WHERE sku = 'PF-04' AND price_override = false; -- Plaquettes de freins Xtech Zoom Xiaomi Mi3 (TTC 19,91 -> 16,90)
UPDATE parts SET price = 16.90 WHERE sku = 'PF-05' AND price_override = false; -- Plaquettes de freins SpeedTrott RS800/1600 (TTC 19,90 -> 16,90)
UPDATE parts SET price = 12.90 WHERE sku = 'PF-29' AND price_override = false; -- Plaquettes de freins Xiaomi Mi4 Niu Kqi2 (TTC 15,90 -> 12,90)
UPDATE parts SET price = 11.90 WHERE sku = 'PF-78' AND price_override = false; -- Plaquettes de frein Hope Tech4 V4 semi metal (TTC 14,90 -> 11,90)
UPDATE parts SET price = 16.90 WHERE sku = 'PF-15' AND price_override = false; -- Plaquette de frein Magura 9.C (TTC 19,90 -> 16,90)
UPDATE parts SET price = 16.90 WHERE sku = 'PF-14' AND price_override = false; -- Plaquette de freins Magura MT5 MT7 (TTC 19,90 -> 16,90)
UPDATE parts SET price = 23.90 WHERE sku = 'PF-88' AND price_override = false; -- Plaquettes de freins Zero 10x 11x Vsett 11 (TTC 29,00 -> 23,90)
UPDATE parts SET price = 28.90 WHERE sku = 'PF-95' AND price_override = false; -- Plaquettes de freins Hope Tech4 V4 Metal Fritté (TTC 35,00 -> 28,90)
UPDATE parts SET price = 23.90 WHERE sku = 'PF-91' AND price_override = false; -- Plaquettes de freins draisienne metal fritté (TTC 29,00 -> 23,90)
UPDATE parts SET price = 23.90 WHERE sku = 'PF-93' AND price_override = false; -- Plaquette de freins Speedway et Dualtron Metal (TTC 29,00 -> 23,90)
UPDATE parts SET price = 23.90 WHERE sku = 'PF-94' AND price_override = false; -- Plaquettes de freins Shimano D03S Nutt 4 pistons (TTC 29,00 -> 23,90)
UPDATE parts SET price = 23.90 WHERE sku = 'PF-92' AND price_override = false; -- Plaquettes de freins Xtech Zoom Xiaomi Mi3 metal (TTC 29,00 -> 23,90)
UPDATE parts SET price = 20.90 WHERE sku = 'PF-76' AND price_override = false; -- Plaquettes de freins Hope Tech4 V4 ceramique (TTC 24,90 -> 20,90)
UPDATE parts SET price = 28.90 WHERE sku = 'PF-70' AND price_override = false; -- Plaquettes de freins Nutt 4 pistons Thunder (TTC 34,90 -> 28,90)
UPDATE parts SET price = 16.90 WHERE sku = 'PF-77' AND price_override = false; -- Plaquettes de frein Hope Tech4 V4 metallique (TTC 19,90 -> 16,90)
UPDATE parts SET price = 33.90 WHERE sku = 'PF-71' AND price_override = false; -- Plaquettes de freins Shimano D03S Nutt 4 pistons (TTC 39,90 -> 33,90)
UPDATE parts SET price = 23.90 WHERE sku = 'PF-81' AND price_override = false; -- Plaquettes de frein Shimano B01S Kaabo Mantis (TTC 29,00 -> 23,90)
UPDATE parts SET price = 24.90 WHERE sku = 'PF-64' AND price_override = false; -- Plaquettes de freins Zero 10x 11x Vsett 11 (TTC 29,90 -> 24,90)
UPDATE parts SET price = 24.90 WHERE sku = 'PF-11' AND price_override = false; -- Plaquettes de freins Zero 10x 11x Vsett 11 (TTC 29,90 -> 24,90)
UPDATE parts SET price = 20.90 WHERE sku = 'PF-84' AND price_override = false; -- Plaquette de frein Magura 9.C Metallique (TTC 25,00 -> 20,90)
UPDATE parts SET price = 23.90 WHERE sku = 'PF-12' AND price_override = false; -- Plaquettes de freins ventilées Dualtron Thunder (TTC 29,00 -> 23,90)
UPDATE parts SET price = 23.90 WHERE sku = 'PF-85' AND price_override = false; -- Plaquette de frein Magura 9.C ceramique (TTC 29,00 -> 23,90)
UPDATE parts SET price = 23.90 WHERE sku = 'PF-83' AND price_override = false; -- Plaquette de freins Magura MT5 MT7 ceramique (TTC 29,00 -> 23,90)
UPDATE parts SET price = 23.90 WHERE sku = 'PF-89' AND price_override = false; -- Plaquettes de freins Nutt ventilées Dualtron (TTC 29,00 -> 23,90)
