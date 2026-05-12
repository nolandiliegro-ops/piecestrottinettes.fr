// Edge Function: search-images-claude
// Recherche d'images via Claude API + web_search tool
// Auth: x-admin-secret == ADMIN_BULK_SECRET

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-admin-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const ADMIN_SECRET = Deno.env.get('ADMIN_BULK_SECRET');

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const HEAD_TIMEOUT_MS = 3_000;
const GLOBAL_TIMEOUT_MS = 55_000;

function log(step: string, msg: string, extra?: unknown) {
  console.log(`[search-images-claude] ${step}: ${msg}`, extra ?? '');
}

async function fetchWithTimeout(url: string, ms: number, init?: RequestInit) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function validateImageUrl(url: string): Promise<{
  url: string;
  ok: boolean;
  reason?: string;
  status?: number;
  contentType?: string;
}> {
  try {
    const res = await fetchWithTimeout(url, HEAD_TIMEOUT_MS, {
      method: 'HEAD',
      redirect: 'follow',
    });
    // consume body if any
    try { await res.body?.cancel(); } catch { /* ignore */ }
    const ct = res.headers.get('content-type') ?? '';
    if (res.status === 200 && ct.startsWith('image/')) {
      return { url, ok: true, status: 200, contentType: ct };
    }
    return {
      url,
      ok: false,
      status: res.status,
      contentType: ct,
      reason: `status=${res.status} ct=${ct}`,
    };
  } catch (e) {
    return { url, ok: false, reason: (e as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ ok: false, error: 'config_error', details: 'ANTHROPIC_API_KEY missing' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
  if (!ADMIN_SECRET) {
    return new Response(
      JSON.stringify({ ok: false, error: 'config_error', details: 'ADMIN_BULK_SECRET missing' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
  if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.query !== 'string' || !body.query.trim()) {
      return new Response(
        JSON.stringify({ ok: false, error: 'parse_error', details: 'query required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const query: string = body.query.trim().slice(0, 300);
    const minResults = Math.max(1, Math.min(5, Number(body.min_results) || 1));
    const maxResults = Math.max(minResults, Math.min(5, Number(body.max_results) || 3));

    log('start', `query="${query}" min=${minResults} max=${maxResults}`);

    const userPrompt = `Trouve ${maxResults} photos officielles haute qualité de ${query}.

Critères stricts :
- Vue de côté ou 3/4 du produit
- Largeur minimum 600px
- URLs DIRECTES vers fichiers image (.jpg, .jpeg, .png, .webp) — JAMAIS une page HTML
- Sites publics fiables : Unsplash, Wikipedia/Wikimedia, sites e-commerce ouverts (weebot.fr, mobility-urban.fr, maxblinker.fr, gyroroue-shop.fr), Amazon, sites de marques officielles
- EXCLURE : Pinterest, Instagram, Facebook, pages Google Images, URLs avec ?session= ou ?token=

Stratégie : utilise web_search pour trouver des pages produits, puis extrait les URLs <img src="..."> qui pointent vers des fichiers .jpg/.png/.webp directs (souvent dans /wp-content/uploads/, /media/, /cdn/, /images/).

Si tu ne trouves pas ${maxResults} URLs valides, renvoie celles que tu as (même 1 seule).
Si tu n'en trouves AUCUNE, renvoie {"urls":[]}.

IMPORTANT — Format de sortie :
Ta réponse finale DOIT être EXACTEMENT et UNIQUEMENT ce JSON brut, sans backticks, sans markdown, sans aucun texte avant ni après :
{"urls":["https://...","https://..."]}

Ne fais AUCUN commentaire, AUCUNE introduction, AUCUNE explication. Juste le JSON.`;

    // 1. Appel Claude API
    const claudeRes = await fetchWithTimeout(ANTHROPIC_URL, GLOBAL_TIMEOUT_MS, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (claudeRes.status === 429) {
      const txt = await claudeRes.text();
      log('rate_limited', txt.slice(0, 300));
      return new Response(
        JSON.stringify({ ok: false, error: 'rate_limited', details: 'Anthropic 429' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!claudeRes.ok) {
      const txt = await claudeRes.text();
      log('claude_error', `${claudeRes.status} ${txt.slice(0, 500)}`);
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'claude_api_error',
          details: `${claudeRes.status}: ${txt.slice(0, 300)}`,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const claudeData = await claudeRes.json();
    log('claude_raw', JSON.stringify(claudeData).slice(0, 500));
    log('claude_usage', JSON.stringify(claudeData.usage ?? {}));

    // 2. Extraire le DERNIER text block
    const textBlocks = (claudeData.content ?? []).filter((c: { type: string }) => c.type === 'text');
    if (textBlocks.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: 'parse_error', details: 'no text block in response' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const lastText: string = textBlocks[textBlocks.length - 1].text ?? '';

    // 3. Parse JSON
    const jsonMatch = lastText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      log('parse_error', `no JSON found in: ${lastText.slice(0, 300)}`);
      return new Response(
        JSON.stringify({ ok: false, error: 'parse_error', details: 'no JSON in text block' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    let parsed: { urls?: string[] };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return new Response(
        JSON.stringify({ ok: false, error: 'parse_error', details: (e as Error).message }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const candidateUrls = (parsed.urls ?? [])
      .filter((u): u is string => typeof u === 'string')
      .slice(0, maxResults);
    log('candidates', `${candidateUrls.length} urls`, candidateUrls);

    // 4. Validation HEAD parallèle
    const validations = await Promise.all(candidateUrls.map(validateImageUrl));
    validations.forEach((v) =>
      log('validate', `${v.ok ? 'OK' : 'KO'} ${v.url} ${v.reason ?? ''}`),
    );
    const validUrls = validations.filter((v) => v.ok).map((v) => v.url);

    const duration = Date.now() - startTime;

    if (validUrls.length < minResults) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'not_enough_valid_images',
          details: `got ${validUrls.length}, need ${minResults}`,
          query,
          tested_count: candidateUrls.length,
          valid_count: validUrls.length,
          duration_ms: duration,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        query,
        urls: validUrls,
        tested_count: candidateUrls.length,
        valid_count: validUrls.length,
        duration_ms: duration,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    const msg = (e as Error).message;
    log('fatal', msg);
    const isTimeout = msg.toLowerCase().includes('abort');
    return new Response(
      JSON.stringify({
        ok: false,
        error: isTimeout ? 'timeout' : 'internal_error',
        details: msg,
      }),
      {
        status: isTimeout ? 504 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
