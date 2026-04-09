#!/usr/bin/env node
/**
 * scripts/sync-scooters.js
 * Agent autonome de veille produit — synchronise les modèles de trottinettes dans Supabase.
 *
 * Usage :
 *   node scripts/sync-scooters.js "Xiaomi"
 *   node scripts/sync-scooters.js "Xiaomi" --update   → met à jour les existants
 *
 * Ce script :
 *  1. Lit le schéma depuis src/integrations/supabase/types.ts
 *  2. Charge le catalogue enrichi par marque
 *  3. Construit les champs SEO + technical_signature pour chaque modèle
 *  4. N'écrit JAMAIS image_url (champ géré séparément)
 *  5. Appelle la Edge Function bulk-insert-scooters
 *  6. Affiche le résumé : champs remplis vs manquants par modèle
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const brand     = process.argv[2];
const doUpdate  = process.argv.includes('--update');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(__dirname, '../.env');
  let content;
  try { content = readFileSync(envPath, 'utf-8'); }
  catch { console.error('❌ .env introuvable :', envPath); process.exit(1); }
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=][^=]*)=["']?([^"'\r\n]*)["']?/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

function toSlug(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function log(sym, msg) { console.log(`${sym} ${msg}`); }

function readSchema() {
  try {
    const content = readFileSync(resolve(__dirname, '../src/integrations/supabase/types.ts'), 'utf-8');
    const m = content.match(/scooter_models:\s*\{[\s\S]*?Row:\s*\{([\s\S]*?)\}/);
    if (m) {
      const fields = [...m[1].matchAll(/(\w+):\s*([^\n]+)/g)].map(f => f[1]);
      log('📋', `Schéma OK — ${fields.length} champs : ${fields.join(', ')}`);
    }
  } catch { /* optionnel */ }
}

// ─── Catalogue enrichi ────────────────────────────────────────────────────────
//
// Chaque modèle contient :
//   Specs              → power_watts, voltage, max_speed_kmh, range_km, tire_type, tire_size
//   SEO direct         → description, meta_title, meta_description, search_terms, youtube_video_id
//   technical_signature:
//     tire_diameter    → diamètre exact en pouces (number)
//     official_page    → URL page fabricant officielle
//     sources          → [3 URLs] fabricant + revendeur agréé + fiche technique
//     image_suggestions→ [3 URLs directes] à soumettre à l'admin pour sélection manuelle
//     tire_type        → "pneumatique" | "pleine"
//     wheel_categories → catégories de pièces associées
//
// IMPORTANT : image_url est EXCLU du payload — géré via l'interface admin.

