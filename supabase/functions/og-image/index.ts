// Edge Function: og-image
// Images d'aperçu de lien (WhatsApp, Telegram, Messenger…) au gabarit « Vitrine » choisi par Nolan le 26/10/2026.
// Les images sont fabriquées par GitHub Actions (scripts/og/generate.mjs) et rangées dans le bucket public « og-images ».
//
// GET  ?k=<scooter|part|brand|category|page>&s=<slug>
//      → sert l'image <k>/<s>.jpg ; si elle n'existe pas encore (fiche toute neuve), sert page/default.jpg.
//      Aucune redirection : certaines messageries suivent mal les 302.
// POST { k, s, b64 } avec l'en-tête x-admin-secret == ADMIN_BULK_SECRET → dépose (ou remplace) l'image.
// Ne touche à aucune table, à aucun paiement.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_SECRET = Deno.env.get('ADMIN_BULK_SECRET');
const BUCKET = 'og-images';
const KINDS = new Set(['scooter', 'part', 'brand', 'category', 'page']);
const SLUG = /^[a-z0-9][a-z0-9-]{0,150}$/;
const MAX_BYTES = 1_500_000;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function lire(path: string): Promise<Uint8Array | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);

  if (req.method === 'GET' || req.method === 'HEAD') {
    if (url.searchParams.get('action') === 'ping') return json({ ok: true, version: 'og-image@2026-10-26a' });
    const k = url.searchParams.get('k') ?? '';
    const s = (url.searchParams.get('s') ?? '').toLowerCase();
    let img: Uint8Array | null = null;
    let source = 'fiche';
    if (KINDS.has(k) && SLUG.test(s)) img = await lire(`${k}/${s}.jpg`);
    if (!img) { img = await lire('page/default.jpg'); source = 'defaut'; }
    if (!img) return json({ error: 'aucune image' }, 404);
    return new Response(req.method === 'HEAD' ? null : img, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/jpeg',
        // Court sur l'image par défaut : la vraie image arrive à la prochaine génération.
        'Cache-Control': source === 'fiche' ? 'public, max-age=86400, s-maxage=86400' : 'public, max-age=3600',
        'X-Og-Source': source,
      },
    });
  }

  if (req.method === 'POST') {
    if (!ADMIN_SECRET) return json({ error: 'ADMIN_BULK_SECRET not configured' }, 500);
    if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) return json({ error: 'unauthorized' }, 401);
    let body: { k?: string; s?: string; b64?: string };
    try { body = await req.json(); } catch { return json({ error: 'json invalide' }, 400); }
    const k = body.k ?? '';
    const s = (body.s ?? '').toLowerCase();
    if (!KINDS.has(k) || !SLUG.test(s) || !body.b64) return json({ error: 'k, s ou b64 invalide' }, 400);
    let buf: Uint8Array;
    try { buf = Uint8Array.from(atob(body.b64), (c) => c.charCodeAt(0)); } catch { return json({ error: 'base64 invalide' }, 400); }
    if (buf.length < 2000 || buf.length > MAX_BYTES) return json({ error: `taille ${buf.length}` }, 400);
    if (buf[0] !== 0xff || buf[1] !== 0xd8) return json({ error: 'pas un JPEG' }, 400);
    const { error } = await supabase.storage.from(BUCKET).upload(`${k}/${s}.jpg`, buf, {
      contentType: 'image/jpeg', upsert: true, cacheControl: '86400',
    });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, path: `${k}/${s}.jpg`, bytes: buf.length });
  }

  return json({ error: 'méthode non permise' }, 405);
});
