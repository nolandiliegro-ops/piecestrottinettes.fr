#!/usr/bin/env node
// scripts/_backfill-empreintes.mjs — remplit public.photo_empreintes pour TOUTES les fiches (25/10/2026).
// Appelle process-images en mode { backfill_fp: true } fiche par fiche : la fonction calcule l'empreinte de chaque
// photo sur l'ORIGINAL avec le cœur de production, et n'écrit QUE dans photo_empreintes (jamais dans les galeries).
// Idempotent : une photo déjà connue n'est pas recalculée. Lancé une fois après le déploiement du garde-fou.
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env', 'utf-8').split('\n').map((l) => l.match(/^([A-Z_]+)=["']?([^"'\r\n]*)/)).filter(Boolean).map((m) => [m[1], m[2]]));
const H = { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}` };
async function ids(table) { const out = []; for (let from = 0; ; from += 1000) { const r = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${table}?select=id,slug,images&order=slug`, { headers: { ...H, Range: `${from}-${from + 999}` } }); const p = await r.json(); if (!Array.isArray(p)) throw new Error(JSON.stringify(p).slice(0, 200)); out.push(...p.filter((x) => Array.isArray(x.images) && x.images.length)); if (p.length < 1000) break; } return out; }
const todo = [...(await ids('scooter_models')).map((x) => ({ ...x, t: 'scooter' })), ...(await ids('parts')).map((x) => ({ ...x, t: 'part' }))];
console.log(`${todo.length} fiches avec photos`);
let photos = 0, calc = 0, err = 0, k = 0;
async function one(x) {
  for (let essai = 0; essai < 3; essai++) {
    try {
      const r = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/process-images`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-secret': env.ADMIN_BULK_SECRET }, body: JSON.stringify({ entity_type: x.t, entity_id: x.id, backfill_fp: true }) });
      const j = await r.json();
      if (j?.backfill_fp !== true) throw new Error(`réponse inattendue ${r.status} ${JSON.stringify(j).slice(0, 120)}`);
      photos += j.empreintes; calc += j.calculees;
      // une fiche à plus de 8 photos sans empreinte se termine au passage suivant
      if (j.calculees >= 8) continue;
      return;
    } catch (e) { if (essai === 2) { err++; console.log(`::warning title=backfill ${x.slug}::${e.message}`); } await new Promise((r) => setTimeout(r, 1500)); }
  }
}
await Promise.all(Array.from({ length: 4 }, async () => { while (k < todo.length) { const x = todo[k++]; await one(x); } }));
console.log(`::notice title=backfill empreintes::${todo.length} fiches · ${photos} empreintes · ${calc} calculées · ${err} erreur(s)`);
process.exitCode = err ? 1 : 0;