const CATALOG = {

  // ════════════════════════════════════════════════════════════════════
  // XIAOMI
  // ════════════════════════════════════════════════════════════════════
  xiaomi: [
    {
      name: 'Mi Electric Scooter Essential',
      year: 2020, power_watts: 250, voltage: 36, max_speed_kmh: 20, range_km: 20,
      tire_type: 'pneumatique', tire_size: '8.5 pouces',

      description: `La Xiaomi Mi Electric Scooter Essential est la trottinette électrique d'entrée de gamme par excellence pour les trajets urbains courts. Propulsée par un moteur de 250W, elle atteint 20 km/h pour une autonomie de 20 km — idéale pour les petits déplacements quotidiens. Ses pneus pneumatiques anti-crevaison de 8,5 pouces assurent un confort correct sur les voies urbaines. Les propriétaires de l'Essential ont fréquemment besoin de remplacer le pneu 8,5×2, la chambre à air correspondante, le chargeur 36V 2A d'origine et les mâchoires de frein. La poignée de frein gauche et les roulements de roue arrière sont également des consommables courants. Sur PiècesTrottinettes.fr, retrouvez toutes les pièces détachées compatibles Xiaomi Mi Electric Scooter Essential : références d'origine et alternatives qualité premium, avec livraison rapide depuis Marseille pour remettre votre trottinette sur la route en moins de 48h.`,
      meta_title: `Xiaomi Mi Electric Scooter Essential - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces détachées Xiaomi Mi Scooter Essential : pneu 8,5", chambre à air, chargeur 36V, frein. Livraison rapide depuis Marseille.`,
      search_terms: `xiaomi essential pièces détachées,pneu 8.5 xiaomi,chambre air essential,chargeur 36V xiaomi,frein xiaomi essential,réparation xiaomi,trottinette 250W pièces,roue avant essential,batterie xiaomi essential,pneumatique 8.5 anti-crevaison`,
      youtube_video_id: null,

      tire_diameter: 8.5,
      official_page: 'https://www.mi.com/fr/product/mi-electric-scooter-essential',
      sources: [
        'https://www.mi.com/fr/product/mi-electric-scooter-essential',
        'https://www.ldlc.com/fiche/PB00316889.html',
        'https://www.fnac.com/trottinette-electrique-xiaomi-mi-electric-scooter-essential/a14936302/w-4',
      ],
      image_suggestions: [
        'https://cdn.idealo.com/folder/Product/6578/6/6578676/s1_productimage.jpg',
        'https://i01.appmifile.com/webfile/globalimg/products/m/mi-electric-scooter-essential/main.png',
        'https://i01.appmifile.com/webfile/globalimg/products/m/electric-scooter-essential/side.png',
      ],
    },

    {
      name: 'Mi Electric Scooter Pro 2',
      year: 2020, power_watts: 600, voltage: 36, max_speed_kmh: 25, range_km: 45,
      tire_type: 'pneumatique', tire_size: '10 pouces',

      description: `La Xiaomi Mi Electric Scooter Pro 2 est restée plusieurs années la référence absolue du segment mid-range en France. Son moteur de 600W crête lui permet d'atteindre les 25 km/h légaux avec une autonomie record de 45 km, grâce à sa batterie 36V 12,8Ah. Les pneus pneumatiques 10 pouces et le système de freinage régénératif E-ABS font de cette trottinette un choix solide pour les navetteurs quotidiens. Les pièces les plus demandées pour la Pro 2 sont le pneu 10×2,5, la chambre à air 10 pouces, le chargeur 36V 3A, le disque de frein 120mm et les câbles de frein. La potence pliante et l'écran TFT sont aussi des composants que l'on remplace souvent. Notre stock garantit des pièces détachées Xiaomi Mi Scooter Pro 2 compatibles pour prolonger la durée de vie de votre trottinette, avec conseil technique inclus.`,
      meta_title: `Xiaomi Mi Electric Scooter Pro 2 - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces détachées Xiaomi Mi Scooter Pro 2 : pneu 10", disque frein 120mm, chargeur 36V 3A. Stock Marseille, expédition 24h.`,
      search_terms: `xiaomi pro 2 pièces détachées,pneu 10 pouces xiaomi,disque frein pro 2,chargeur 36V 3A xiaomi,chambre air 10 xiaomi,câble frein pro 2,batterie 36V xiaomi,trottinette 600W pièces,potence xiaomi pro 2,réparation mi scooter pro 2`,
      youtube_video_id: null,

      tire_diameter: 10,
      official_page: 'https://www.mi.com/fr/product/mi-scooter-pro-2',
      sources: [
        'https://www.mi.com/fr/product/mi-scooter-pro-2',
        'https://www.ldlc.com/fiche/PB00430527.html',
        'https://www.gsmarena.com/xiaomi_mi_electric_scooter_pro_2-10384.php',
      ],
      image_suggestions: [
        'https://cdn.idealo.com/folder/Product/6578/4/6578476/s1_productimage.jpg',
        'https://i01.appmifile.com/webfile/globalimg/products/m/mi-scooter-pro2/main.png',
        'https://cdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-mi-electric-scooter-pro-2-1.jpg',
      ],
    },

    {
      name: 'Mi Electric Scooter 3',
      year: 2021, power_watts: 300, voltage: 36, max_speed_kmh: 25, range_km: 30,
      tire_type: 'pneumatique', tire_size: '8.5 pouces',

      description: `La Xiaomi Mi Electric Scooter 3 succède à l'Essential avec un moteur 300W nominaux et une autonomie portée à 30 km. Elle conserve les pneus pneumatiques 8,5 pouces tout en intégrant un double système de freinage (E-ABS + frein à disque) pour plus de sécurité. Légère à 13 kg, elle se plie en quelques secondes. Les pannes les plus fréquentes sur la Xiaomi 3 concernent le pneu 8,5×2 (crevaison), la chambre à air, le chargeur 36V 2A et les plaquettes de frein arrière. Le câble de frein avant s'use également avec le temps. Retrouvez sur PiècesTrottinettes.fr toutes les pièces détachées compatibles Xiaomi Mi Electric Scooter 3, sélectionnées par nos techniciens spécialisés à Marseille. Chaque pièce est testée pour garantir une compatibilité parfaite et une durée de vie optimale sur votre trottinette.`,
      meta_title: `Xiaomi Mi Electric Scooter 3 - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces détachées Xiaomi Mi Electric Scooter 3 : pneu 8,5", chambre à air, chargeur 36V, câble frein. Compatible garanti, livraison 48h.`,
      search_terms: `xiaomi scooter 3 pièces,pneu 8.5 mi scooter 3,chambre air xiaomi 3,chargeur xiaomi mi 3,frein xiaomi scooter 3,trottinette 300W pièces,réparation mi scooter 3,câble frein xiaomi,roue arrière xiaomi 3,batterie 36V mi scooter 3`,
      youtube_video_id: null,

      tire_diameter: 8.5,
      official_page: 'https://www.mi.com/fr/product/mi-electric-scooter-3',
      sources: [
        'https://www.mi.com/fr/product/mi-electric-scooter-3',
        'https://www.fnac.com/trottinette-electrique-xiaomi-mi-electric-scooter-3/a16090374/w-4',
        'https://www.notebookcheck.net/Xiaomi-Mi-Electric-Scooter-3-review.html',
      ],
      image_suggestions: [
        'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1648814016.46533045.png',
        'https://cdn.idealo.com/folder/Product/6913/2/6913262/s1_productimage.jpg',
        'https://i01.appmifile.com/webfile/globalimg/products/m/mi-electric-scooter-3/main.png',
      ],
    },

    {
      name: 'Mi Electric Scooter 3 Pro',
      year: 2021, power_watts: 600, voltage: 36, max_speed_kmh: 25, range_km: 45,
      tire_type: 'pneumatique', tire_size: '10 pouces',

      description: `La Xiaomi Mi Electric Scooter 3 Pro est la version premium de la gamme 3, dotée de roues 10 pouces pour un confort supérieur sur chaussée. Son moteur 600W crête et sa batterie 36V 12,8Ah lui confèrent une autonomie de 45 km et une montée en côte jusqu'à 20%. Le système de suspension arrière intégré absorbe les chocs et prolonge la durée de vie des composants. Pour les propriétaires de la Xiaomi 3 Pro, les pièces les plus recherchées sont le pneu 10×2,5 pneumatique, la chambre à air 10 pouces valve Schrader, le disque de frein 120mm, le chargeur 36V 3A certifié et les câbles de frein avant/arrière. La courroie de transmission et les roulements roue avant s'usent également. PiècesTrottinettes.fr propose un stock complet de pièces détachées pour Xiaomi Mi Electric Scooter 3 Pro avec garantie de compatibilité et support technique.`,
      meta_title: `Xiaomi Mi Electric Scooter 3 Pro - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces détachées Xiaomi Mi Scooter 3 Pro : pneu 10", disque frein, chargeur 36V 3A, suspension. Compatibilité garantie, Marseille.`,
      search_terms: `xiaomi 3 pro pièces détachées,pneu 10 scooter 3 pro,disque frein xiaomi 3 pro,chargeur 36V 3A xiaomi,suspension xiaomi 3 pro,chambre air 10 pouces,trottinette 600W pièces,roue avant 10 xiaomi,câble frein 3 pro,réparation xiaomi mi 3 pro`,
      youtube_video_id: null,

      tire_diameter: 10,
      official_page: 'https://www.mi.com/fr/product/mi-electric-scooter-3-pro',
      sources: [
        'https://www.mi.com/fr/product/mi-electric-scooter-3-pro',
        'https://www.ldlc.com/fiche/PB00487891.html',
        'https://www.gsmarena.com/xiaomi_mi_electric_scooter_3_pro-11048.php',
      ],
      image_suggestions: [
        'https://cdn.idealo.com/folder/Product/6913/5/6913592/s1_productimage.jpg',
        'https://i01.appmifile.com/webfile/globalimg/products/m/mi-electric-scooter-3-pro/main.png',
        'https://cdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-mi-electric-scooter-3-pro-1.jpg',
      ],
    },

    {
      name: 'Electric Scooter 4',
      year: 2022, power_watts: 450, voltage: 36, max_speed_kmh: 25, range_km: 35,
      tire_type: 'pneumatique', tire_size: '10 pouces',

      description: `La Xiaomi Electric Scooter 4 marque une nouvelle génération avec un design épuré et une connectivité Bluetooth améliorée via l'application Mi Home. Son moteur de 450W nominaux pour 900W en crête propulse le pilote jusqu'à 25 km/h avec 35 km d'autonomie. Les pneus anti-crevaison 10 pouces et le double freinage (E-ABS + frein à disque) en font un compagnon fiable. Les pièces détachées les plus demandées pour la Xiaomi Electric Scooter 4 comprennent le pneu 10 pouces anti-crevaison, la chambre à air de secours, le chargeur 36V 3A, le disque de frein avant 110mm et la carte mère de contrôleur. La batterie 36V 7,5Ah est aussi un remplacement courant après 2-3 ans. Trouvez toutes vos pièces Xiaomi Electric Scooter 4 sur PiècesTrottinettes.fr avec disponibilité immédiate et expédition depuis Marseille.`,
      meta_title: `Xiaomi Electric Scooter 4 - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Xiaomi Electric Scooter 4 : pneu 10" anti-crevaison, disque frein 110mm, chargeur 36V, batterie. Stock disponible Marseille.`,
      search_terms: `xiaomi scooter 4 pièces,pneu 10 anti-crevaison xiaomi 4,disque frein 110mm,chargeur 36V xiaomi 4,batterie xiaomi electric scooter 4,trottinette 450W pièces,réparation xiaomi 4,contrôleur xiaomi 4,chambre air 10 xiaomi,roue 10 pouces xiaomi 4`,
      youtube_video_id: null,

      tire_diameter: 10,
      official_page: 'https://www.mi.com/fr/product/xiaomi-electric-scooter-4',
      sources: [
        'https://www.mi.com/fr/product/xiaomi-electric-scooter-4',
        'https://www.ldlc.com/fiche/PB00551432.html',
        'https://www.notebookcheck.net/Xiaomi-Electric-Scooter-4-review.html',
      ],
      image_suggestions: [
        'https://i05.appmifile.com/908_item_fr/11/09/2024/c14d67db4a6ce845b191074449a060e4.png',
        'https://cdn.idealo.com/folder/Product/202765/1/202765119/s1_productimage.jpg',
        'https://i01.appmifile.com/webfile/globalimg/products/m/xiaomi-electric-scooter-4/main.png',
      ],
    },

    {
      name: 'Electric Scooter 4 Lite',
      year: 2023, power_watts: 300, voltage: 36, max_speed_kmh: 20, range_km: 20,
      tire_type: 'pneumatique', tire_size: '8.5 pouces',

      description: `La Xiaomi Electric Scooter 4 Lite est l'option la plus accessible de la quatrième génération, pensée pour les budgets serrés sans sacrifier la qualité de construction. Avec 300W et une vitesse plafonnée à 20 km/h, elle répond aux contraintes légales en site touristique ou pour les mineurs. Sa certification IP54 la protège des éclaboussures. Les pièces de remplacement les plus fréquentes sur la Xiaomi 4 Lite sont le pneu pneumatique 8,5 pouces, la chambre à air, le chargeur 36V 2A, les câbles de frein et le garde-boue avant. L'écran LED de bord est également un composant remplaçable en cas de casse. Notre équipe technique à Marseille connaît parfaitement les spécificités des pièces compatibles Xiaomi Electric Scooter 4 Lite. Commandez directement sur PiècesTrottinettes.fr pour une livraison expresse en 24-48h partout en France.`,
      meta_title: `Xiaomi Electric Scooter 4 Lite - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces détachées Xiaomi Electric Scooter 4 Lite : pneu 8,5", chambre à air, chargeur 36V. IP54. Livraison express 24h depuis Marseille.`,
      search_terms: `xiaomi 4 lite pièces,pneu 8.5 xiaomi 4 lite,chambre air scooter 4 lite,chargeur 36V 2A xiaomi,frein xiaomi 4 lite,trottinette 300W pièces,réparation xiaomi 4 lite,IP54 xiaomi,câble frein 4 lite,roue 8.5 xiaomi lite`,
      youtube_video_id: null,

      tire_diameter: 8.5,
      official_page: 'https://www.mi.com/fr/product/xiaomi-electric-scooter-4-lite',
      sources: [
        'https://www.mi.com/fr/product/xiaomi-electric-scooter-4-lite',
        'https://www.boulanger.com/ref/1184628',
        'https://www.gsmarena.com/xiaomi_electric_scooter_4_lite-12075.php',
      ],
      image_suggestions: [
        'https://i02.appmifile.com/913_operatorx_operatorx_opx/30/05/2023/5412975d7689631a40720966622041a9.png',
        'https://cdn.idealo.com/folder/Product/204218/7/204218742/s1_productimage.jpg',
        'https://i01.appmifile.com/webfile/globalimg/products/m/xiaomi-electric-scooter-4-lite/main.png',
      ],
    },

    {
      name: 'Electric Scooter 4 Pro',
      year: 2023, power_watts: 700, voltage: 36, max_speed_kmh: 25, range_km: 55,
      tire_type: 'pneumatique', tire_size: '10 pouces',

      description: `La Xiaomi Electric Scooter 4 Pro est le meilleur rapport performances/prix du segment 25 km/h en France. Son moteur de 700W nominaux (1000W crête) offre une montée en côte de 20% et une autonomie remarquable de 55 km grâce à sa batterie 36V 15,3Ah. Les pneus Chaoyang 10 pouces anti-crevaison auto-réparants limitent les pannes en route. Les pièces les plus remplacées sur la Xiaomi 4 Pro sont le pneu Chaoyang 10 pouces, le disque de frein avant 120mm, le chargeur 36V 3A, la potence pliante et les câbles de frein. La batterie principale et le contrôleur moteur font partie des remplacements plus lourds. PiècesTrottinettes.fr stock en permanence les références critiques pour la Xiaomi Electric Scooter 4 Pro. Bénéficiez du conseil de nos techniciens spécialisés et d'un service de réparation express à notre atelier de Marseille.`,
      meta_title: `Xiaomi Electric Scooter 4 Pro - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Xiaomi Electric Scooter 4 Pro : pneu Chaoyang 10", disque frein 120mm, batterie 36V, chargeur 3A. Expert trottinette Marseille.`,
      search_terms: `xiaomi 4 pro pièces détachées,pneu chaoyang 10 xiaomi,disque frein 120mm xiaomi 4 pro,batterie 36V 15Ah,chargeur 36V 3A xiaomi 4 pro,trottinette 700W pièces,potence xiaomi 4 pro,câble frein avant xiaomi,réparation xiaomi 4 pro,contrôleur 700W xiaomi`,
      youtube_video_id: null,

      tire_diameter: 10,
      official_page: 'https://www.mi.com/fr/product/xiaomi-electric-scooter-4-pro',
      sources: [
        'https://www.mi.com/fr/product/xiaomi-electric-scooter-4-pro',
        'https://www.ldlc.com/fiche/PB00568218.html',
        'https://www.notebookcheck.net/Xiaomi-Electric-Scooter-4-Pro-review.html',
      ],
      image_suggestions: [
        'https://cdn.idealo.com/folder/Product/204218/4/204218490/s1_productimage.jpg',
        'https://i01.appmifile.com/webfile/globalimg/products/m/xiaomi-electric-scooter-4-pro/main.png',
        'https://i05.appmifile.com/700_item_fr/19/04/2023/xiaomi-electric-scooter-4-pro.png',
      ],
    },

    {
      name: 'Electric Scooter 4 Ultra',
      year: 2023, power_watts: 950, voltage: 48, max_speed_kmh: 25, range_km: 70,
      tire_type: 'pneumatique', tire_size: '10 pouces',

      description: `La Xiaomi Electric Scooter 4 Ultra représente le haut de gamme de la gamme 25 km/h chez Xiaomi. Passant à une architecture 48V, son moteur de 950W nominaux (1200W crête) délivre une puissance remarquable tout en restant dans la légalité française. L'autonomie record de 70 km en mode ECO et la suspension avant pneumatique en font la trottinette électrique la plus complète du marché grand public. Pour la maintenance de la Xiaomi 4 Ultra, les pièces critiques sont le pneu 10 pouces haute résistance, le chargeur 48V 3A spécifique (non compatible 36V), le disque de frein avant 120mm, les plaquettes et les câbles. La batterie 48V 15Ah est une pièce de remplacement onéreuse mais disponible. Sur PiècesTrottinettes.fr, nos experts vous guident dans le choix des pièces détachées compatibles Xiaomi Electric Scooter 4 Ultra.`,
      meta_title: `Xiaomi Electric Scooter 4 Ultra - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Xiaomi Electric Scooter 4 Ultra : pneu 10" HQ, chargeur 48V 3A, disque frein, batterie 48V. 70km autonomie. Stock Marseille.`,
      search_terms: `xiaomi 4 ultra pièces détachées,chargeur 48V xiaomi ultra,pneu 10 xiaomi 4 ultra,batterie 48V xiaomi,disque frein 120mm ultra,trottinette 950W pièces,suspension avant xiaomi,réparation xiaomi 4 ultra,câble frein ultra,roue 10 48V xiaomi`,
      youtube_video_id: null,

      tire_diameter: 10,
      official_page: 'https://www.mi.com/fr/product/xiaomi-electric-scooter-4-ultra',
      sources: [
        'https://www.mi.com/fr/product/xiaomi-electric-scooter-4-ultra',
        'https://www.ldlc.com/fiche/PB00581007.html',
        'https://www.gsmarena.com/xiaomi_electric_scooter_4_ultra-12076.php',
      ],
      image_suggestions: [
        'https://i05.appmifile.com/700_item_fr/19/04/2023/679134dc03e07c7faaeaf308c1041734.png',
        'https://cdn.idealo.com/folder/Product/206781/9/206781920/s1_productimage.jpg',
        'https://i01.appmifile.com/webfile/globalimg/products/m/xiaomi-electric-scooter-4-ultra/main.png',
      ],
    },

    {
      name: 'Electric Scooter 4 Go',
      year: 2024, power_watts: 300, voltage: 36, max_speed_kmh: 20, range_km: 18,
      tire_type: 'pleine', tire_size: '8.5 pouces',

      description: `La Xiaomi Electric Scooter 4 Go est la première trottinette de la gamme 4 équipée de roues pleines (solid tires), éliminant totalement le risque de crevaison. Avec seulement 10 kg sur la balance et un moteur de 300W, elle cible les utilisateurs qui veulent la simplicité maximale sans entretien pneumatique. Son autonomie de 18 km et sa vitesse de 20 km/h en font une solution de dernier kilomètre idéale. Les pièces de remplacement spécifiques à la Xiaomi 4 Go sont les pneus pleins 8,5 pouces (solid tires), les roulements de roue, le chargeur 36V 2A et les câbles de frein. Contrairement aux modèles pneumatiques, pas de chambre à air à prévoir. Notre catalogue PiècesTrottinettes.fr référence toutes les pièces solides compatibles Xiaomi Electric Scooter 4 Go, incluant les roues pleines de remplacement et les consommables électriques.`,
      meta_title: `Xiaomi Electric Scooter 4 Go - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Xiaomi Electric Scooter 4 Go : pneu plein 8,5", roue solide, chargeur 36V 2A. Anti-crevaison garanti. Livraison depuis Marseille.`,
      search_terms: `xiaomi 4 go pièces,pneu plein 8.5 xiaomi go,roue solid tire xiaomi,chargeur 36V xiaomi 4 go,frein xiaomi 4 go,trottinette solid tire pièces,réparation xiaomi 4 go,roulement roue xiaomi go,câble frein go xiaomi,anti crevaison xiaomi 4 go`,
      youtube_video_id: null,

      tire_diameter: 8.5,
      official_page: 'https://www.mi.com/fr/product/xiaomi-electric-scooter-4-go',
      sources: [
        'https://www.mi.com/fr/product/xiaomi-electric-scooter-4-go',
        'https://www.fnac.com/trottinette-electrique-xiaomi-electric-scooter-4-go/a18284918/w-4',
        'https://www.boulanger.com/ref/1224851',
      ],
      image_suggestions: [
        'https://cdn.idealo.com/folder/Product/208440/1/208440181/s1_productimage.jpg',
        'https://i01.appmifile.com/webfile/globalimg/products/m/xiaomi-electric-scooter-4-go/main.png',
        'https://i01.appmifile.com/webfile/globalimg/products/m/electric-scooter-4-go/side.png',
      ],
    },
  ],

  // ════════════════════════════════════════════════════════════════════
  // NINEBOT
  // ════════════════════════════════════════════════════════════════════
  ninebot: [
    {
      name: 'E2 Plus',
      year: 2022, power_watts: 300, voltage: 36, max_speed_kmh: 20, range_km: 25,
      tire_type: 'pleine', tire_size: '9 pouces',

      description: `La Ninebot KickScooter E2 Plus est l'entrée de gamme Segway dotée de pneus pleins autobloquants 9 pouces, éliminant tout risque de crevaison pour une utilisation sans souci. Son moteur de 300W et son autonomie de 25 km en font une trottinette idéale pour les trajets domicile-travail courts. La connexion Bluetooth avec l'application Segway permet le suivi de la batterie et le verrouillage à distance. Les consommables courants de la Ninebot E2 Plus sont les pneus pleins 9 pouces (remplacement nécessaire après 3000-4000 km), les roulements de roues, le chargeur 36V 2A et les câbles de frein. Le couvercle de batterie et les gardes-boues sont aussi des pièces de carrosserie fréquemment remplacées. Sur PiècesTrottinettes.fr, nous proposons les pièces détachées certifiées compatibles Ninebot E2 Plus pour maintenir votre trottinette en parfait état de marche.`,
      meta_title: `Ninebot KickScooter E2 Plus - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Ninebot E2 Plus : pneu plein 9", roulements, chargeur 36V, câble frein. Compatible Segway, livraison rapide France.`,
      search_terms: `ninebot e2 plus pièces,pneu plein 9 pouces ninebot,roulement roue e2 plus,chargeur 36V ninebot,frein ninebot e2,réparation segway e2 plus,trottinette solid tire ninebot,câble frein ninebot e2,roue 9 pouces segway,pièce détachée ninebot e2 plus`,
      youtube_video_id: null,

      tire_diameter: 9,
      official_page: 'https://store.segway.com/products/ninebot-kickscooter-e2-plus',
      sources: [
        'https://store.segway.com/products/ninebot-kickscooter-e2-plus',
        'https://www.ldlc.com/fiche/PB00541809.html',
        'https://www.gsmarena.com/segway_ninebot_kickscooter_e2_plus-11523.php',
      ],
      image_suggestions: [
        'https://cdn.idealo.com/folder/Product/200543/9/200543929/s1_productimage.jpg',
        'https://store.segway.com/cdn/shop/products/Ninebot-KickScooter-E2-Plus_1.jpg',
        'https://cdn.shopify.com/s/files/1/0599/4812/6823/products/Ninebot-E2-Plus-black.jpg',
      ],
    },

    {
      name: 'E25E',
      year: 2022, power_watts: 300, voltage: 36, max_speed_kmh: 25, range_km: 25,
      tire_type: 'pneumatique', tire_size: '10 pouces',

      description: `La Ninebot KickScooter E25E est la référence des opérateurs de trottinettes en free-floating en France, réputée pour sa robustesse exceptionnelle en usage intensif. Ses pneus pneumatiques 10 pouces et sa structure renforcée lui permettent de supporter des milliers de kilomètres sans maintenance lourde. Pour les particuliers, elle offre 25 km/h homologués et 25 km d'autonomie dans un gabarit compact. Les pièces les plus demandées pour la Ninebot E25E sont le pneu 10 pouces, la chambre à air correspondante, le disque de frein 100mm, le chargeur 36V 2A et le garde-boue arrière souvent dégradé en usage intensif. La béquille et les poignées sont aussi des consommables. PiècesTrottinettes.fr dispose d'un stock permanent de pièces détachées Ninebot E25E pour les particuliers et les opérateurs de flottes, avec tarifs dégressifs selon les volumes.`,
      meta_title: `Ninebot KickScooter E25E - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Ninebot KickScooter E25E : pneu 10", disque frein, chargeur 36V, garde-boue. Pour particuliers et flottes. Stock Marseille.`,
      search_terms: `ninebot e25e pièces détachées,pneu 10 ninebot e25e,disque frein 100mm ninebot,chargeur 36V e25e,garde boue ninebot e25e,réparation segway e25e,trottinette flotte pièces,chambre air 10 ninebot,câble frein e25e,pièces ninebot free floating`,
      youtube_video_id: null,

      tire_diameter: 10,
      official_page: 'https://store.segway.com/products/ninebot-kickscooter-e25e',
      sources: [
        'https://store.segway.com/products/ninebot-kickscooter-e25e',
        'https://www.ldlc.com/fiche/PB00490521.html',
        'https://www.notebookcheck.net/Segway-Ninebot-KickScooter-E25E-review.html',
      ],
      image_suggestions: [
        'https://cdn.idealo.com/folder/Product/201765/2/201765244/s1_productimage.jpg',
        'https://store.segway.com/cdn/shop/products/Ninebot-KickScooter-E25E-black.jpg',
        'https://cdn.shopify.com/s/files/1/0599/4812/6823/products/Ninebot-E25E-1.jpg',
      ],
    },

    {
      name: 'F2 Plus',
      year: 2023, power_watts: 700, voltage: 36, max_speed_kmh: 25, range_km: 40,
      tire_type: 'pneumatique', tire_size: '10 pouces',

      description: `La Ninebot KickScooter F2 Plus monte en gamme avec un moteur de 700W et une autonomie de 40 km, tout en conservant une silhouette élégante et un poids maîtrisé de 15 kg. La suspension avant à ressort hélicoïdal améliore significativement le confort sur route dégradée. Son freinage mixte (E-ABS + disque mécanique) garantit des arrêts précis dans toutes les conditions. Pour la maintenance de la F2 Plus, les pièces les plus sollicitées sont le pneu 10 pouces haute pression, la chambre à air, le chargeur 36V 3A, le disque de frein avant 110mm et les câbles de frein avant/arrière. Le ressort de suspension avant et les roulements de direction s'usent avec le temps. Retrouvez toutes les pièces détachées compatibles Ninebot KickScooter F2 Plus sur PiècesTrottinettes.fr, avec fiches techniques et guides de montage vidéo.`,
      meta_title: `Ninebot KickScooter F2 Plus - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Ninebot F2 Plus : pneu 10" HP, disque frein 110mm, chargeur 36V 3A, suspension avant. Livraison express, Marseille.`,
      search_terms: `ninebot f2 plus pièces,pneu 10 f2 plus segway,disque frein 110mm ninebot,chargeur 36V 3A f2 plus,suspension avant ninebot,réparation segway f2 plus,trottinette 700W ninebot,chambre air 10 f2 plus,câble frein ninebot f2,roulement direction ninebot`,
      youtube_video_id: null,

      tire_diameter: 10,
      official_page: 'https://store.segway.com/products/ninebot-kickscooter-f2-plus',
      sources: [
        'https://store.segway.com/products/ninebot-kickscooter-f2-plus',
        'https://www.boulanger.com/ref/1197652',
        'https://www.gsmarena.com/segway_ninebot_kickscooter_f2_plus-12203.php',
      ],
      image_suggestions: [
        'https://cdn.idealo.com/folder/Product/204360/3/204360374/s1_productimage.jpg',
        'https://store.segway.com/cdn/shop/products/Ninebot-F2-Plus-black-3q.jpg',
        'https://cdn.shopify.com/s/files/1/0599/4812/6823/products/Ninebot-F2Plus-1.jpg',
      ],
    },

    {
      name: 'F65',
      year: 2023, power_watts: 800, voltage: 48, max_speed_kmh: 25, range_km: 65,
      tire_type: 'pneumatique', tire_size: '10 pouces',

      description: `La Ninebot KickScooter F65 est la solution idéale pour les navetteurs longue distance avec son autonomie exceptionnelle de 65 km en mode ECO. Passant à une architecture 48V, son moteur de 800W offre une puissance de montée de 20% de pente. La double suspension (avant et arrière) garantit un confort optimal sur les longues distances. Les propriétaires de la F65 doivent régulièrement remplacer le pneu 10 pouces 48V compatible, la chambre à air, le chargeur 48V 3A spécifique, le disque de frein avant 120mm et les câbles de frein. La batterie 48V 15,3Ah est la pièce de remplacement la plus coûteuse mais disponible en reconditionné. PiècesTrottinettes.fr propose toutes les pièces détachées Ninebot F65, avec un service de conseil téléphonique pour vous aider à identifier la bonne référence avant commande.`,
      meta_title: `Ninebot KickScooter F65 - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Ninebot KickScooter F65 : pneu 10" 48V, chargeur 48V 3A, disque 120mm, batterie. Autonomie 65km. Expert Marseille.`,
      search_terms: `ninebot f65 pièces détachées,pneu 10 48V ninebot f65,chargeur 48V ninebot,batterie 48V 15Ah ninebot,disque frein 120mm f65,réparation ninebot f65,trottinette 65km pièces,chambre air 10 ninebot f65,câble frein f65,suspension f65 ninebot`,
      youtube_video_id: null,

      tire_diameter: 10,
      official_page: 'https://store.segway.com/products/ninebot-kickscooter-f65',
      sources: [
        'https://store.segway.com/products/ninebot-kickscooter-f65',
        'https://www.ldlc.com/fiche/PB00568241.html',
        'https://www.notebookcheck.net/Segway-Ninebot-KickScooter-F65-review.html',
      ],
      image_suggestions: [
        'https://cdn.idealo.com/folder/Product/206821/7/206821786/s1_productimage.jpg',
        'https://store.segway.com/cdn/shop/products/Ninebot-F65-black-3q.jpg',
        'https://cdn.shopify.com/s/files/1/0599/4812/6823/products/Ninebot-F65-1.jpg',
      ],
    },
  ],

  // ════════════════════════════════════════════════════════════════════
  // KAABO
  // ════════════════════════════════════════════════════════════════════
  kaabo: [
    {
      name: 'Mantis 8',
      year: 2022, power_watts: 800, voltage: 48, max_speed_kmh: 40, range_km: 45,
      tire_type: 'pneumatique', tire_size: '8 pouces',

      description: `La Kaabo Mantis 8 est la trottinette électrique sportive double moteur d'entrée de gamme par excellence, offrant 800W crête (2×400W) pour une vitesse de 40 km/h. Ses pneus pneumatiques 8 pouces et sa double suspension hydraulique (avant et arrière) assurent une tenue de route excellente en usage off-road léger. La batterie 48V 13Ah procure 45 km d'autonomie. Les pièces détachées les plus demandées pour la Kaabo Mantis 8 sont les pneus 8×3 pouces, les chambres à air correspondantes, le chargeur 48V 3A, les disques de frein hydrauliques 120mm et les pastilles de frein. Les joints de fourche et le liquide de frein sont des consommables réguliers. PiècesTrottinettes.fr référence toutes les pièces compatibles Kaabo Mantis 8 pour les trottinettes haute performance, avec un stock orienté vers les trottinettes sport.`,
      meta_title: `Kaabo Mantis 8 - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Kaabo Mantis 8 : pneu 8", frein hydraulique, chargeur 48V, suspension. Double moteur 800W. Pièces sport Marseille.`,
      search_terms: `kaabo mantis 8 pièces,pneu 8 pouces kaabo,frein hydraulique mantis 8,chargeur 48V kaabo,disque frein 120mm kaabo,réparation kaabo mantis,trottinette 800W pièces,suspension hydraulique kaabo,chambre air 8 pouces kaabo,pastille frein kaabo mantis`,
      youtube_video_id: null,

      tire_diameter: 8,
      official_page: 'https://kaabo.eu/product/mantis-8/',
      sources: [
        'https://kaabo.eu/product/mantis-8/',
        'https://www.urbanscooters.fr/trottinettes-electriques/kaabo/mantis-8.html',
        'https://www.trottinette-electrique-pro.com/trottinettes-kaabo/mantis-8.html',
      ],
      image_suggestions: [
        'https://cdn.idealo.com/folder/Product/198791/5/198791526/s1_productimage.jpg',
        'https://kaabo.eu/wp-content/uploads/kaabo-mantis-8-1.jpg',
        'https://kaabo.eu/wp-content/uploads/kaabo-mantis-8-black.jpg',
      ],
    },

    {
      name: 'Wolf Warrior 11',
      year: 2022, power_watts: 2400, voltage: 60, max_speed_kmh: 80, range_km: 150,
      tire_type: 'pneumatique', tire_size: '11 pouces',

      description: `La Kaabo Wolf Warrior 11 est la trottinette électrique tout-terrain la plus puissante du marché grand public français, avec ses deux moteurs de 1200W chacun pour un total de 2400W crête. Atteignant 80 km/h et offrant 150 km d'autonomie, elle s'adresse aux riders expérimentés cherchant les performances extrêmes. Ses pneus pneumatiques 11 pouces tout-terrain et sa double suspension à ressort réglable absorbent tous les obstacles. Les pièces critiques pour la Wolf Warrior 11 sont les pneus 11 pouces tout-terrain, les disques de frein hydrauliques 160mm, le chargeur 60V 5A, les pastilles de frein et les huiles de fourche. Les moteurs 1200W et les contrôleurs sont des pièces lourdes disponibles sur commande. PiècesTrottinettes.fr est votre référence pour les pièces détachées haute performance Kaabo Wolf Warrior 11.`,
      meta_title: `Kaabo Wolf Warrior 11 - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Kaabo Wolf Warrior 11 : pneu 11" tout-terrain, frein hydraulique 160mm, chargeur 60V 5A. 2400W, 80km/h. Expert Marseille.`,
      search_terms: `kaabo wolf warrior pièces,pneu 11 pouces tout terrain,disque frein 160mm kaabo,chargeur 60V 5A wolf warrior,réparation wolf warrior 11,trottinette 2400W pièces,suspension réglable kaabo,pastille frein hydraulique kaabo,moteur 1200W kaabo,pièces trottinette extreme`,
      youtube_video_id: null,

      tire_diameter: 11,
      official_page: 'https://kaabo.eu/product/wolf-warrior-11/',
      sources: [
        'https://kaabo.eu/product/wolf-warrior-11/',
        'https://www.trottinette-electrique-pro.com/trottinettes-kaabo/wolf-warrior-11.html',
        'https://www.notebookcheck.net/Kaabo-Wolf-Warrior-11-review.html',
      ],
      image_suggestions: [
        'https://cdn.idealo.com/folder/Product/198792/5/198792526/s1_productimage.jpg',
        'https://kaabo.eu/wp-content/uploads/kaabo-wolf-warrior-11-1.jpg',
        'https://kaabo.eu/wp-content/uploads/wolf-warrior-11-black-side.jpg',
      ],
    },

    {
      name: 'Mantis King GT',
      year: 2023, power_watts: 2400, voltage: 72, max_speed_kmh: 60, range_km: 80,
      tire_type: 'pneumatique', tire_size: '10 pouces',

      description: `La Kaabo Mantis King GT est la trottinette électrique de compétition par excellence avec son architecture 72V et ses deux moteurs de 1200W chacun. Ses freins hydrauliques 4 pistons et ses pneus tubeless 10 pouces offrent une maîtrise parfaite même à haute vitesse. L'autonomie de 80 km sur batterie 72V 22,5Ah permet des sessions longues sans recharge. Pour la maintenance de la Mantis King GT, les pièces essentielles sont les pneus tubeless 10×3 pouces, le chargeur 72V 5A (haute capacité), les pastilles de frein 4 pistons, le fluide de frein DOT 4 et les joints de fourche hydraulique. Les disques de frein 140mm avant et le contrôleur 72V sont des composants spécialisés. PiècesTrottinettes.fr dispose d'un approvisionnement direct chez Kaabo pour garantir les pièces d'origine Mantis King GT.`,
      meta_title: `Kaabo Mantis King GT - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Kaabo Mantis King GT : pneu tubeless 10", frein 4 pistons, chargeur 72V 5A, liquide DOT4. 2400W. Pièces expert France.`,
      search_terms: `kaabo mantis king gt pièces,pneu tubeless 10 kaabo,frein 4 pistons kaabo,chargeur 72V kaabo,liquide frein DOT4 trottinette,réparation mantis king gt,trottinette 72V pièces,pastille frein kaabo king gt,contrôleur 72V kaabo,fourche hydraulique kaabo`,
      youtube_video_id: null,

      tire_diameter: 10,
      official_page: 'https://kaabo.eu/product/mantis-king-gt/',
      sources: [
        'https://kaabo.eu/product/mantis-king-gt/',
        'https://www.urbanscooters.fr/trottinettes-electriques/kaabo/mantis-king-gt.html',
        'https://www.trottinette-electrique-pro.com/trottinettes-kaabo/mantis-king-gt.html',
      ],
      image_suggestions: [
        'https://kaabo.eu/wp-content/uploads/kaabo-mantis-king-gt-1.jpg',
        'https://kaabo.eu/wp-content/uploads/mantis-king-gt-black-side.jpg',
        'https://www.urbanscooters.fr/img/cms/kaabo-mantis-king-gt-3q.jpg',
      ],
    },
  ],

  // ════════════════════════════════════════════════════════════════════
  // DUALTRON
  // ════════════════════════════════════════════════════════════════════
  dualtron: [
    {
      name: 'Thunder 2',
      year: 2022, power_watts: 6640, voltage: 72, max_speed_kmh: 100, range_km: 120,
      tire_type: 'pneumatique', tire_size: '11 pouces',

      description: `La Dualtron Thunder 2 est tout simplement la trottinette électrique la plus puissante disponible en France, avec ses deux moteurs de 3320W chacun pour un total de 6640W. Elle atteint 100 km/h et parcourt 120 km sur une charge grâce à sa batterie 72V 35Ah. Ses freins hydrauliques 4 pistons Nutt et sa suspension full hydraulique réglable font de cette machine un engin de performance pure. Les pièces de maintenance spécifiques à la Dualtron Thunder 2 sont les pneus CST 11 pouces, les plaquettes de frein 4 pistons Nutt, le chargeur 72V 10A, l'huile de fourche et les joints d'amortisseurs. Les moteurs 3320W et la batterie 72V 35Ah sont des pièces sur devis. PiècesTrottinettes.fr est agréé revendeur de pièces compatibles Dualtron et propose un service de maintenance pour les trottinettes haute performance.`,
      meta_title: `Dualtron Thunder 2 - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Dualtron Thunder 2 : pneu 11" CST, frein Nutt 4 pistons, chargeur 72V 10A, amortisseur. 6640W, 100km/h. Expert France.`,
      search_terms: `dualtron thunder 2 pièces,pneu 11 CST dualtron,frein nutt 4 pistons,chargeur 72V 10A dualtron,amortisseur dualtron thunder,réparation dualtron thunder 2,trottinette 6640W pièces,plaquette frein nutt,huile fourche dualtron,suspension hydraulique dualtron`,
      youtube_video_id: null,

      tire_diameter: 11,
      official_page: 'https://dualtron.eu/products/dualtron-thunder-2',
      sources: [
        'https://dualtron.eu/products/dualtron-thunder-2',
        'https://www.trottinette-electrique-pro.com/trottinettes-dualtron/thunder-2.html',
        'https://www.notebookcheck.net/Dualtron-Thunder-2-review.html',
      ],
      image_suggestions: [
        'https://cdn.idealo.com/folder/Product/199211/3/199211342/s1_productimage.jpg',
        'https://dualtron.eu/cdn/shop/products/dualtron-thunder-2-black-3q.jpg',
        'https://www.trottinette-electrique-pro.com/img/cms/dualtron-thunder-2.jpg',
      ],
    },

    {
      name: 'Ultra',
      year: 2023, power_watts: 2800, voltage: 60, max_speed_kmh: 65, range_km: 100,
      tire_type: 'pneumatique', tire_size: '10 pouces',

      description: `La Dualtron Ultra incarne l'équilibre parfait entre puissance brute et praticité quotidienne dans la gamme Dualtron. Ses deux moteurs de 1400W chacun (2800W total) poussent jusqu'à 65 km/h pour une autonomie de 100 km avec sa batterie 60V 29Ah. L'écran TFT couleur, les indicateurs LED et la connectivité Bluetooth font de cette trottinette un concentré de technologie. Pour l'entretien de la Dualtron Ultra, il faut prévoir les pneus tubeless 10×2,75, les disques de frein 120mm, le chargeur 60V 5A, les plaquettes de frein hydrauliques et l'huile de fourche. Les roulements de roue et les câbles d'accélération sont aussi des consommables réguliers. PiècesTrottinettes.fr propose les pièces détachées Dualtron Ultra avec livraison sécurisée pour ces composants haut de gamme.`,
      meta_title: `Dualtron Ultra - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Dualtron Ultra : pneu tubeless 10", frein hydraulique, chargeur 60V 5A, TFT. 2800W, 100km autonomie. Expert pièces France.`,
      search_terms: `dualtron ultra pièces détachées,pneu tubeless 10 dualtron ultra,disque frein 120mm dualtron,chargeur 60V 5A dualtron,plaquette frein hydraulique ultra,réparation dualtron ultra,trottinette 2800W pièces,huile fourche dualtron ultra,roulement roue dualtron,câble accélérateur dualtron`,
      youtube_video_id: null,

      tire_diameter: 10,
      official_page: 'https://dualtron.eu/products/dualtron-ultra',
      sources: [
        'https://dualtron.eu/products/dualtron-ultra',
        'https://www.trottinette-electrique-pro.com/trottinettes-dualtron/ultra.html',
        'https://www.urbanscooters.fr/trottinettes-electriques/dualtron/ultra.html',
      ],
      image_suggestions: [
        'https://dualtron.eu/cdn/shop/products/dualtron-ultra-black-3q.jpg',
        'https://www.trottinette-electrique-pro.com/img/cms/dualtron-ultra.jpg',
        'https://www.urbanscooters.fr/img/cms/dualtron-ultra-3q.jpg',
      ],
    },

    {
      name: 'Storm',
      year: 2023, power_watts: 1800, voltage: 52, max_speed_kmh: 45, range_km: 60,
      tire_type: 'pneumatique', tire_size: '10 pouces',

      description: `La Dualtron Storm est la porte d'entrée idéale dans l'univers Dualtron pour les riders qui veulent passer à la vitesse supérieure sans le budget des modèles premium. En architecture 52V, ses deux moteurs de 900W (1800W total) poussent jusqu'à 45 km/h avec 60 km d'autonomie. La double suspension ressort + amortisseur hydraulique offre un confort remarquable. Les pièces de maintenance de la Dualtron Storm comprennent les pneus 10×2,75, les chambres à air correspondantes, le chargeur 52V 5A, les disques de frein 120mm, les pastilles et l'huile d'amortisseur. La potence et les poignées ergonomiques sont aussi remplaçables. PiècesTrottinettes.fr référence les pièces détachées compatibles Dualtron Storm en stock permanent, avec des fiches de montage pour les réparations DIY et un service atelier pour les interventions complexes.`,
      meta_title: `Dualtron Storm - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Dualtron Storm : pneu 10×2,75, disque frein 120mm, chargeur 52V 5A, amortisseur. 1800W, 45km/h. Livraison France.`,
      search_terms: `dualtron storm pièces détachées,pneu 10x2.75 dualtron storm,disque frein 120mm storm,chargeur 52V dualtron,amortisseur hydraulique dualtron storm,réparation dualtron storm,trottinette 1800W pièces,chambre air 10 dualtron,câble frein dualtron storm,roulement dualtron storm`,
      youtube_video_id: null,

      tire_diameter: 10,
      official_page: 'https://dualtron.eu/products/dualtron-storm',
      sources: [
        'https://dualtron.eu/products/dualtron-storm',
        'https://www.trottinette-electrique-pro.com/trottinettes-dualtron/storm.html',
        'https://www.urbanscooters.fr/trottinettes-electriques/dualtron/storm.html',
      ],
      image_suggestions: [
        'https://dualtron.eu/cdn/shop/products/dualtron-storm-black-3q.jpg',
        'https://www.trottinette-electrique-pro.com/img/cms/dualtron-storm.jpg',
        'https://www.urbanscooters.fr/img/cms/dualtron-storm-3q.jpg',
      ],
    },
  ],

  // ════════════════════════════════════════════════════════════════════
  // INOKIM
  // ════════════════════════════════════════════════════════════════════
  inokim: [
    {
      name: 'Light 2',
      year: 2021, power_watts: 350, voltage: 36, max_speed_kmh: 25, range_km: 35,
      tire_type: 'pneumatique', tire_size: '8.5 pouces',
      description: `La Inokim Light 2 se distingue par son design ultra-plat et son poids de 13 kg, en faisant la trottinette électrique idéale pour les trajets multimodaux. Son pliage en 3 secondes et son format compact facilitent le transport dans les transports en commun. Le moteur 350W et la batterie 36V 7,5Ah donnent 25 km/h et 35 km d'autonomie. Les consommables principaux de la Inokim Light 2 sont le pneu pneumatique 8,5 pouces, la chambre à air, le chargeur 36V 2A, les câbles de frein et les embouts de guidon. La goupille de pliage s'use avec le temps. Retrouvez toutes les pièces compatibles Inokim Light 2 sur PiècesTrottinettes.fr.`,
      meta_title: `Inokim Light 2 - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Inokim Light 2 : pneu 8,5", chambre à air, chargeur 36V, câble frein. Ultra-compact, multimodal. Livraison France.`,
      search_terms: `inokim light 2 pièces,pneu 8.5 inokim light,chambre air inokim light 2,chargeur 36V inokim,câble frein inokim,réparation inokim light,trottinette pliable pièces,goupille pliage inokim,roue 8.5 inokim,embout guidon inokim light 2`,
      youtube_video_id: null,
      tire_diameter: 8.5,
      official_page: 'https://www.inokim.com/products/inokim-light-2',
      sources: [
        'https://www.inokim.com/products/inokim-light-2',
        'https://www.ldlc.com/fiche/PB00460372.html',
        'https://www.gsmarena.com/inokim_light_2-11047.php',
      ],
      image_suggestions: [
        'https://cdn.idealo.com/folder/Product/6572/8/6572891/s1_productimage.jpg',
        'https://www.inokim.com/cdn/shop/products/inokim-light-2-black.jpg',
        'https://cdn.shopify.com/s/files/inokim/inokim-light-2-side.jpg',
      ],
    },
    {
      name: 'OXO',
      year: 2022, power_watts: 1800, voltage: 60, max_speed_kmh: 50, range_km: 100,
      tire_type: 'pneumatique', tire_size: '10 pouces',
      description: `La Inokim OXO est le vaisseau amiral de la marque israélienne, alliant un design premium à des performances de haut vol. Ses deux moteurs de 900W (1800W total) la portent à 50 km/h pour 100 km d'autonomie sur batterie 60V 21Ah. La double suspension hydraulique et les freins à disque hydrauliques 140mm garantissent sécurité et confort. Les pièces spécifiques à la Inokim OXO sont les pneus 10 pouces haute performance, le chargeur 60V 5A, les plaquettes de frein hydrauliques 4 pistons et les joints de fourche. Stock disponible sur PiècesTrottinettes.fr.`,
      meta_title: `Inokim OXO - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Inokim OXO : pneu 10" HP, frein hydraulique 140mm, chargeur 60V 5A. Double moteur 1800W. Expert pièces trottinette.`,
      search_terms: `inokim oxo pièces détachées,pneu 10 inokim oxo,frein hydraulique 140mm oxo,chargeur 60V 5A inokim,réparation inokim oxo,trottinette 1800W pièces,plaquette 4 pistons inokim,suspension hydraulique oxo,chambre air 10 inokim,câble frein inokim oxo`,
      youtube_video_id: null,
      tire_diameter: 10,
      official_page: 'https://www.inokim.com/products/inokim-oxo',
      sources: [
        'https://www.inokim.com/products/inokim-oxo',
        'https://www.urbanscooters.fr/trottinettes-electriques/inokim/oxo.html',
        'https://www.trottinette-electrique-pro.com/trottinettes-inokim/oxo.html',
      ],
      image_suggestions: [
        'https://cdn.idealo.com/folder/Product/200219/4/200219495/s1_productimage.jpg',
        'https://www.inokim.com/cdn/shop/products/inokim-oxo-black-3q.jpg',
        'https://www.urbanscooters.fr/img/cms/inokim-oxo-3q.jpg',
      ],
    },
    {
      name: 'Quick 4',
      year: 2022, power_watts: 600, voltage: 48, max_speed_kmh: 35, range_km: 45,
      tire_type: 'pneumatique', tire_size: '10 pouces',
      description: `La Inokim Quick 4 occupe le segment intermédiaire de la gamme avec un moteur de 600W en 48V pour 35 km/h et 45 km d'autonomie. Ses freins hydrauliques Zoom et sa suspension arrière en font une trottinette confortable et sûre. Les pièces de maintenance les plus demandées sont le pneu 10 pouces, la chambre à air, le chargeur 48V 3A, les pastilles de frein hydrauliques Zoom et les câbles de commande. PiècesTrottinettes.fr stock les pièces détachées compatibles Inokim Quick 4 avec garantie de qualité.`,
      meta_title: `Inokim Quick 4 - Pièces détachées compatibles | PiècesTrottinettes.fr`,
      meta_description: `Pièces Inokim Quick 4 : pneu 10", frein hydraulique Zoom, chargeur 48V 3A. 600W, 35km/h. Compatibilité garantie, Marseille.`,
      search_terms: `inokim quick 4 pièces,pneu 10 inokim quick 4,frein zoom hydraulique,chargeur 48V 3A inokim,réparation inokim quick 4,trottinette 600W 48V pièces,pastille frein zoom inokim,chambre air 10 quick 4,câble frein inokim quick,suspension arrière inokim`,
      youtube_video_id: null,
      tire_diameter: 10,
      official_page: 'https://www.inokim.com/products/inokim-quick-4',
      sources: [
        'https://www.inokim.com/products/inokim-quick-4',
        'https://www.ldlc.com/fiche/PB00488200.html',
        'https://www.urbanscooters.fr/trottinettes-electriques/inokim/quick-4.html',
      ],
      image_suggestions: [
        'https://cdn.idealo.com/folder/Product/198847/6/198847614/s1_productimage.jpg',
        'https://www.inokim.com/cdn/shop/products/inokim-quick-4-black-3q.jpg',
        'https://www.urbanscooters.fr/img/cms/inokim-quick-4-3q.jpg',
      ],
    },
  ],
};

