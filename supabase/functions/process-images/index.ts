// Edge Function: process-images
// Pipeline générique de détourage + upload pour scooters et pièces.
// Auth: x-admin-secret == ADMIN_BULK_SECRET (pas de JWT user).
// Provider de détourage isolé dans removeBackground() — swappable.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-admin-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_SECRET = Deno.env.get('ADMIN_BULK_SECRET');
const REMOVEBG_API_KEY = Deno.env.get('REMOVEBG_API_KEY');

const MAX_URLS = 4;
const MAX_BYTES = 12 * 1024 * 1024; // 12MB
const FETCH_TIMEOUT_MS = 15_000;
const GLOBAL_TIMEOUT_MS = 60_000;

// ===== PROVIDER ABSTRACTION =====
// SWAPPABLE: change provider here without touching the rest of the function.
async function removeBackground(imageBuffer: Uint8Array): Promise<Uint8Array> {
  const formData = new FormData();
  formData.append('image_file', new Blob([imageBuffer]));
  formData.append('size', 'auto');
  formData.append('format', 'png');

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-API-Key': REMOVEBG_API_KEY! },
    body: formData,
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Remove.bg API error: ${response.status} ${txt}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}
// ===== END PROVIDER ABSTRACTION =====

interface ProcessedImage {
  url: string;
  position: number;
  is_primary: boolean;
  alt: string;
}
interface FailedUrl {
  url: string;
  reason: string;
}

function log(step: string, msg: string, extra?: unknown) {
  console.log(`[process-images] ${step}: ${msg}`, extra ?? '');
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

async function checkSize(url: string): Promise<number | null> {
  try {
    const head = await fetchWithTimeout(url, 8_000, { method: 'HEAD' });
    const len = head.headers.get('content-length');
    return len ? parseInt(len, 10) : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'ADMIN_BULK_SECRET not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!REMOVEBG_API_KEY) {
    return new Response(JSON.stringify({ error: 'REMOVEBG_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { entity_type, entity_id, source_urls, alt_base } = body as {
      entity_type?: string;
      entity_id?: string;
      source_urls?: string[];
      alt_base?: string;
    };

    if (!['scooter', 'part'].includes(entity_type ?? '')) {
      return new Response(
        JSON.stringify({ error: 'entity_type must be "scooter" or "part"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!entity_id || typeof entity_id !== 'string') {
      return new Response(JSON.stringify({ error: 'entity_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!Array.isArray(source_urls) || source_urls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'source_urls must be non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const bucket = entity_type === 'scooter' ? 'scooter-photos' : 'part-images';
    const table = entity_type === 'scooter' ? 'scooter_models' : 'parts';
    const urls = source_urls.slice(0, MAX_URLS);
    const altBase = (alt_base ?? '').toString().slice(0, 100) || 'Image';

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const result: ProcessedImage[] = [];
    const failed: FailedUrl[] = [];
    const ts = Date.now();

    log('start', `entity=${entity_type} id=${entity_id} urls=${urls.length}`);

    let timedOut = false;

    for (let i = 0; i < urls.length; i++) {
      const srcUrl = urls[i];

      // Global timeout guard — break and mark remaining URLs as timed out.
      if (Date.now() - startTime > GLOBAL_TIMEOUT_MS) {
        log('timeout', `global ${GLOBAL_TIMEOUT_MS}ms exceeded at url[${i}]`);
        timedOut = true;
        for (let j = i; j < urls.length; j++) {
          failed.push({ url: urls[j], reason: 'global timeout reached' });
        }
        break;
      }

      try {
        log(`url[${i}]`, `processing ${srcUrl}`);

        // 1. HEAD check
        const size = await checkSize(srcUrl);
        if (size !== null && size > MAX_BYTES) {
          log(`url[${i}]`, `skip: size ${size} > ${MAX_BYTES}`);
          failed.push({ url: srcUrl, reason: `size > 12MB (${size} bytes)` });
          continue;
        }

        // 2. Fetch source
        const srcRes = await fetchWithTimeout(srcUrl, FETCH_TIMEOUT_MS);
        if (!srcRes.ok) {
          failed.push({ url: srcUrl, reason: `fetch failed: ${srcRes.status}` });
          continue;
        }
        const srcBuf = new Uint8Array(await srcRes.arrayBuffer());
        if (srcBuf.byteLength > MAX_BYTES) {
          failed.push({ url: srcUrl, reason: 'size > 12MB after download' });
          continue;
        }

        // 3. Remove background (provider isolé)
        const cleanedBuf = await removeBackground(srcBuf);
        log(`url[${i}]`, `bg removed, ${cleanedBuf.byteLength} bytes`);

        // 4. Upload Storage
        const path = `${entity_id}/${ts}_${i}.png`;
        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(path, cleanedBuf, { contentType: 'image/png', upsert: true });
        if (upErr) {
          failed.push({ url: srcUrl, reason: `upload error: ${upErr.message}` });
          continue;
        }

        // 5. Public URL
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        const publicUrl = pub.publicUrl;

        // 6. Push result
        const position = result.length;
        result.push({
          url: publicUrl,
          position,
          is_primary: position === 0,
          alt: `${altBase} - vue ${position + 1}`,
        });
        log(`url[${i}]`, `OK -> ${publicUrl}`);
      } catch (e) {
        const reason = (e as Error).message;
        log(`url[${i}]`, `ERROR ${reason}`);
        failed.push({ url: srcUrl, reason });
      }
    }

    // 7. Update table
    // NOTE: This UPDATE REPLACES the entire images array.
    // Previous images in storage become orphaned (not auto-deleted).
    // To append instead of replace, fetch current images first and merge.
    // Cleanup of orphaned storage files is out of scope for this function.
    if (result.length > 0) {
      const { error: dbErr } = await supabase
        .from(table)
        .update({ images: result })
        .eq('id', entity_id);
      if (dbErr) {
        log('db', `update failed: ${dbErr.message}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: `DB update failed: ${dbErr.message}`,
            processed_count: result.length,
            failed_count: failed.length,
            failed_urls: failed,
            images: result,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      log('db', `updated ${table}.images for ${entity_id}`);
    } else {
      log('db', 'no successful image, table not updated');
    }

    return new Response(
      JSON.stringify({
        success: !timedOut,
        processed_count: result.length,
        failed_count: failed.length,
        failed_urls: failed,
        images: result,
        ...(timedOut ? { error: 'global timeout reached' } : {}),
      }),
      {
        status: timedOut ? 504 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (e) {
    log('fatal', (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
