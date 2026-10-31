// Prix des offres « flux Awin » (31/10/2026, robot de prix — claude/robot-prix-31-10.md).
// mi.com rend ses prix en JavaScript : le robot de nuit (pg_net) ne les lit pas. Le flux produits Awin
// de Xiaomi FR (fid 98663) donne prix + stock chaque matin. Cette fonction le télécharge et passe les
// lignes trottinettes à public.apply_awin_feed_prices (mêmes règles que le robot : bornes, écart > 40 %,
// baisse sur 30 jours, prix recopié sur la fiche). Appelée chaque nuit par pg_cron (job « pt-prix-awin »).
// - Secret dédié : AWIN_FEED_KEY (clé de flux Awin, saisie par Nolan dans le coffre Lovable). Jamais renvoyée.
// - Actions : "ping" (version + présence du secret, rien n'est lu) · "apercu" (télécharge, rapproche, n'écrit rien,
//   rend aussi un échantillon de lignes du flux pour contrôle) · "ecrire" (défaut du cron).
// - Idempotente : une offre déjà relevée par le flux depuis moins de 6 h est sautée par la fonction SQL.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const VERSION = "sync-awin-prices@2026-10-31";
const FEEDS = [98663]; // Xiaomi FR. Ajouter ici un fid quand une offre d'un autre marchand passe en source_kind = 'awin_feed'.
const COLUMNS = ["merchant_deep_link", "product_name", "search_price", "in_stock", "is_for_sale"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// CSV avec guillemets (les descriptions contiennent des virgules et des retours à la ligne).
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

async function downloadFeed(key: string, fid: number) {
  const url = `https://productdata.awin.com/datafeed/download/apikey/${key}/fid/${fid}/format/csv/language/fr/delimiter/%2C/compression/gzip/columns/${COLUMNS.join("%2C")}/`;
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`flux ${fid} : http ${res.status}`); // l'URL (qui contient la clé) n'est jamais renvoyée
  const text = await new Response(res.body.pipeThrough(new DecompressionStream("gzip"))).text();
  const [head, ...lines] = parseCsv(text);
  const idx = Object.fromEntries(head.map((h, i) => [h.trim(), i]));
  return lines.filter((l) => l.length >= head.length).map((l) => ({
    url: l[idx.merchant_deep_link] ?? "",
    nom: l[idx.product_name] ?? "",
    prix: l[idx.search_price] ?? "",
    dispo: String(l[idx.in_stock] ?? "") === "1" && String(l[idx.is_for_sale] ?? "1") !== "0",
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  let action = "ecrire";
  try { action = ((await req.json())?.action ?? "ecrire") as string; } catch { /* corps vide = ecrire */ }
  const raw = Deno.env.get("AWIN_FEED_KEY");
  // La valeur peut être la clé seule ou le lien « Feed List Download » entier : on garde les 32 caractères hexa.
  const key = raw ? ((raw.match(/[0-9a-f]{32}/i) ?? [raw.trim()])[0]) : undefined;
  if (action === "ping") return json({ ok: true, version: VERSION, secret: Boolean(key) });
  if (action !== "apercu" && action !== "ecrire" && action !== "diag") return json({ ok: false, error: "ACTION_INCONNUE" }, 400);
  if (!key) return json({ ok: false, version: VERSION, error: "AWIN_FEED_KEY absent" }, 500);
  if (action === "diag") {
    // Diagnostic sans jamais renvoyer la clé : forme de la clé + codes HTTP des URL Awin.
    const k = key.trim();
    const st = async (u: string) => { try { const r = await fetch(u); await r.body?.cancel(); return r.status; } catch (e) { return (e as Error).message; } };
    const base = `https://productdata.awin.com/datafeed`;
    return json({
      ok: true, version: VERSION,
      cle: { longueur_brute: raw!.length, contient_cle_32: /[0-9a-f]{32}/i.test(raw!), cle_extraite_ok: /^[0-9a-f]{32}$/i.test(k), ressemble_a: /^https?:/.test(raw!.trim()) ? "lien" : /^[0-9a-f-]{36}$/i.test(raw!.trim()) ? "uuid" : "autre" },
      liste_flux: await st(`${base}/list/apikey/${k}`),
      flux_colonnes_courtes: await st(`${base}/download/apikey/${k}/fid/98663/format/csv/language/fr/delimiter/%2C/compression/gzip/columns/merchant_deep_link%2Cproduct_name%2Csearch_price%2Cin_stock/`),
      flux_sans_colonnes: await st(`${base}/download/apikey/${k}/fid/98663/format/csv/language/fr/delimiter/%2C/compression/gzip/`),
    });
  }

  const rows: { url: string; nom: string; prix: string; dispo: boolean }[] = [];
  const feeds: Record<string, number | string> = {};
  for (const fid of FEEDS) {
    try { const r = await downloadFeed(key, fid); feeds[fid] = r.length; rows.push(...r); }
    catch (e) { feeds[fid] = (e as Error).message; }
  }
  // On ne garde que les pages produit trottinettes (le flux Xiaomi compte ~850 produits).
  const scooters = rows.filter((r) => /\/product\/[^/?#]*scooter/i.test(r.url));

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await supabase.rpc("apply_awin_feed_prices", { p_rows: scooters, p_write: action === "ecrire" });
  if (error) return json({ ok: false, version: VERSION, feeds, error: error.message }, 500);

  const decisions = (data ?? []) as { decision: string }[];
  const resume: Record<string, number> = {};
  for (const d of decisions) resume[d.decision] = (resume[d.decision] ?? 0) + 1;
  return json({
    ok: true, version: VERSION, action, feeds, lignes_trottinettes: scooters.length, resume,
    detail: decisions,
    ...(action === "apercu" ? { echantillon: scooters.slice(0, 40).map((s) => ({ url: s.url.split("?")[0], nom: s.nom, prix: s.prix, dispo: s.dispo })) } : {}),
  });
});
