/**
 * Le Veilleur — Helper d'accès au backend SANS service_role_key côté GitHub.
 * Toutes les opérations privilégiées passent par l'Edge Function
 * `watcher-internal-ops` protégée par x-admin-secret == ADMIN_BULK_SECRET.
 *
 * Les seuls secrets requis côté GitHub Actions :
 *   - SUPABASE_URL
 *   - ADMIN_BULK_SECRET
 *   - ANTHROPIC_API_KEY
 *   - RESEND_API_KEY
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ADMIN_SECRET = process.env.ADMIN_BULK_SECRET;

if (!SUPABASE_URL || !ADMIN_SECRET) {
  console.warn('[supabase-rest] SUPABASE_URL ou ADMIN_BULK_SECRET manquant — les appels échoueront.');
}

/**
 * Appelle l'Edge Function watcher-internal-ops (admin-only).
 */
async function callInternalOps(action, payload = {}) {
  const url = `${SUPABASE_URL}/functions/v1/watcher-internal-ops`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': ADMIN_SECRET,
    },
    body: JSON.stringify({ action, payload }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    throw new Error(`watcher-internal-ops[${action}] failed: ${res.status} ${text}`);
  }
  return json;
}

/**
 * Récupère la date de la dernière run success (pour le paramètre `since`).
 */
export async function getLastSuccessDate() {
  const r = await callInternalOps('get_last_success_date');
  return r.run_date;
}

/**
 * Crée une ligne watcher_runs (status=running) → retourne le run_id.
 */
export async function logRunStart(triggeredBy) {
  const r = await callInternalOps('log_run_start', { triggered_by: triggeredBy });
  return r.run_id;
}

/**
 * Met à jour une ligne watcher_runs avec le statut final + stats.
 */
export async function logRunComplete(runId, patch) {
  return callInternalOps('log_run_complete', { run_id: runId, ...patch });
}

/**
 * Marque une run comme failed.
 */
export async function logRunFail(runId, errorLog, extra = {}) {
  return callInternalOps('log_run_fail', { run_id: runId, error_log: errorLog, ...extra });
}

/**
 * Récupère tous les slugs existants pour déduplication (scooter_models | parts).
 */
export async function fetchExistingSlugs(table) {
  const r = await callInternalOps('list_existing_slugs', { table });
  return new Set(r.slugs);
}

/**
 * Récupère tous les SKU existants (parts).
 */
export async function fetchExistingSkus() {
  const r = await callInternalOps('list_existing_skus');
  return new Set(r.skus);
}

/**
 * Appelle une Edge Function publique (bulk-insert-*, retrigger-compatibility-matching)
 * via x-admin-secret. Aucune service_role_key transmise.
 */
export async function invokeEdgeFunction(functionName, body) {
  if (!ADMIN_SECRET) throw new Error('ADMIN_BULK_SECRET manquant');
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': ADMIN_SECRET,
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
