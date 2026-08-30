// One-shot : volumes part_compatibility par (confidence_level × type de reason),
// projetés sur la classification LOT 3. Lecture anon, paginé, zéro écriture.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = {};
for (const line of readFileSync(resolve(__dirname, '../.env'), 'utf-8').split('\n')) {
  const m = line.match(/^([^#=][^=]*)=["']?([^"'\r\n]*)["']?/);
  if (m) env[m[1].trim()] = m[2].trim();
}
const H = { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}` };

const PAGE = 1000;
const rows = [];
for (let from = 0; ; from += PAGE) {
  const r = await fetch(
    `${env.VITE_SUPABASE_URL}/rest/v1/part_compatibility?select=confidence_level,suggestion_reason&order=id&limit=${PAGE}&offset=${from}`,
    { headers: H },
  );
  if (!r.ok) { console.error(`HTTP ${r.status}: ${await r.text()}`); process.exit(1); }
  const page = await r.json();
  rows.push(...page);
  if (page.length < PAGE) break;
}

const reasonKind = (s) => s == null ? 'null' : s.startsWith('fitment:partial') ? 'fitment:partial' : s.startsWith('fitment:') ? 'fitment:' : 'texte(IA)';
const counts = {};
for (const r of rows) {
  const k = `${r.confidence_level} × ${reasonKind(r.suggestion_reason)}`;
  counts[k] = (counts[k] || 0) + 1;
}
console.log(`TOTAL: ${rows.length} lignes part_compatibility\n`);
for (const [k, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${k}`);

const classify = ({ confidence_level: c, suggestion_reason: s }) => {
  if (c === 'validated') return 'verified';
  if (s?.startsWith('fitment:') && !s.startsWith('fitment:partial')) return 'verified';
  if (c === 'high') return 'unverified';
  if (c === 'medium' && s?.startsWith('fitment:partial')) return 'unverified';
  return null;
};
const cls = { verified: 0, unverified: 0, masque: 0 };
for (const r of rows) cls[classify(r) ?? 'masque']++;
console.log(`\nClassification LOT 3 → ✅ verified=${cls.verified} · 🟡 unverified=${cls.unverified} · masqué=${cls.masque}`);
