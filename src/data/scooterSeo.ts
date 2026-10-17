/**
 * Fiches trottinettes enrichies pour le SEO — PILOTE du 17/10/2026 (Xiaomi 4 Pro, Ninebot G30 Max, Dualtron Thunder 3).
 * Règle : chaque affirmation vient soit de notre base vérifiée (specs, clés de montage, pièces compatibles),
 * soit d'une source citée dans `sources`. Rien d'inventé : une info non sourcée n'est pas écrite.
 * Une fois le gabarit validé par Nolan, ce contenu passera en base pour les 437 modèles.
 */
export interface SeoPart { label: string; size: string; count: number; to: string; cta: string }
export interface ScooterSeo {
  /** Nom complet affiché dans les titres de section (marque + modèle). */
  displayName: string;
  metaTitle: string;
  metaDescription: string;
  intro: string[];
  specs: [string, string][];
  pros: string[];
  cons: string[];
  parts: SeoPart[];
  care: string[];
  price?: { text: string; source: string };
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
  /** Vidéo YouTube intégrable (vérifiée par oEmbed). Priorité : chaîne du partenaire, puis meilleur test en français. */
  video?: { id: string; title: string; channel: string; uploadDate: string };
}

export const SCOOTER_SEO: Record<string, ScooterSeo> = {
  "xiaomi-electric-scooter-4-pro": {
    displayName: "Xiaomi Electric Scooter 4 Pro",
    metaTitle: "Xiaomi 4 Pro : fiche technique, avis et pièces",
    metaDescription: "Xiaomi 4 Pro : 700 W, 25 km/h, pneus tubeless 10\" 60/70-7, disque arrière 130 mm. Points forts, limites, entretien et pièces compatibles vérifiées.",
    intro: [
      "La Xiaomi Electric Scooter 4 Pro est la trottinette urbaine haut de gamme de Xiaomi, sortie en France en septembre 2022 au prix de lancement de 799 €. Elle reprend la recette qui a fait le succès de la marque (pliage simple, ligne sobre) avec plus de puissance, des pneus de 10 pouces et une grosse batterie pour un usage quotidien en ville.",
      "Moteur de 700 W, vitesse bridée à 25 km/h, autonomie annoncée jusqu'à 55 km : c'est une trottinette pensée pour les trajets domicile-travail, pas pour le tout-terrain. Elle n'a pas de suspension, ce sont ses pneus tubeless de 10 pouces qui absorbent les irrégularités.",
    ],
    specs: [
      ["Puissance", "700 W"], ["Vitesse max", "25 km/h"], ["Autonomie annoncée", "jusqu'à 55 km"], ["Batterie", "36 V"],
      ["Poids", "17 kg"], ["Charge max", "120 kg"], ["Roues", "10 pouces, tubeless 60/70-7"], ["Freins", "électronique avant (E-ABS) + disque mécanique arrière 130 mm"],
      ["Suspension", "aucune"], ["Étanchéité", "IPX4"], ["Prise de charge", "magnétique Xiaomi"], ["Sortie", "septembre 2022"],
    ],
    pros: [
      "Bonnes accélérations et reprises pour une trottinette urbaine (Frandroid).",
      "Pneus de 10 pouces nettement plus confortables que ceux des anciennes Xiaomi (Cleanrider).",
      "Plateau large et impression de robustesse, freinage rassurant (Frandroid).",
    ],
    cons: [
      "Pas de suspension : confort limité sur pavés et chaussée dégradée.",
      "Autonomie réelle en retrait : environ 30 km mesurés par Cleanrider, loin des 55 km annoncés.",
      "17 à 18 kg : se porte, mais pas longtemps.",
      "Recharge longue, 8 à 9 heures (Frandroid).",
    ],
    parts: [
      { label: "Pneu", size: "60/70-7 tubeless (10 pouces, jante 7\")", count: 4, to: "/piece/pneu-tubeless-60-70-7-ewheel", cta: "Pneus 60/70-7" },
      { label: "Pneu plein", size: "60/70-7", count: 2, to: "/piece/pneu-plein-10x250-6070-7-xiaomi-mi4-pro", cta: "Pneus pleins" },
      { label: "Disque de frein", size: "130 mm, 5 trous, entraxe 40 mm (arrière)", count: 1, to: "/piece/disque-de-frein-130mm-xiaomi-mi4-pro-5-trous-1st-generation", cta: "Disque 130 mm" },
    ],
    care: [
      "Contrôle la pression des pneus chaque semaine : un tubeless sous-gonflé s'use vite et crève plus facilement. Le gel DuraGel colmate certaines perforations, mais Xiaomi ne garantit pas qu'il les empêche toutes.",
      "Le disque arrière est le seul frein mécanique : surveille l'épaisseur des plaquettes et l'état du disque, surtout si tu freines fort en descente.",
      "Vérifie régulièrement le serrage du mécanisme de pliage et de la potence : un jeu qui s'installe se corrige tôt, il s'aggrave ensuite.",
    ],
    price: { text: "Prix de lancement en France : 799 € (septembre 2022).", source: "Frandroid" },
    faq: [
      { q: "Quelle taille de pneu pour la Xiaomi 4 Pro ?", a: "La Xiaomi Electric Scooter 4 Pro roule en 10 pouces tubeless, dimension 60/70-7 (jante de 7 pouces). Attention : ce n'est pas la même jante que les modèles 10 pouces en 6,5\"." },
      { q: "Quel disque de frein monter sur la Xiaomi 4 Pro ?", a: "Un disque de 130 mm à 5 trous, entraxe 40 mm, à l'arrière. L'avant n'a pas de frein mécanique : il freine électroniquement (E-ABS)." },
      { q: "Peut-on mettre des pneus pleins sur la Xiaomi 4 Pro ?", a: "Oui, des pneus pleins en 60/70-7 existent. Ils suppriment les crevaisons, mais la trottinette n'ayant pas de suspension, le confort baisse nettement." },
      { q: "Quelle est l'autonomie réelle de la Xiaomi 4 Pro ?", a: "Xiaomi annonce jusqu'à 55 km. En conditions réelles, Cleanrider a mesuré environ 30 km. Le poids du conducteur, le relief et le mode de conduite font varier ce chiffre." },
      { q: "Combien de temps pour recharger la Xiaomi 4 Pro ?", a: "Environ 8 à 9 heures pour une charge complète, selon le test de Frandroid." },
    ],
    sources: [
      { label: "Frandroid — test Xiaomi Electric Scooter 4 Pro", url: "https://www.frandroid.com/marques/xiaomi/1454308_test-xiaomi-electric-scooter-4-pro-trottinette-electrique" },
      { label: "Cleanrider — essai Xiaomi Electric Scooter 4 Pro", url: "https://www.cleanrider.com/actus/essai-xiaomi-electric-scooter-4-pro-la-meilleure-des-trottinettes-electriques-xiaomi-vaut-elle-son-prix/" },
      { label: "Xiaomi France — fiche officielle", url: "https://www.mi.com/fr/product/xiaomi-electric-scooter-4-pro/" },
    ],
  },

  "g30-max": {
    displayName: "Ninebot Max G30",
    metaTitle: "Ninebot Max G30 : fiche technique, avis et pièces",
    metaDescription: "Ninebot Max G30 : 350 W, jusqu'à 65 km annoncés, pneus tubeless 10x2.50-6.5, frein tambour avant. Avis, entretien et pièces compatibles.",
    intro: [
      "La Segway Ninebot KickScooter Max G30 est l'une des trottinettes électriques les plus répandues en France, et l'une des plus vues en atelier. Sa réputation tient en un chiffre : une autonomie annoncée jusqu'à 65 km, grâce à une batterie 36 V de 15 Ah.",
      "Moteur de 350 W, vitesse bridée à 25 km/h, pneus tubeless de 10 pouces avec couche de gel, chargeur intégré : c'est la trottinette des longs trajets quotidiens. En Europe, elle est vendue sous le nom Max G30E II.",
    ],
    specs: [
      ["Puissance", "350 W"], ["Vitesse max", "25 km/h"], ["Autonomie annoncée", "jusqu'à 65 km"], ["Batterie", "36 V, 15 Ah"],
      ["Poids", "environ 19 kg"], ["Charge max", "100 kg"], ["Roues", "10 pouces, tubeless 10x2.50-6.5"], ["Freins", "tambour mécanique avant + électronique arrière"],
      ["Suspension", "aucune"], ["Étanchéité", "IPX5"], ["Chargeur", "intégré, câble secteur"], ["Charge", "environ 6 h"],
    ],
    pros: [
      "Grande autonomie annoncée (65 km) pour une trottinette de cette catégorie (Segway).",
      "Pneus tubeless de 10 pouces avec couche de gel pour limiter les crevaisons (Segway).",
      "Chargeur intégré : un simple câble secteur suffit, rien à transporter (Segway).",
      "Frein avant à tambour, enfermé, peu sensible à la pluie et à la poussière.",
    ],
    cons: [
      "Environ 19 kg (19,9 kg annoncés pour la G30E II) : lourde à porter dans les escaliers.",
      "Pas de suspension : le confort repose uniquement sur les pneus.",
      "Un tambour freine moins fort qu'un disque : anticipe tes freinages.",
      "L'autonomie de 65 km est mesurée par le fabricant dans des conditions favorables ; en usage réel elle est plus faible.",
    ],
    parts: [
      { label: "Pneu", size: "10x2.50-6.5 tubeless (60/70-6.5)", count: 17, to: "/piece/pneu-tubeless-10x2-50-6-5-cityroad-ewheel", cta: "Pneus 10x2.50-6.5" },
      { label: "Chambre à air", size: "10x2.50, valve droite ou coudée", count: 4, to: "/piece/chambre-a-air-10x250-valve-90x90", cta: "Chambres à air" },
      { label: "Pneu plein", size: "10x2.50-6.5", count: 10, to: "/piece/pneu-plein-10x250-65-ninebot-g30-max", cta: "Pneus pleins" },
      { label: "Chargeur", size: "interne 36 V, prise secteur IEC", count: 1, to: "/piece/chargeur-interne-ninebot-max-g30", cta: "Chargeur interne G30" },
    ],
    care: [
      "Contrôle la pression des pneus chaque semaine : sur une trottinette sans suspension, un pneu sous-gonflé fatigue la jante et crève plus vite.",
      "Crevaisons à répétition sur le tubeless : la solution d'atelier courante est de poser une chambre à air 10x2.50 dans le pneu.",
      "Le frein tambour se règle : si la course du levier s'allonge, fais-le reprendre avant qu'il ne freine plus.",
      "Surveille le jeu du mécanisme de pliage : sur une trottinette aussi utilisée, il se corrige tôt.",
    ],
    faq: [
      { q: "Quelle taille de pneu pour la Ninebot Max G30 ?", a: "La Max G30 roule en 10 pouces tubeless, dimension 10x2.50-6.5 (aussi notée 60/70-6.5), jante de 6,5 pouces." },
      { q: "Peut-on mettre une chambre à air sur la G30 ?", a: "Oui. La G30 est d'origine en tubeless, mais poser une chambre à air 10x2.50 est une solution courante en cas de crevaisons répétées." },
      { q: "Quel chargeur pour la Ninebot Max G30 ?", a: "Le chargeur est intégré à la trottinette : on la branche directement au secteur avec un câble. En cas de panne, c'est ce chargeur interne qu'on remplace." },
      { q: "Quels freins a la Ninebot Max G30 ?", a: "Un frein à tambour mécanique à l'avant et un frein électronique (régénératif) à l'arrière, selon Segway." },
      { q: "Quelle est l'autonomie de la G30 ?", a: "Segway annonce jusqu'à 65 km, mesurés dans des conditions favorables. En usage réel, compte nettement moins selon ton poids, le relief et la vitesse." },
    ],
    sources: [
      { label: "Segway France — Ninebot KickScooter Max G30E II", url: "https://www.segwayfrance.com/boutique/Ninebot-KickScooter-Max-G30E-II-p467737151" },
      { label: "Segway Europe — fiche Max G30E II", url: "https://eu-en.segway.com/ekickscooter/products/max-g30e-ii.html" },
      { label: "Segway Belgique — recharge et chargeur intégré", url: "https://be-fr.segway.com/ekickscooter/products/max-g30e-ii.html" },
    ],
  },

  "dualtron-thunder-3": {
    displayName: "Dualtron Thunder 3",
    metaTitle: "Dualtron Thunder 3 : fiche technique, avis et pièces",
    metaDescription: "Dualtron Thunder 3 : bimoteur 72 V 40 Ah, freins hydrauliques Nutt 160 mm, pneus 11\" 90/65-6.5. Points forts, limites, entretien et pièces compatibles.",
    intro: [
      "La Dualtron Thunder 3 est l'un des modèles phares de Minimotors : une trottinette bimoteur de très forte puissance, construite autour d'une batterie de 72 V et 40 Ah (2 880 Wh) et annoncée jusqu'à 170 km d'autonomie.",
      "Deux moteurs de 2 500 W, des freins hydrauliques Nutt sur disques de 160 mm, des suspensions réglables à l'avant et à l'arrière et des pneus larges de 11 pouces : c'est une machine pour rouleurs expérimentés. Sur la voie publique en France, elle doit rester bridée à 25 km/h.",
    ],
    specs: [
      ["Moteurs", "2 × 2 500 W"], ["Vitesse", "25 km/h bridée (voie publique)"], ["Autonomie annoncée", "jusqu'à 170 km"], ["Batterie", "72 V, 40 Ah (2 880 Wh)"],
      ["Poids", "51,2 kg"], ["Charge max", "120 kg"], ["Roues", "11 pouces, tubeless 90/65-6.5"], ["Freins", "hydrauliques Nutt, disques 160 mm"],
      ["Suspension", "avant et arrière, réglables"], ["Étanchéité", "IPX5"], ["Prise de charge", "LP16-3"], ["Chargeur", "72 V (84 V en sortie)"],
    ],
    pros: [
      "Puissance bimoteur et batterie de 2 880 Wh parmi les plus grosses du marché (Minimotors).",
      "Freinage hydraulique Nutt sur disques de 160 mm.",
      "Suspensions réglables à l'avant et à l'arrière, pneus larges de 11 pouces.",
    ],
    cons: [
      "51 kg : elle ne se porte pas, il faut un rez-de-chaussée ou un garage.",
      "Encombrante, même pliée.",
      "Prix élevé (voir ci-dessous).",
      "Sa vitesse de pointe n'est utilisable que sur terrain privé : en France, la voie publique est limitée à 25 km/h.",
    ],
    parts: [
      { label: "Pneu", size: "90/65-6.5 tubeless (11 pouces)", count: 9, to: "/piece/pneu-tubeless-90-65-6-5-cityroad-ewheel", cta: "Pneus 90/65-6.5" },
      { label: "Chambre à air", size: "90/65-6.5, valve droite ou coudée", count: 5, to: "/piece/chambre-a-air-9065-65-11-pouces", cta: "Chambres à air" },
      { label: "Plaquettes", size: "étrier Nutt 4 pistons", count: 4, to: "/piece/plaquettes-de-freins-shimano-d03s-nutt-4-pistons-thunder-3-nami-semi-metallique", cta: "Plaquettes Nutt" },
      { label: "Disque de frein", size: "160 mm, 6 trous, entraxe 48 mm", count: 7, to: "/piece/disque-de-frein-160mm-dualtron-thunder-ultra", cta: "Disques 160 mm" },
      { label: "Chargeur", size: "72 V → 84 V, prise LP16-3", count: 2, to: "/piece/chargeur-72v-84v-2a-connecteur-lp16-3", cta: "Chargeurs 72 V" },
    ],
    care: [
      "Avec plus de 50 kg et deux moteurs, les pneus s'usent vite : contrôle la pression et l'usure avant chaque grosse sortie.",
      "Freins hydrauliques : surveille l'épaisseur des plaquettes et purge le circuit quand le levier devient mou.",
      "Vérifie le serrage des vis de suspension et de la colonne de direction : les vibrations d'une machine de ce poids desserrent la visserie.",
    ],
    price: { text: "Prix public du distributeur officiel : 3 990 € (affiché en promotion à 3 299 €, relevé le 17/10/2026).", source: "dualtron-shop.com" },
    faq: [
      { q: "Quelle taille de pneu pour la Dualtron Thunder 3 ?", a: "La Thunder 3 roule en 11 pouces tubeless, dimension 90/65-6.5 (jante de 6,5 pouces)." },
      { q: "Quelles plaquettes pour la Dualtron Thunder 3 ?", a: "Des plaquettes pour étrier hydraulique Nutt 4 pistons, en semi-métallique, métal fritté ou céramique selon ton usage." },
      { q: "Quel disque de frein pour la Thunder 3 ?", a: "Un disque de 160 mm à 6 trous, entraxe 48 mm." },
      { q: "Quel chargeur pour la Dualtron Thunder 3 ?", a: "Un chargeur 72 V (84 V en sortie) avec prise LP16-3. Un chargeur rapide existe pour réduire le temps de charge." },
      { q: "La Dualtron Thunder 3 est-elle légale en France ?", a: "Oui sur la voie publique à condition d'être bridée à 25 km/h, comme toute trottinette électrique. Débridée, elle n'est utilisable que sur terrain privé." },
    ],
    sources: [
      { label: "Dualtron Shop (distributeur officiel) — Thunder 3", url: "https://dualtron-shop.com/fr/produit/dualtron-thunder-3/" },
      { label: "Ministère de la Transition écologique — réglementation des trottinettes", url: "https://www.ecologie.gouv.fr/politiques-publiques/trottinettes-electriques-edpm-reglementation-vigueur" },
    ],
    video: { id: "B3ZtYULjj9I", title: "Test Dualtron Thunder 3 - EY4 - trottinette électrique", channel: "Dualtron Store ® officiel", uploadDate: "2023-06-19" },
  },

  // ─── Échantillon du 18/10/2026 (5 modèles du « Top du moment ») ───
  "ninebot-max-g2": {
    displayName: "Segway Ninebot Max G2",
    metaTitle: "Ninebot Max G2 : fiche technique, avis et pièces",
    metaDescription: "Ninebot Max G2 : 450 W, jusqu'à 70 km annoncés, pneus 10\" tubeless autocicatrisants, frein tambour avant. Avis, entretien et pièces compatibles.",
    intro: [
      "La Segway Ninebot Max G2 prend la suite de la Max G30, la trottinette des longs trajets. En France, sa version européenne (Max G2 E, bridée à 25 km/h) a été annoncée à 899 €, avec une disponibilité à partir d'avril 2023.",
      "Moteur de 450 W (900 W en pointe), batterie de 551 Wh, pneus tubeless autocicatrisants de 10 pouces et, nouveauté par rapport à la G30, des suspensions à l'avant et à l'arrière. Le chargeur est intégré : un simple câble suffit pour la recharger.",
    ],
    specs: [
      ["Moteur", "450 W (900 W en pointe)"], ["Vitesse", "25 km/h (version E)"], ["Autonomie annoncée", "jusqu'à 70 km"], ["Batterie", "36 V, 15,3 Ah (551 Wh)"],
      ["Poids", "24,3 kg"], ["Charge max", "120 kg"], ["Roues", "10 pouces, tubeless autocicatrisants (couche de gel)"], ["Freins", "tambour avant + électronique arrière"],
      ["Suspension", "avant hydraulique, arrière à ressorts"], ["Étanchéité", "IPX5 (batterie IPX7)"], ["Chargeur", "intégré"], ["Prix de lancement", "899 € (2023)"],
    ],
    pros: [
      "Confort jugé excellent grâce aux suspensions avant et arrière (Frandroid).",
      "Bonne autonomie, l'un des points forts du modèle (Frandroid).",
      "Pneus autocicatrisants : une petite crevaison se rebouche toute seule (Segway).",
    ],
    cons: [
      "24,3 kg : lourde à porter dans les escaliers (Frandroid).",
      "Écran jugé simpliste (Frandroid).",
      "Béquille jugée un peu juste (Frandroid).",
    ],
    parts: [
      { label: "Pneu", size: "10x2.50-6.5, tubeless", count: 17, to: "/piece/pneu-tubeless-10x2-50-6-5-cityroad-ewheel", cta: "Pneus 10 pouces" },
      { label: "Chambre à air", size: "10x2.50, valve droite ou coudée", count: 4, to: "/piece/chambre-a-air-10x250-valve-droite", cta: "Chambres à air" },
      { label: "Chargeur", size: "36 V → 42 V", count: 3, to: "/piece/chargeur-interne-ninebot-max-g30", cta: "Chargeurs" },
    ],
    care: [
      "Pneus tubeless : vérifie la pression chaque mois, un pneu sous-gonflé s'use vite et crève plus facilement.",
      "Le frein avant est un tambour : il n'y a pas de plaquettes à changer, mais son réglage se fait par le câble quand le levier devient long.",
      "Le gel rebouche les petites crevaisons, pas les coupures : un pneu entaillé se remplace.",
    ],
    price: { text: "Prix de lancement en France : 899 € (version Max G2 E, 2023).", source: "Frandroid" },
    faq: [
      { q: "Quelle taille de pneu pour la Ninebot Max G2 ?", a: "La Max G2 roule en 10 pouces tubeless, jante de 6,5 pouces : les pneus 10x2.50-6.5 de notre sélection sont compatibles." },
      { q: "La Ninebot Max G2 a-t-elle des plaquettes de frein ?", a: "Non. Elle a un frein à tambour à l'avant et un frein électronique à l'arrière : pas de disque ni de plaquettes." },
      { q: "Quel chargeur pour la Ninebot Max G2 ?", a: "Le chargeur est intégré à la trottinette. En cas de panne, il se remplace par un chargeur interne compatible, ou un chargeur externe 36 V (42 V en sortie)." },
      { q: "Quelle est la vraie autonomie de la Ninebot Max G2 ?", a: "Segway annonce jusqu'à 70 km, et jusqu'à 50 km en roulant à 25 km/h. Le poids du conducteur, le froid et le relief la font baisser." },
    ],
    sources: [
      { label: "Segway France — fiche officielle Ninebot Max G2 E", url: "https://fr-fr.segway.com/ekickscooter/products/max-g2-e.html" },
      { label: "Frandroid — Ninebot KickScooter Max G2 E", url: "https://www.frandroid.com/produits/trottinette-electrique/segway/1693843-ninebot-kickscooter-max-g2-e" },
    ],
    video: { id: "hIE4L3OAvjE", title: "La vérité sur la Ninebot Max G2 : la nouvelle reine des trottinettes urbaines ?", channel: "TOUKIWANTI", uploadDate: "2023-07-09" },
  },
  "mantis-pro": {
    displayName: "Kaabo Mantis 10 Pro",
    metaTitle: "Kaabo Mantis 10 Pro : fiche technique et pièces",
    metaDescription: "Kaabo Mantis 10 Pro : bimoteur 2 x 1 000 W, batterie 60 V, pneus 10x3 (80/65-6), freins Zoom. Fiche technique, entretien et pièces compatibles.",
    intro: [
      "La Kaabo Mantis 10 Pro est une trottinette bimoteur de 60 V : deux moteurs de 1 000 W, un par roue, et des suspensions à ressort à l'avant et à l'arrière. Elle vise les rouleurs qui veulent de la puissance sans passer à une machine de plus de 40 kg.",
      "Avec 30 kg et des pneus de 10 pouces, elle reste maniable en ville. Plusieurs versions circulent (batterie de 24 ou 24,5 Ah, freins différents selon les séries) : vérifie la version de ta trottinette avant de commander une pièce de frein.",
    ],
    specs: [
      ["Moteurs", "2 × 1 000 W"], ["Vitesse", "25 km/h bridée (voie publique)"], ["Autonomie annoncée", "jusqu'à 69 km (fiche Kaabo)"], ["Batterie", "60 V, 24 à 24,5 Ah selon la version"],
      ["Poids", "30 kg"], ["Charge max", "120 kg"], ["Roues", "10 pouces, 80/65-6 (10x3)"], ["Freins", "disques avant et arrière, étriers Zoom"],
      ["Suspension", "bras à ressort avant et arrière"], ["Prise de charge", "GX16-3P"],
    ],
    pros: [
      "Deux moteurs de 1 000 W, un par roue (fiche Kaabo).",
      "Suspensions à l'avant et à l'arrière.",
      "30 kg seulement pour une bimoteur.",
    ],
    cons: [
      "Plusieurs versions coexistent : batterie et freins changent selon la série, à vérifier avant de commander.",
      "La fiche Kaabo ne donne pas d'indice d'étanchéité.",
      "Sa vitesse de pointe n'est utilisable que sur terrain privé : en France, la voie publique est limitée à 25 km/h.",
    ],
    parts: [
      { label: "Pneu", size: "80/65-6 (10x3)", count: 10, to: "/piece/pneu-tubeless-80-65-6-10x3-cityroad-ewheel", cta: "Pneus 10x3" },
      { label: "Chambre à air", size: "80/65-6, valve droite ou coudée", count: 7, to: "/piece/chambre-a-air-80-65-6-10x3-valve-droite-ewheel", cta: "Chambres à air" },
      { label: "Plaquettes", size: "étrier Zoom", count: 7, to: "/piece/plaquettes-de-frein-zoom-semi-metallique", cta: "Plaquettes Zoom" },
      { label: "Chargeur", size: "60 V → 67,2 V, prise GX16-3P", count: 2, to: "/piece/chargeur-60v-672v-2a-connecteur-gx16-3p", cta: "Chargeurs 60 V" },
    ],
    care: [
      "Bimoteur : les deux pneus travaillent en traction, contrôle l'usure des deux, pas seulement de l'arrière.",
      "Surveille l'épaisseur des plaquettes Zoom : à forte puissance, elles s'usent vite.",
      "Pas d'indice d'étanchéité annoncé : évite les flaques et sèche la trottinette après la pluie.",
    ],
    faq: [
      { q: "Quelle taille de pneu pour la Kaabo Mantis 10 Pro ?", a: "Des pneus de 10 pouces en 80/65-6, aussi notés 10x3 : jante de 6 pouces." },
      { q: "Quelles plaquettes pour la Kaabo Mantis Pro ?", a: "Des plaquettes pour étrier Zoom. Selon la série, les freins peuvent changer : compare la forme de ta plaquette avant de commander." },
      { q: "Quel chargeur pour la Kaabo Mantis Pro 60 V ?", a: "Un chargeur 60 V (67,2 V en sortie) avec prise GX16-3P. Un modèle rapide existe pour réduire le temps de charge." },
      { q: "La Kaabo Mantis Pro est-elle légale en France ?", a: "Oui sur la voie publique à condition d'être bridée à 25 km/h, comme toute trottinette électrique." },
    ],
    sources: [
      { label: "Kaabo — Mantis 10", url: "https://www.kaabo.com/mantis-10/" },
      { label: "Kaabo Mantis — fiche Mantis 10 Pro", url: "https://kaabomantis.com/shop/kaabo-mantis-10-pro/" },
      { label: "Wattiz — Kaabo Mantis 10 Pro (prise de charge)", url: "https://www.wattiz.fr/fr/s/225/kaabo-mantis-10-pro" },
      { label: "Ministère de la Transition écologique — réglementation des trottinettes", url: "https://www.ecologie.gouv.fr/politiques-publiques/trottinettes-electriques-edpm-reglementation-vigueur" },
    ],
  },
  "kukirin-g2-master": {
    displayName: "Kukirin G2 Master",
    metaTitle: "Kukirin G2 Master : fiche technique, avis et pièces",
    metaDescription: "Kukirin G2 Master : bimoteur 2 x 1 000 W, 52 V 20,8 Ah, pneus 80/65-6, disques 140 mm. Avis, entretien et pièces compatibles vérifiées.",
    intro: [
      "La Kukirin G2 Master est la plus puissante de la gamme G2 : deux moteurs de 1 000 W, une batterie de 52 V et 20,8 Ah, et des suspensions hydrauliques à l'avant et à l'arrière. Elle est pensée pour rouler en ville comme sur les chemins.",
      "Avec 33 kg, elle reste plus légère que la plupart des bimoteurs. Elle freine avec des disques mécaniques de 140 mm à l'avant et à l'arrière, et roule sur des pneus de 10 pouces tout-terrain.",
    ],
    specs: [
      ["Moteurs", "2 × 1 000 W"], ["Vitesse", "25 km/h bridée (voie publique)"], ["Autonomie annoncée", "jusqu'à 70 km"], ["Batterie", "52 V, 20,8 Ah"],
      ["Poids", "33 kg"], ["Charge max", "120 kg"], ["Roues", "10 pouces, 80/65-6, jante en deux parties"], ["Freins", "disques mécaniques 140 mm avant et arrière"],
      ["Suspension", "hydraulique avant et arrière"], ["Étanchéité", "IP54"],
    ],
    pros: [
      "Accélérations et puissance des deux moteurs (Techno-Science).",
      "Pneus tout-terrain et suspensions avant et arrière pour sortir de la route (Techno-Science).",
      "Environ 45 km mesurés en conduite sportive, deux moteurs engagés (Techno-Science).",
    ],
    cons: [
      "Autonomie réelle inférieure aux 70 km annoncés (Techno-Science).",
      "Freins à disque mécaniques, pas hydrauliques (Techno-Science).",
      "33 kg : lourde à porter.",
    ],
    parts: [
      { label: "Pneu", size: "80/65-6 (10x3)", count: 10, to: "/piece/pneu-tubeless-80-65-6-10x3-cityroad-ewheel", cta: "Pneus 10x3" },
      { label: "Chambre à air", size: "80/65-6, valve droite ou coudée", count: 7, to: "/piece/chambre-a-air-80-65-6-10x3-valve-coudee-ewheel", cta: "Chambres à air" },
      { label: "Plaquettes", size: "étrier G2 / Togo", count: 2, to: "/piece/plaquettes-de-frein-dualtron-togo-ltd-kukirin-g2pro-g2-max-hitway-h5-urbanglide-allroad", cta: "Plaquettes" },
      { label: "Disque de frein", size: "140 mm, 6 trous, entraxe 44 mm", count: 5, to: "/piece/disque-de-frein-140mm-kukirin-g2-pro", cta: "Disques 140 mm" },
    ],
    care: [
      "Freins mécaniques : retends le câble quand le levier devient long, et contrôle l'épaisseur des plaquettes.",
      "Jante en deux parties : le changement de pneu se fait en ouvrant la jante, c'est plus simple qu'un démontage au levier.",
      "Contrôle la pression des deux pneus : en tout-terrain, un pneu sous-gonflé pince la chambre à air.",
    ],
    faq: [
      { q: "Quelle taille de pneu pour la Kukirin G2 Master ?", a: "Des pneus de 10 pouces en 80/65-6 (aussi notés 10x3), sur une jante de 6 pouces." },
      { q: "Quel disque de frein pour la Kukirin G2 Master ?", a: "Un disque de 140 mm à 6 trous, entraxe 44 mm, à l'avant comme à l'arrière." },
      { q: "Combien pèse la Kukirin G2 Master ?", a: "33 kg selon la fiche technique du constructeur. Une autre fiche du site Kukirin annonce plus : vérifie la version de ta trottinette." },
      { q: "La Kukirin G2 Master est-elle légale en France ?", a: "Oui sur la voie publique à condition d'être bridée à 25 km/h, comme toute trottinette électrique." },
    ],
    sources: [
      { label: "Kukirin — fiche technique G2 Master", url: "https://www.kukirinfactory.com/uploads/43829/files/02.KuKirin-G2-Master-Specification.xlsx" },
      { label: "Techno-Science — test Kukirin G2 Master", url: "https://www.techno-science.net/fr/tests/test-kukirin-g2-master-la-trottinette-bimoteur-optimisee-148" },
      { label: "Ministère de la Transition écologique — réglementation des trottinettes", url: "https://www.ecologie.gouv.fr/politiques-publiques/trottinettes-electriques-edpm-reglementation-vigueur" },
    ],
    video: { id: "k3GF4isDL5w", title: "Kukirin G2 Master : déballage et test complet, bimoteur 2000 W", channel: "Mc Aventure", uploadDate: "2024-11-05" },
  },
  "mi-3": {
    displayName: "Xiaomi Mi Electric Scooter 3",
    metaTitle: "Xiaomi Mi 3 : fiche technique, avis et pièces",
    metaDescription: "Xiaomi Mi Electric Scooter 3 : 300 W, 30 km annoncés, 13,2 kg, pneus 8,5\" (8.5x2-6.1), disque arrière double plaquette. Avis et pièces compatibles.",
    intro: [
      "La Xiaomi Mi Electric Scooter 3 est sortie en France le 21 octobre 2021, au prix de lancement de 449 €. C'est la trottinette légère de la gamme : 13,2 kg, pliage rapide, pour les petits trajets en ville.",
      "Moteur de 300 W (600 W en pointe), batterie de 275 Wh pour 30 km annoncés, pneus gonflables de 8,5 pouces. À l'arrière, un frein à disque avec un étrier à double plaquette, à l'avant un freinage électronique par récupération d'énergie.",
    ],
    specs: [
      ["Moteur", "300 W (600 W en pointe)"], ["Vitesse", "25 km/h"], ["Autonomie annoncée", "30 km"], ["Batterie", "36 V, 7,65 Ah (275 Wh)"],
      ["Poids", "13,2 kg"], ["Charge max", "100 kg"], ["Roues", "8,5 pouces, gonflables avec chambre à air"], ["Freins", "électronique avant + disque arrière double plaquette"],
      ["Suspension", "aucune"], ["Étanchéité", "IP54"], ["Prix de lancement", "449 € (2021)"],
    ],
    pros: [
      "Bonne reprise quand la batterie est bien chargée (Frandroid, Les Numériques).",
      "Freinage jugé mordant (Frandroid).",
      "Facile à ranger et à transporter, avec un phare efficace (Frandroid).",
    ],
    cons: [
      "Petites roues et pas de suspension : confort moyen sur les chaussées abîmées (Frandroid).",
      "Autonomie jugée limitée (Frandroid, Les Numériques).",
      "Pneus gonflables sensibles aux crevaisons (Les Numériques).",
    ],
    parts: [
      { label: "Pneu", size: "8.5x2-6.1", count: 6, to: "/piece/pneu-tubeless-8-5x2-6-1-cityroad-gel-anti-crevaison-ewheel", cta: "Pneus 8,5 pouces" },
      { label: "Chambre à air", size: "8.5x2", count: 4, to: "/piece/chambre-a-air-85x2-xiaomi-m365", cta: "Chambres à air" },
      { label: "Plaquettes", size: "étrier double plaquette Xtech / Zoom", count: 4, to: "/piece/plaquettes-de-freins-xtech-zoom-xiaomi-mi3", cta: "Plaquettes Mi 3" },
      { label: "Chargeur", size: "36 V → 42 V, prise RCA", count: 2, to: "/piece/chargeur-36v-42v-2a-xiaomi-connecteur-rca", cta: "Chargeurs Xiaomi" },
    ],
    care: [
      "Pneus à chambre à air : garde la bonne pression, c'est la meilleure protection contre les crevaisons par pincement.",
      "L'étrier arrière a deux plaquettes : remplace-les par paire et règle l'étrier pour qu'il ne frotte pas.",
      "Contre les crevaisons, un pneu plein 8,5 pouces se monte sur ce modèle.",
    ],
    price: { text: "Prix de lancement en France : 449 € (octobre 2021).", source: "Les Numériques" },
    faq: [
      { q: "Quelle taille de pneu pour la Xiaomi Mi 3 ?", a: "Des pneus de 8,5 pouces, dimension 8.5x2, sur une jante de 6,1 pouces, avec chambre à air." },
      { q: "Quelles plaquettes pour la Xiaomi Mi 3 ?", a: "La Mi 3 a un étrier arrière à double plaquette (type Xtech / Zoom), différent de celui de la M365 : prends des plaquettes prévues pour la Mi 3." },
      { q: "Quel chargeur pour la Xiaomi Mi 3 ?", a: "Un chargeur 36 V (42 V en sortie) avec prise RCA, le même format que les autres Xiaomi." },
      { q: "Peut-on mettre des pneus pleins sur une Xiaomi Mi 3 ?", a: "Oui, des pneus pleins de 8,5 pouces se montent sur ce modèle : plus de crevaison, mais un peu moins de confort." },
    ],
    sources: [
      { label: "Mi.com — caractéristiques Mi Electric Scooter 3", url: "https://www.mi.com/fr/product/mi-electric-scooter-3/specs/" },
      { label: "Frandroid — test Mi Electric Scooter 3", url: "https://www.frandroid.com/marques/xiaomi/1091093_test-xiaomi-mi-electric-scooter-3-trottinette-electrique" },
      { label: "Les Numériques — Mi Electric Scooter 3", url: "https://www.lesnumeriques.com/trottinette-electrique/xiaomi-mi-electric-scooter-3-p65273.html" },
    ],
    video: { id: "hRsVsG5UEN0", title: "Test de la Xiaomi Mi Electric Scooter 3 : pénalisée par son application ?", channel: "Selectos Tests", uploadDate: "2022-03-21" },
  },
  "dualtron-city-2025": {
    displayName: "Dualtron City",
    metaTitle: "Dualtron City : fiche technique, avis et pièces",
    metaDescription: "Dualtron City 2025 : bimoteur 60 V, roues de 15 pouces, freins hydrauliques et disques 160 mm. Fiche technique, entretien, pièces et où l'acheter.",
    intro: [
      "La Dualtron City est la trottinette « de ville » de Minimotors : de grandes roues de 15 pouces, à mi-chemin entre la trottinette et le vélo, pour gagner en stabilité et en confort sur les pavés et les trottoirs.",
      "Elle garde l'ADN Dualtron : deux moteurs de 1 000 W, une batterie de 60 V (20 ou 25 Ah selon la version), des suspensions à l'avant et à l'arrière et des freins hydrauliques sur disques de 160 mm.",
    ],
    specs: [
      ["Moteurs", "2 × 1 000 W"], ["Vitesse", "25 km/h bridée (voie publique)"], ["Autonomie annoncée", "jusqu'à 70 km (20 Ah)"], ["Batterie", "60 V, 20 ou 25 Ah"],
      ["Poids", "environ 39 à 41 kg selon la batterie"], ["Charge max", "120 kg"], ["Roues", "15 pouces, pneus 2.50-10"], ["Freins", "hydrauliques, disques 160 mm"],
      ["Suspension", "avant et arrière"], ["Prise de charge", "LP16-3"],
    ],
    pros: [
      "Grandes roues de 15 pouces : stabilité et confort sur les pavés.",
      "Deux moteurs et une batterie de 60 V (Minimotors).",
      "Freins hydrauliques sur disques de 160 mm.",
    ],
    cons: [
      "Autour de 40 kg : elle se range au rez-de-chaussée, pas dans un escalier.",
      "Les fiches des revendeurs ne s'accordent pas sur l'étrier (Zoom ou Nutt) : vérifie le tien avant de commander des plaquettes.",
      "Sa vitesse de pointe n'est utilisable que sur terrain privé : en France, la voie publique est limitée à 25 km/h.",
    ],
    parts: [
      { label: "Pneu", size: "14x2.50-10", count: 1, to: "/piece/pneu-tubeless-14x2-50-10-cityroad-chaoyang", cta: "Pneu 14x2.50-10" },
      { label: "Plaquettes", size: "étrier type Sram Avid / Zoom", count: 8, to: "/piece/plaquettes-de-freins-zero-10x-11x-vsett-10-storm-thunder-sram-avid-semi-metallique", cta: "Plaquettes" },
      { label: "Disque de frein", size: "160 mm, 6 trous, entraxe 48 mm", count: 7, to: "/piece/disque-de-frein-160mm-28mm-entraxe-48mm", cta: "Disques 160 mm" },
      { label: "Chargeur", size: "60 V → 67,2 V, prise LP16-3", count: 2, to: "/piece/pack-chargeur-60v-672v-2a-connecteur-lp16-3", cta: "Chargeurs 60 V" },
    ],
    care: [
      "Freins hydrauliques : surveille l'épaisseur des plaquettes et purge le circuit quand le levier devient mou.",
      "Grandes roues, grande surface de contact : contrôle la pression et l'usure des pneus régulièrement.",
      "Vérifie le serrage de la colonne et des vis de suspension : 40 kg de machine desserrent la visserie à la longue.",
    ],
    faq: [
      { q: "Quelle taille de pneu pour la Dualtron City ?", a: "La City roule sur des roues de 15 pouces, avec des pneus 2.50-10 (jante de 10 pouces)." },
      { q: "Quel disque de frein pour la Dualtron City ?", a: "Un disque de 160 mm à 6 trous, entraxe 48 mm." },
      { q: "Quel chargeur pour la Dualtron City ?", a: "Un chargeur 60 V (67,2 V en sortie) avec prise LP16-3. Un chargeur rapide existe aussi." },
      { q: "La Dualtron City est-elle légale en France ?", a: "Oui sur la voie publique à condition d'être bridée à 25 km/h, comme toute trottinette électrique." },
    ],
    sources: [
      { label: "Minimotors France — Dualtron City", url: "https://www.minimotors.fr/shop/mmdualtronnewcity-trottinette-electrique-dualtron-new-city-60v-12119" },
      { label: "Dualtron Store — Dualtron City 20 Ah et 25 Ah", url: "https://dualtron-store.com/index.php/produit/dualtron-city-20-ah-et-25-ah/" },
      { label: "Ministère de la Transition écologique — réglementation des trottinettes", url: "https://www.ecologie.gouv.fr/politiques-publiques/trottinettes-electriques-edpm-reglementation-vigueur" },
    ],
    video: { id: "PJE781Mjq_g", title: "Test Dualtron City : un mix entre trott et vélo ?", channel: "Dualtron Store ® officiel", uploadDate: "2023-06-23" },
  },
};