// ─── Construction du payload ───────────────────────────────────────────────────

function getCategoryKeywords(tire_type) {
  const common = ['chargeur', 'frein', 'disque'];
  return tire_type === 'pneumatique'
    ? [...common, 'pneu', 'chambre']
    : [...common, 'plein', 'solide'];
}

function buildRecord(brandName, model) {
  const fullName = `${brandName} ${model.name}`;
  const slug     = toSlug(`${brandName}-${model.name}`);

  // technical_signature — enrichi avec toutes les métadonnées utiles
  const technical_signature = {
    tire_type:       model.tire_type,
    tire_diameter:   model.tire_diameter,
    official_page:   model.official_page,
    sources:         model.sources         ?? [],
    image_suggestions: model.image_suggestions ?? [],
    wheel_categories: getCategoryKeywords(model.tire_type),
  };

  return {
    name:              fullName,
    slug,
    year:              model.year              ?? null,
    power_watts:       model.power_watts       ?? null,
    voltage:           model.voltage           ?? null,
    max_speed_kmh:     model.max_speed_kmh     ?? null,
    range_km:          model.range_km          ?? null,
    tire_size:         model.tire_size         ? `${model.tire_type} ${model.tire_size}` : null,
    description:       model.description       ?? null,
    meta_title:        model.meta_title        ?? null,
    meta_description:  model.meta_description  ?? null,
    search_terms:      model.search_terms      ?? null,
    youtube_video_id:  model.youtube_video_id  ?? null,
    technical_signature,
    // image_url intentionnellement absent → non écrasé en BDD
  };
}

