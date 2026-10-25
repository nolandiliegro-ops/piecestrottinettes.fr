// Edge Function: process-images
// Pipeline générique de détourage + upload pour scooters et pièces.
// Auth: x-admin-secret == ADMIN_BULK_SECRET (pas de JWT user).
// Provider de détourage isolé dans removeBackground() — swappable.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import UPNG from 'npm:upng-js@2.1.0';
import jpeg from 'npm:jpeg-js@0.4.4';
import { empreinte, memePhoto, versStockage, depuisStockage, type Empreinte } from '../_shared/empreinte-core.ts';

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


// ===== GARDE-FOU ANTI-DOUBLON (25/10/2026) =====
// Règle de Nolan : JAMAIS deux fois la même photo sur une fiche. Chaque nouvelle image est comparée aux photos DÉJÀ sur
// la fiche (sauf reset) et aux images déjà retenues dans le même appel ; un doublon est refusé (failed_urls, reason
// « doublon: … »). Les variantes de couleur ne sont jamais des doublons (cœur partagé ../_shared/empreinte-core.ts,
// calibré sur les galeries publiées). Image non décodable (WebP…) ou erreur de calcul : on laisse passer (fail-open)
// et on le note dans les logs — le garde-fou ne doit jamais bloquer un import pour une raison technique.
function decodePixels(buf: Uint8Array): { width: number; height: number; data: Uint8Array } | null {
  try {
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      const img = UPNG.decode(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
      const rgba = UPNG.toRGBA8(img)[0];
      return { width: img.width, height: img.height, data: new Uint8Array(rgba) };
    }
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      const j = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 512 });
      return { width: j.width, height: j.height, data: j.data };
    }
  } catch (e) {
    log('garde-fou', `décodage impossible: ${(e as Error).message}`);
  }
  return null;
}
function empreinteDe(buf: Uint8Array): Empreinte | null {
  const px = decodePixels(buf);
  if (!px) return null;
  try { return empreinte(px); } catch (e) { log('garde-fou', `empreinte impossible: ${(e as Error).message}`); return null; }
}
// photos déjà sur la fiche : empreintes calculées sur l'ORIGINAL et stockées dans public.photo_empreintes
// (les miniatures render déforment les couleurs : 579/3 351 photos non reconnues face à leur propre miniature, 25/10).
// Une photo sans empreinte stockée est téléchargée et calculée ici, puis stockée (au plus MAX_LAZY par appel).
const MAX_LAZY = 8;
async function stockeEmpreinte(supabase: ReturnType<typeof createClient>, url: string, entityType: string, entityId: string, fp: Empreinte) {
  const { error } = await supabase.from('photo_empreintes').upsert({ url, entity_type: entityType, entity_id: entityId, ...versStockage(fp) }, { onConflict: 'url' });
  if (error) log('garde-fou', `stockage empreinte impossible: ${error.message}`);
}
async function empreintesFiche(supabase: ReturnType<typeof createClient>, table: string, entityType: string, entityId: string): Promise<{ list: { url: string; fp: Empreinte }[]; calculees: number }> {
  const { data: row } = await supabase.from(table).select('images').eq('id', entityId).maybeSingle();
  const urls = (Array.isArray(row?.images) ? row!.images : []).map((i: { url?: string } | string) => (typeof i === 'string' ? i : i?.url)).filter(Boolean) as string[];
  const out: { url: string; fp: Empreinte }[] = [];
  if (urls.length === 0) return { list: out, calculees: 0 };
  const { data: rows } = await supabase.from('photo_empreintes').select('url,hash,hist,mask,opaque').in('url', urls);
  const connues = new Map((rows ?? []).map((r: { url: string }) => [r.url, r]));
  let calculees = 0;
  for (const u of urls) {
    const r = connues.get(u) as Parameters<typeof depuisStockage>[0] | undefined;
    if (r) { out.push({ url: u, fp: depuisStockage(r) }); continue; }
    if (calculees >= MAX_LAZY) continue;
    try {
      const resp = await fetchWithTimeout(u, 15_000);
      if (!resp.ok) continue;
      const fp = empreinteDe(new Uint8Array(await resp.arrayBuffer()));
      if (!fp) continue;
      calculees++;
      out.push({ url: u, fp });
      await stockeEmpreinte(supabase, u, entityType, entityId, fp);
    } catch { /* photo illisible : ignorée */ }
  }
  return { list: out, calculees };
}
function chercheDoublon(fp: Empreinte | null, deja: { url: string; fp: Empreinte }[]) {
  if (!fp) return null;
  for (const x of deja) { const m = memePhoto(fp, x.fp); if (m.doublon) return { url: x.url, raison: m.raison as string }; }
  return null;
}
// ===== FIN GARDE-FOU =====

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'ADMIN_BULK_SECRET not configured' }), {
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

    const { entity_type, entity_id, source_urls, alt_base, images_base64, reset, check_only } = body as {
      entity_type?: string;
      entity_id?: string;
      source_urls?: string[];
      alt_base?: string;
      images_base64?: string[];
      reset?: boolean;
      check_only?: boolean; // 25/10 : vérification anti-doublon SEULE (aucun upload, aucune écriture)
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
    // Sélection bucket/table/alt — mutualisée entre les deux modes.
    const bucket = entity_type === 'scooter' ? 'scooter-photos' : 'part-images';
    const table = entity_type === 'scooter' ? 'scooter_models' : 'parts';
    const altBase = (alt_base ?? '').toString().slice(0, 100) || 'Image';

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ===== MODE VÉRIFICATION SEULE (25/10) =====
    // { check_only: true, images_base64: [...] } → pour chaque image : est-ce une photo déjà sur la fiche ?
    // Lecture pure : aucun upload, aucune écriture. Utilisé par l'admin avant un ajout manuel, et par le smoke-test.
    if (check_only === true) {
      const inputs = Array.isArray(images_base64) ? images_base64.slice(0, MAX_URLS) : [];
      const { list: deja, calculees } = await empreintesFiche(supabase, table, entity_type!, entity_id);
      const results: { index: number; doublon: boolean; raison?: string; deja_sur?: string; verifiable: boolean }[] = [];
      for (let i = 0; i < inputs.length; i++) {
        let buf: Uint8Array;
        try { const bin = atob(inputs[i]); buf = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) buf[k] = bin.charCodeAt(k); }
        catch { results.push({ index: i, doublon: false, verifiable: false }); continue; }
        const fp = empreinteDe(buf);
        const hit = chercheDoublon(fp, deja);
        results.push({ index: i, doublon: !!hit, verifiable: !!fp, ...(hit ? { raison: hit.raison, deja_sur: hit.url } : {}) });
        if (fp && !hit) deja.push({ url: `candidate[${i}]`, fp });
      }
      log('check_only', `entity=${entity_type} id=${entity_id} imgs=${inputs.length} deja=${deja.length} calculees=${calculees} doublons=${results.filter((r) => r.doublon).length}`);
      return new Response(
        JSON.stringify({ success: true, check_only: true, garde_fou: 'empreinte-core-2510', compared_with: deja.length, empreintes_calculees: calculees, results }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ===== MODE REMPLISSAGE DES EMPREINTES (25/10) =====
    // { backfill_fp: true } → calcule et stocke les empreintes manquantes des photos de la fiche. N'écrit QUE dans
    // public.photo_empreintes (jamais dans la galerie). Lancé une fois sur toutes les fiches, puis inutile (la fonction
    // stocke l'empreinte de chaque nouvelle photo).
    if ((body as { backfill_fp?: boolean }).backfill_fp === true) {
      const { list, calculees } = await empreintesFiche(supabase, table, entity_type!, entity_id);
      return new Response(
        JSON.stringify({ success: true, backfill_fp: true, garde_fou: 'empreinte-core-2510', empreintes: list.length, calculees }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ===== DÉTECTION DE MODE =====
    // images_base64 non-vide → NOUVEAU MODE "image déjà détourée" (pas de Remove.bg).
    // Sinon → comportement LEGACY (source_urls + removeBackground), strictement inchangé.
    const isPreCutMode = Array.isArray(images_base64) && images_base64.length > 0;

    // ===== NOUVEAU MODE : image déjà détourée (base64) =====
    if (isPreCutMode) {
      const inputs = (images_base64 ?? []).slice(0, MAX_URLS);
      const failed: FailedUrl[] = [];
      const newImages: { url: string }[] = [];
      const ts = Date.now();

      log(
        'start',
        `mode=precut entity=${entity_type} id=${entity_id} imgs=${inputs.length} reset=${reset === true}`,
      );

      // garde-fou : photos déjà sur la fiche (en append) — en reset, seules comptent celles de cet appel
      const deja = reset === true ? [] : (await empreintesFiche(supabase, table, entity_type!, entity_id)).list;
      let refusedDuplicates = 0;

      for (let i = 0; i < inputs.length; i++) {
        try {
          // 1. Décodage base64 → bytes. PAS de download, PAS de removeBackground().
          let buf: Uint8Array;
          try {
            const bin = atob(inputs[i]);
            buf = new Uint8Array(bin.length);
            for (let k = 0; k < bin.length; k++) buf[k] = bin.charCodeAt(k);
          } catch {
            failed.push({ url: `base64[${i}]`, reason: 'invalid base64' });
            continue;
          }

          // 2. Limite de taille (même borne que legacy, appliquée au Buffer décodé).
          if (buf.byteLength > MAX_BYTES) {
            failed.push({ url: `base64[${i}]`, reason: `size > 12MB (${buf.byteLength} bytes)` });
            continue;
          }

          // 2b. Garde-fou anti-doublon (25/10) : jamais deux fois la même photo sur la fiche.
          const fp = empreinteDe(buf);
          const hit = chercheDoublon(fp, deja);
          if (hit) {
            log(`base64[${i}]`, `REFUSÉ doublon (${hit.raison}) de ${hit.url}`);
            failed.push({ url: `base64[${i}]`, reason: `doublon: ${hit.raison} — déjà sur la fiche (${hit.url})` });
            refusedDuplicates++;
            continue;
          }
          if (!fp) log(`base64[${i}]`, 'garde-fou: image non vérifiable (format non décodable), acceptée');

          // 3. Upload Storage — même bucket/convention/contentType/upsert que legacy.
          const path = `${entity_id}/${ts}_${i}.png`;
          const { error: upErr } = await supabase.storage
            .from(bucket)
            .upload(path, buf, { contentType: 'image/png', upsert: true });
          if (upErr) {
            failed.push({ url: `base64[${i}]`, reason: `upload error: ${upErr.message}` });
            continue;
          }

          // 4. Public URL.
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
          newImages.push({ url: pub.publicUrl });
          if (fp) { deja.push({ url: pub.publicUrl, fp }); await stockeEmpreinte(supabase, pub.publicUrl, entity_type!, entity_id, fp); }
          log(`base64[${i}]`, `OK -> ${pub.publicUrl}`);
        } catch (e) {
          const reason = (e as Error).message;
          log(`base64[${i}]`, `ERROR ${reason}`);
          failed.push({ url: `base64[${i}]`, reason });
        }
      }

      // 5. Merge (APPEND ou RESET) + recalcul position/is_primary/alt sur le tableau FINAL.
      //    GARDE-FOU anti-perte de données : on ne touche PAS la colonne images
      //    si aucune nouvelle image n'a été uploadée (même esprit que legacy result.length > 0).
      let finalImages: ProcessedImage[] = [];
      if (newImages.length > 0) {
        let base: { url: string }[] = [];
        if (reset !== true) {
          // APPEND : on récupère le tableau images actuel de l'entité.
          const { data: row, error: selErr } = await supabase
            .from(table)
            .select('images')
            .eq('id', entity_id)
            .maybeSingle();
          if (selErr) {
            log('db', `select images failed: ${selErr.message}`);
            return new Response(
              JSON.stringify({
                success: false,
                error: `DB select failed: ${selErr.message}`,
                processed_count: 0,
                failed_count: failed.length,
                failed_urls: failed,
                images: [],
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
          }
          base = Array.isArray(row?.images) ? row.images : [];
        }

        const merged = [...base, ...newImages];
        finalImages = merged.map((img, idx) => ({
          url: img.url,
          position: idx,
          is_primary: idx === 0,
          alt: `${altBase} - vue ${idx + 1}`,
        }));

        const primaryUrl = (finalImages.find(im => im.is_primary) ?? finalImages[0])?.url ?? null;
        const { error: dbErr } = await supabase
          .from(table)
          .update({ images: finalImages, image_url: primaryUrl })
          .eq('id', entity_id);
        if (dbErr) {
          log('db', `update failed: ${dbErr.message}`);
          return new Response(
            JSON.stringify({
              success: false,
              error: `DB update failed: ${dbErr.message}`,
              processed_count: newImages.length,
              failed_count: failed.length,
              failed_urls: failed,
              images: finalImages,
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        log('db', `updated ${table}.images for ${entity_id} (${finalImages.length} total)`);
      } else {
        log('db', 'no successful image, table not updated (existing images preserved)');
      }

      return new Response(
        JSON.stringify({
          success: true,
          processed_count: newImages.length,
          failed_count: failed.length,
          failed_urls: failed,
          refused_duplicates: refusedDuplicates,
          garde_fou: 'empreinte-core-2510',
          images: finalImages,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    // ===== FIN NOUVEAU MODE — tout ce qui suit est le chemin LEGACY inchangé =====

    // Legacy nécessite Remove.bg : check déplacé ici (Option B) — n'impacte que ce mode.
    if (!REMOVEBG_API_KEY) {
      return new Response(JSON.stringify({ error: 'REMOVEBG_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!Array.isArray(source_urls) || source_urls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'source_urls must be non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const urls = source_urls.slice(0, MAX_URLS);
    const result: ProcessedImage[] = [];
    const failed: FailedUrl[] = [];
    const ts = Date.now();

    log('start', `entity=${entity_type} id=${entity_id} urls=${urls.length}`);

    let timedOut = false;
    const dejaLegacy: { url: string; fp: Empreinte }[] = [];

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

        // 3b. Garde-fou anti-doublon (25/10) : le mode legacy REMPLACE la galerie → comparaison aux images de cet appel.
        const fpL = empreinteDe(cleanedBuf);
        const hitL = chercheDoublon(fpL, dejaLegacy);
        if (hitL) {
          log(`url[${i}]`, `REFUSÉ doublon (${hitL.raison}) de ${hitL.url}`);
          failed.push({ url: srcUrl, reason: `doublon: ${hitL.raison} — même photo que ${hitL.url}` });
          continue;
        }

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
        if (fpL) { dejaLegacy.push({ url: srcUrl, fp: fpL }); await stockeEmpreinte(supabase, publicUrl, entity_type!, entity_id, fpL); }
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
      const primaryUrl = (result.find(im => im.is_primary) ?? result[0])?.url ?? null;
      const { error: dbErr } = await supabase
        .from(table)
        .update({ images: result, image_url: primaryUrl })
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
