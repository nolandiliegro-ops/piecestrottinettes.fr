import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// GitHub repo cible (workflow_dispatch)
const GITHUB_OWNER = 'nolandiliegro-ops';
const GITHUB_REPO = 'piecestrottinettes.fr';
const WORKFLOW_FILE = 'weekly-watcher.yml';
const WORKFLOW_REF = 'main';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401);

    const userId = claims.claims.sub;

    // Vérifie role admin
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) return json({ error: 'Forbidden — admin only' }, 403);

    const PAT = Deno.env.get('GITHUB_PAT');
    if (!PAT) return json({ error: 'GITHUB_PAT not configured' }, 500);

    const body = await req.json().catch(() => ({}));
    const inputs: Record<string, string> = {
      reason: `admin UI trigger by ${claims.claims.email || userId}`,
      since_days: body.since_days != null ? String(body.since_days) : '',
      min_score: body.min_score != null ? String(body.min_score) : '',
      brands_filter: body.brands_filter || '',
      suppliers_filter: body.suppliers_filter || '',
    };

    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
    const ghRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${PAT}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: WORKFLOW_REF, inputs }),
    });

    if (ghRes.status !== 204) {
      const text = await ghRes.text();
      console.error('[trigger-watcher] GitHub dispatch failed', ghRes.status, text);
      return json({ error: 'GitHub dispatch failed', status: ghRes.status, details: text }, 502);
    }

    return json({
      success: true,
      message: 'Workflow dispatched. Le run apparaîtra dans l\'historique d\'ici 5–15s.',
      inputs,
    });
  } catch (e) {
    console.error('[trigger-watcher] error', e);
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
