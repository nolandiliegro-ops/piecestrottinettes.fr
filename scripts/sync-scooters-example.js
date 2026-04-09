#!/usr/bin/env node

/**
 * Exemple de script local pour insérer des trottinettes via l'Edge Function.
 *
 * Usage :
 *   export ADMIN_BULK_SECRET="ton-secret"
 *   export SUPABASE_URL="https://kqsxscjtlipregkrmucg.supabase.co"
 *   node scripts/sync-scooters-example.js
 *
 * Adapte le tableau `scooters` ci-dessous ou charge-le depuis une API / fichier JSON.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const ADMIN_BULK_SECRET = process.env.ADMIN_BULK_SECRET;

if (!SUPABASE_URL || !ADMIN_BULK_SECRET) {
  console.error("❌ Variables manquantes : SUPABASE_URL et ADMIN_BULK_SECRET requis");
  process.exit(1);
}

// --- Données à envoyer (à adapter) ---
// Champ image_url : URL d'une photo officielle du fabricant (vue 3/4 idéale)
const payload = {
  brandName: "Xiaomi",
  scooters: [
    {
      name: "Mi Electric Scooter 4 Pro",
      slug: "xiaomi-mi-electric-scooter-4-pro",
      image_url: "https://example.com/xiaomi-4-pro.png", // Photo officielle 3/4
      power_watts: 700,
      range_km: 55,
      max_speed_kmh: 25,
      voltage: 48,
      tire_size: "10 pouces",
      year: 2024,
      search_terms: "xiaomi 4 pro mi electric scooter",
    },
    {
      name: "Mi Electric Scooter 3",
      slug: "xiaomi-mi-electric-scooter-3",
      image_url: "https://example.com/xiaomi-3.png", // Photo officielle 3/4
      power_watts: 600,
      range_km: 30,
      max_speed_kmh: 25,
      voltage: 36,
      tire_size: "8.5 pouces",
      year: 2022,
      search_terms: "xiaomi 3 mi electric scooter m365",
    },
  ],
};

async function main() {
  const url = `${SUPABASE_URL}/functions/v1/bulk-insert-scooters`;

  console.log(`🚀 Envoi de ${payload.scooters.length} modèle(s) ${payload.brandName}...`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": ADMIN_BULK_SECRET,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("❌ Erreur:", data);
    process.exit(1);
  }

  console.log("✅ Résultat:", JSON.stringify(data, null, 2));
  console.log("⏳ En attente de validation admin — les modèles sont en brouillon (published=false)");
}

main().catch((err) => {
  console.error("❌ Erreur fatale:", err);
  process.exit(1);
});
