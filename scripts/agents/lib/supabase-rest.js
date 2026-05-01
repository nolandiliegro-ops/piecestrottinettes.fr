/**
 * Le Veilleur — Helper Supabase REST (sans dépendance @supabase/supabase-js)
 * Utilise fetch natif pour rester portable dans GitHub Actions / Node 20+.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.warn('[supabase-rest] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant — les appels échoueront.');
}

const baseHeaders = () => ({
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
});

/**
 * GET /rest/v1/<table>?<query>
 */
export async function restSelect(table, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  const res = await fetch(url, { headers: baseHeaders() });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`restSelect ${table} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

/**
 * POST /rest/v1/<table>
 */
export async function restInsert(table, rows) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...baseHeaders(), 'Prefer': 'return=representation' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`restInsert ${table} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

/**
 * PATCH /rest/v1/<table>?id=eq.<id>
 */
export async function restUpdate(table, id, patch) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...baseHeaders(), 'Prefer': 'return=representation' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`restUpdate ${table} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

/**
 * Récupère tous les slugs existants pour une table donnée (déduplication).
 */
export async function fetchExistingSlugs(table) {
  const data = await restSelect(table, 'select=slug&limit=10000');
  return new Set(data.map((r) => r.slug).filter(Boolean));
}

/**
 * Appelle une Edge Function via x-admin-secret.
 */
export async function invokeEdgeFunction(functionName, body) {
  const adminSecret = process.env.ADMIN_BULK_SECRET;
  if (!adminSecret) throw new Error('ADMIN_BULK_SECRET manquant');
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    throw new Error(`invokeEdgeFunction ${functionName} failed: ${res.status} ${text}`);
  }
  return json;
}
