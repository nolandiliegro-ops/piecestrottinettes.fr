// Edge Function admin-only — opérations internes pour Le Veilleur.
// Protégée par x-admin-secret == ADMIN_BULK_SECRET.
// Utilise SUPABASE_SERVICE_ROLE_KEY EN INTERNE uniquement (jamais exposée).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const restHeaders = () => ({
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
});

async function restSelect(table: string, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  const res = await fetch(url, { headers: restHeaders() });
  if (!res.ok) throw new Error(`select ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function restInsert(table: string, rows: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...restHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`insert ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function restUpdate(table: string, id: string, patch: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...restHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`update ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const provided = req.headers.get('x-admin-secret');
    const expected = Deno.env.get('ADMIN_BULK_SECRET');
    if (!expected || !provided || provided !== expected) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { action, payload = {} } = body || {};

    let result: unknown = null;

    switch (action) {
      case 'log_run_start': {
        const rows = await restInsert('watcher_runs', [{
          status: 'running',
          triggered_by: payload.triggered_by || 'cron',
          summary: {},
        }]);
        result = { run_id: rows[0].id };
        break;
      }
      case 'log_run_complete': {
        const { run_id, ...patch } = payload;
        if (!run_id) throw new Error('run_id required');
        await restUpdate('watcher_runs', run_id, patch);
        result = { ok: true };
        break;
      }
      case 'log_run_fail': {
        const { run_id, error_log, ...rest } = payload;
        if (!run_id) throw new Error('run_id required');
        await restUpdate('watcher_runs', run_id, {
          status: 'failed',
          error_log: error_log ? String(error_log).slice(0, 5000) : null,
          ...rest,
        });
        result = { ok: true };
        break;
      }
      case 'get_last_success_date': {
        const rows = await restSelect(
          'watcher_runs',
          'select=run_date&status=eq.success&order=run_date.desc&limit=1'
        );
        result = { run_date: rows[0]?.run_date || null };
        break;
      }
      case 'list_existing_slugs': {
        // table: 'scooter_models' | 'parts'
        const table = payload.table;
        if (!['scooter_models', 'parts'].includes(table)) {
          throw new Error('invalid table');
        }
        const rows = await restSelect(table, 'select=slug&limit=10000');
        result = { slugs: rows.map((r: { slug: string }) => r.slug).filter(Boolean) };
        break;
      }
      case 'list_existing_skus': {
        const rows = await restSelect('parts', 'select=sku&sku=not.is.null&limit=10000');
        result = { skus: rows.map((r: { sku: string }) => r.sku).filter(Boolean) };
        break;
      }
      default:
        return new Response(JSON.stringify({ error: `unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