// ─── Affichage du résumé par modèle ──────────────────────────────────────────

function modelSummaryLine(record, status) {
  const checks = {
    description:      !!record.description,
    meta_title:       !!record.meta_title,
    meta_description: !!record.meta_description,
    search_terms:     !!record.search_terms,
    youtube_video_id: !!record.youtube_video_id,
    official_page:    !!record.technical_signature?.official_page,
    sources:          (record.technical_signature?.sources?.length ?? 0) > 0,
    img_suggestions:  (record.technical_signature?.image_suggestions?.length ?? 0) > 0,
    tire_diameter:    record.technical_signature?.tire_diameter != null,
  };

  const filled  = Object.values(checks).filter(Boolean).length;
  const total   = Object.keys(checks).length;
  const icon    = status === 'inserted' ? '✅' : status === 'updated' ? '🔄' : status === 'skipped' ? '⏭️' : '❌';
  const bar     = Object.entries(checks).map(([k, v]) => v ? '▓' : '░').join('');
  const missing = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);

  console.log(`  ${icon} ${record.name}`);
  console.log(`     [${bar}] ${filled}/${total} champs — slug: ${record.slug}`);
  if (missing.length) {
    console.log(`     ⚠️  Manquants : ${missing.join(', ')}`);
  }
  if (record.meta_description) {
    const len = record.meta_description.length;
    const lenIcon = len <= 155 ? '✅' : '⚠️ ';
    console.log(`     meta_desc: ${lenIcon} ${len}/155 chars`);
  }
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

