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

    const userPrompt = `Ta mission : trouve ${maxResults} URLs directes d'images pour ${query}.

Procédure obligatoire, suis ces étapes une par une.

ÉTAPE 1 : Fais 1 à 3 web_search avec ces requêtes :
- "${query}"
- "${query} site:weebot.fr OR site:mobilityurban.fr OR site:maxblinker.fr OR site:fnac.com"
- "${query} photo product"

ÉTAPE 2 : Dans les résultats de recherche, identifie les snippets qui mentionnent des images. Les URLs d'images se reconnaissent à leur extension .jpg .jpeg .png .webp.

ÉTAPE 3 : Si tu ne trouves pas directement des URLs d'images dans les snippets, cherche des URLs de pages produits e-commerce qui contiennent /product/ /produit/ /shop/ /trottinette/. Ces pages contiennent généralement des images <img src="..."> dans leur HTML.

ÉTAPE 4 : Pour chaque URL d'image trouvée, vérifie qu'elle :
- commence par https://
- se termine par .jpg .jpeg .png ou .webp (avant les paramètres ?)
- n'est PAS un placeholder, une icône ou un logo (largeur attendue minimum 600px)
- n'a PAS de paramètres d'authentification (?token= ou ?session=)

ÉTAPE 5 : Si vraiment tu n'arrives pas à trouver ${maxResults} URLs d'images directes, c'est OK : retourne ce que tu as trouvé, même 1 ou 2. Tu peux aussi proposer des URLs Unsplash en dernier recours, type https://images.unsplash.com/photo-...

FORMAT DE SORTIE OBLIGATOIRE :
Ta réponse finale doit être EXACTEMENT ce JSON, sans backticks, sans markdown, sans texte autour :
{"urls":["https://...","https://...","https://..."]}

Si vraiment AUCUNE URL trouvée :
{"urls":[]}`;

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
        max_tokens: 2048,
        temperature: 0,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
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

    // 2. Extraire TOUS les text blocks
    const textBlocks: string[] = (claudeData.content ?? [])
      .filter((c: { type: string; text?: string }) => c.type === 'text' && typeof c.text === 'string')
      .map((c: { text: string }) => c.text);

    if (textBlocks.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: 'parse_error', details: 'no text block in response' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    textBlocks.forEach((t, i) => log('text_block_content', `#${i}: ${t.slice(0, 800)}`));

    // 3. Parsing robuste : essayer plusieurs stratégies sur chaque bloc
    function tryExtractUrls(text: string): string[] | null {
      const md = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
      const obj = text.match(/\{[^{}]*"urls"[\s\S]*?\}/);
      const arr = text.match(/\[\s*"https?:\/\/[\s\S]*?"\s*\]/);
      const candidates: (string | null)[] = [
        md?.[1] ?? null,
        obj?.[0] ?? null,
        arr?.[0] ? `{"urls":${arr[0]}}` : null,
      ];
      for (const candidate of candidates) {
        if (!candidate) continue;
        try {
          const parsed = JSON.parse(candidate);
          const urls = Array.isArray(parsed) ? parsed : parsed.urls;
          if (Array.isArray(urls)) {
            const clean = urls.filter(
              (u): u is string => typeof u === 'string' && /^https?:\/\//.test(u),
            );
            if (clean.length > 0) return clean;
          }
        } catch { /* try next */ }
      }
      return null;
    }

    let candidateUrls: string[] | null = null;
    for (const t of textBlocks) {
      candidateUrls = tryExtractUrls(t);
      if (candidateUrls) break;
    }

    if (!candidateUrls) {
      // Cas légitime : Claude a explicitement renvoyé {"urls":[]}
      const emptySignal = textBlocks.some((t) => /"urls"\s*:\s*\[\s*\]/.test(t));
      if (emptySignal) {
        candidateUrls = [];
      } else {
        log('parse_error', `no JSON in any of ${textBlocks.length} blocks`);
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'parse_error',
            details: 'no parsable JSON in any text block',
            raw_preview: textBlocks.map((t) => t.slice(0, 200)),
          }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    candidateUrls = candidateUrls.slice(0, maxResults);
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
