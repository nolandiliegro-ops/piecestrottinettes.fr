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
  },
};