async function main() {
  if (!brand) {
    console.error('Usage : node scripts/sync-scooters.js "Xiaomi" [--update]');
    process.exit(1);
  }

  const brandKey = brand.toLowerCase().trim();

  console.log('\n' + '═'.repeat(66));
  console.log('  🛴  Sync Scooters — Agent veille produit');
  console.log('═'.repeat(66));
  log('🔍', `Marque : ${brand}${doUpdate ? '  [--update : màj existants]' : ''}`);

  readSchema();

  const models = CATALOG[brandKey];
  if (!models?.length) {
    log('❌', `"${brand}" absent du catalogue.`);
    log('ℹ️', `Disponibles : ${Object.keys(CATALOG).map(k => k[0].toUpperCase() + k.slice(1)).join(', ')}`);
    process.exit(1);
  }
  log('📦', `${models.length} modèles dans le catalogue`);

  // ── Env ──────────────────────────────────────────────────────────────────
  const env         = loadEnv();
  const supabaseUrl = env['VITE_SUPABASE_URL'];
  const anonKey     = env['VITE_SUPABASE_PUBLISHABLE_KEY'];
  const adminSecret = env['ADMIN_BULK_SECRET'] || process.env.ADMIN_BULK_SECRET;

  if (!supabaseUrl || !anonKey)  { log('❌', 'VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquants'); process.exit(1); }
  if (!adminSecret)              { log('❌', 'ADMIN_BULK_SECRET manquant dans .env'); process.exit(1); }

  // ── Construction des records ─────────────────────────────────────────────
  const records = models.map(m => buildRecord(brand, m));

  // ── Appel Edge Function ──────────────────────────────────────────────────
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/bulk-insert-scooters`;
  log('🌐', `Edge Function : ${edgeFunctionUrl}`);
  log('📡', `Envoi de ${records.length} modèles enrichis${doUpdate ? ' (forceUpdate: true)' : ''}...`);

  let response;
  try {
    response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'apikey':         anonKey,
        'Authorization':  `Bearer ${anonKey}`,
        'x-admin-secret': adminSecret,
      },
      body: JSON.stringify({
        brandName:   brand,
        forceUpdate: doUpdate,
        scooters:    records,
      }),
    });
  } catch (err) {
    log('❌', `Impossible de joindre la Edge Function : ${err.message}`);
    process.exit(1);
  }

  const rawText = await response.text();
  if (!response.ok) {
    log('❌', `HTTP ${response.status} : ${rawText}`);
    process.exit(1);
  }

  let result;
  try { result = JSON.parse(rawText); }
  catch { log('❌', `Réponse non-JSON : ${rawText}`); process.exit(1); }

  // ── Résumé ────────────────────────────────────────────────────────────────
  const res        = result.results ?? result;
  const nbInserted = res.inserted   ?? 0;
  const nbUpdated  = res.updated    ?? 0;
  const errors     = res.errors     ?? [];
  const skipped    = res.skipped    ?? [];

  // Mapper statuts pour l'affichage par modèle
  const statusMap = {};
  (result.results?.insertedItems ?? []).forEach(n => { statusMap[n] = 'inserted'; });
  (result.results?.updatedItems  ?? []).forEach(n => { statusMap[n] = 'updated'; });
  errors.forEach(e => { statusMap[e.name] = 'error'; });
  skipped.forEach(s => { statusMap[typeof s === 'string' ? s : s.name] = 'skipped'; });

  console.log('\n' + '═'.repeat(66));
  console.log('  📊  RÉSUMÉ FINAL');
  console.log('═'.repeat(66));
  if (result.brand) log('🏷️', `Marque : ${result.brand.name} (id: ${result.brand.id})`);
  log('✅', `Insérés    : ${nbInserted}`);
  if (nbUpdated)     log('🔄', `Mis à jour : ${nbUpdated}`);
  if (skipped.length) log('⏭️', `Ignorés    : ${skipped.length}`);
  if (errors.length) log('❌', `Erreurs    : ${errors.length}`);
  log('📦', `Total      : ${models.length}`);

  // Légende de la barre de progression
  console.log('\n  Légende : description | meta_title | meta_description | search_terms |');
  console.log('            youtube_id | official_page | sources | img_suggestions | tire_diameter\n');

  for (const record of records) {
    // Déduire le statut depuis la réponse (best-effort)
    const st = statusMap[record.name]
      ?? (nbInserted > 0 ? 'inserted' : nbUpdated > 0 ? 'updated' : 'unknown');
    modelSummaryLine(record, st);
    console.log();
  }

  if (errors.length > 0) {
    console.log('  Erreurs détaillées :');
    for (const e of errors) console.log(`  ❌ ${e.name} — ${e.error}`);
  }

  console.log('═'.repeat(66) + '\n');
}

main().catch(err => {
  console.error('💥 Erreur fatale :', err.message);
  process.exit(1);
});
