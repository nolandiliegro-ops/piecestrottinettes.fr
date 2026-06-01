#!/usr/bin/env node
/**
 * scripts/audit-parts-images.mjs
 * Audit lecture seule des images de la table `parts` via l'API REST PostgREST.
 * La clé Supabase est lue depuis process.env.K (jamais hardcodée).
 *
 * Usage (PowerShell) :
 *   $env:K = "<publishable_key>"; node scripts/audit-parts-images.mjs
 */

const KEY = process.env.K;
if (!KEY) {
  console.error('❌ Variable d\'environnement K manquante (clé Supabase). Ex : $env:K = "<key>"');
  process.exit(1);
}

const BASE = 'https://kqsxscjtlipregkrmucg.supabase.co/rest/v1/parts';

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  Prefer: 'count=exact',
  Range: '0-0',
};

const queries = [
  ['total',                  '?select=id'],
  ['image_url non null',     '?select=id&image_url=not.is.null'],
  ['image_url non vide',     '?select=id&image_url=not.is.null&image_url=neq.'],
  ['image_url http',         '?select=id&image_url=like.http*'],
  ['images jsonb non vide',  '?select=id&images=neq.[]'],
];

async function getCount(path) {
  try {
    const res = await fetch(BASE + path, { method: 'GET', headers });
    const cr = res.headers.get('content-range');
    if (!res.ok) return `HTTP ${res.status} — ${cr ?? (await res.text()).slice(0, 80)}`;
    return cr ?? '(pas de Content-Range)';
  } catch (e) {
    return `ERR: ${e.message}`;
  }
}

for (const [label, path] of queries) {
  const cr = await getCount(path);
  console.log(`${label.padEnd(24)}: ${cr}`);
}
