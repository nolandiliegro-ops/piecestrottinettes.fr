#!/usr/bin/env node
/**
 * scripts/photos-galerie.mjs — galeries de 3+ photos détourées, avec garde-fou (16/10/2026).
 *
 * Entrée : config/photos/<lot>.json
 *   { "lot": "lot01", "models": [ { "id", "slug", "name", "brand", "candidates": [url, ...] } ] }
 *
 * --dry  : télécharge + détoure + contrôle chaque candidate, écrit
 *          out/<lot>/report.json et des planches JPEG (out/<lot>/planche-N.jpg). AUCUNE écriture.
 * --write --accept config/photos/<lot>.accept.json
 *          { "<slug>": [indexCandidate, ...] } dans l'ordre voulu (1er = photo principale).
 *          Rejoue détourage + contrôle : une photo qui ne passe plus est REFUSÉE (garde-fou),
 *          puis process-images reset (1re) + append (suivantes). Relit la base à la fin.
 *
 * Garde-fou (photoQcAll) : photo principale = aucun FAIL ; photos 2+ = gros plan toléré
 * (« produit coupé », « cadrage serré »), tout autre FAIL refusé (élément en plus, détourage sale…).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import sharp from 'sharp';
import { detoure } from './lib/detoure.js';
import { photoQcAll } from './lib/photo-qc.js';
import { empreinte, memePhoto } from './lib/empreinte.mjs';
import { juger } from './lib/photo-juge.mjs';
import { ameliorerEtJuger } from './lib/photo-qualite.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const MODE = args.includes('--write') ? 'write' : 'dry';
const APPEND = args.includes('--append'); // 17/10 : ajoute aux galeries existantes, jamais de remise à zéro
const LOT_FILE = resolve(ROOT, arg('--file') || '');
const lot = JSON.parse(readFileSync(LOT_FILE, 'utf-8'));
const OUT = resolve(ROOT, 'out', lot.lot);
mkdirSync(OUT, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const CLOSEUP_OK = new Set(['produit coupé / gros plan', 'cadrage serré']);

function download(url) {
  const buf = execFileSync('curl', ['-s', '-L', '--max-time', '40', '-A', UA, '-H', 'Accept: image/webp,image/jpeg,image/png,image/*;q=0.8,*/*;q=0.5', url], { maxBuffer: 64 * 1024 * 1024 });
  if (!buf || buf.length < 2000) throw new Error('téléchargement vide');
  return buf;
}

// Source déjà détourée proprement (coins transparents) : on la garde telle quelle.
async function alreadyCut(buf) {
  const meta = await sharp(buf).metadata();
  if (!meta.hasAlpha) return false;
  const { data, info } = await sharp(buf).resize(64, 64, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const a = (x, y) => data[(y * info.width + x) * 4 + 3];
  let t = 0;
  for (const [x, y] of [[0, 0], [63, 0], [0, 63], [63, 63], [32, 0], [0, 32], [63, 32], [32, 63]]) if (a(x, y) < 10) t++;
  return t >= 7;
}

async function cutout(url) {
  const raw = download(url);
  let png;
  if (await alreadyCut(raw)) png = await sharp(raw).png().toBuffer();
  else {
    const meta = await sharp(raw).metadata();
    const src = meta.hasAlpha ? await sharp(raw).flatten({ background: '#ffffff' }).png().toBuffer() : raw;
    const type = meta.format === 'png' || meta.hasAlpha ? 'image/png' : meta.format === 'webp' ? 'image/webp' : 'image/jpeg';
    png = await detoure(new Blob([src], { type }));
  }
  // recadrage sur le produit + marge 4 %, max 1600 px
  const trimmed = await sharp(png).trim({ threshold: 1 }).toBuffer().catch(() => png);
  const m = await sharp(trimmed).metadata();
  const pad = Math.round(Math.max(m.width, m.height) * 0.04);
  return sharp(trimmed).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
}

// Lot « genere » (25/10) : visuels techniques dessinés par scripts/visuel-technique.py (schéma coté = plusieurs morceaux par
// nature, le garde-fou photo les refuserait tous). Contrôle dédié : PNG à fond transparent, assez grand, URL de NOTRE dépôt.
async function genQc(png, url) {
  const m = await sharp(png).metadata();
  const reasons = [];
  if (!m.hasAlpha) reasons.push('pas de transparence');
  if (Math.max(m.width, m.height) < 600) reasons.push('trop petit');
  if (!/^https:\/\/raw\.githubusercontent\.com\/nolandiliegro-ops\/piecestrottinettes\.fr\//.test(url)) reasons.push('visuel généré hors dépôt');
  const verdict = reasons.length ? 'FAIL' : 'PASS';
  return { verdict, reasons, plus: { verdict }, width: m.width, height: m.height };
}
const qcFor = (png, url) => (lot.genere ? genQc(png, url) : photoQcAll(png));

function judge(qc, position) {
  if (qc.verdict !== 'FAIL') return { ok: true, why: qc.reasons };
  if (position === 0) return { ok: false, why: qc.reasons };
  const hard = qc.reasons.filter((r) => !CLOSEUP_OK.has(r) && !r.startsWith('petit élément') && !r.startsWith('couleurs') && !r.startsWith('basse') && !r.startsWith('produit minuscule'));
  return { ok: hard.length === 0 && qc.plus.verdict !== 'FAIL', why: qc.reasons };
}

// ─── planche : vignettes 220 px sur gris moyen (un résidu blanc ou un logo s'y voit) ───
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
async function tile(png, label, verdict) {
  const W = 220, H = 250;
  const color = verdict === 'PASS' ? '#2e7d32' : verdict === 'WARN' ? '#c79100' : '#c62828';
  const img = png ? await sharp(png).resize(208, 200, { fit: 'inside' }).png().toBuffer() : null;
  const meta = img ? await sharp(img).metadata() : null;
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="#9e9e9e"/><rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${color}" stroke-width="6"/>
    <rect x="0" y="${H - 44}" width="${W}" height="44" fill="#ffffff"/>
    <text x="6" y="${H - 27}" font-family="DejaVu Sans" font-size="13" font-weight="bold" fill="#000">${esc(label[0])}</text>
    <text x="6" y="${H - 9}" font-family="DejaVu Sans" font-size="11" fill="${color}">${esc(label[1])}</text></svg>`);
  const comp = [{ input: svg, top: 0, left: 0 }];
  if (img) comp.push({ input: img, top: 4 + Math.round((200 - meta.height) / 2), left: Math.round((W - meta.width) / 2) });
  return sharp({ create: { width: W, height: H, channels: 3, background: '#9e9e9e' } }).composite(comp).jpeg({ quality: 82 }).toBuffer();
}
async function planches(tiles) {
  const COLS = 8, ROWS = 6, W = 220, H = 250, per = COLS * ROWS;
  for (let p = 0; p * per < tiles.length; p++) {
    const part = tiles.slice(p * per, (p + 1) * per);
    const rows = Math.ceil(part.length / COLS);
    const comp = part.map((t, i) => ({ input: t, left: (i % COLS) * W, top: Math.floor(i / COLS) * H }));
    await sharp({ create: { width: COLS * W, height: rows * H, channels: 3, background: '#ffffff' } }).composite(comp).jpeg({ quality: 80 }).toFile(resolve(OUT, `planche-${p + 1}.jpg`));
  }
}

// 25/10 CHASSEUR : --juge ajoute au dry le juge vision (vue, refus) et l'anti-doublon contre la galerie EN LIGNE
// (m.current, fourni par scripts/chasseur-photos.mjs), montre la galerie en ligne en tête de chaque fiche, et écrit
// out/<lot>/proposition.json + out/<lot>/<lot>.accept.json (ce que l'append enverrait). Toujours AUCUNE écriture.
const JUGE_DRY = args.includes('--juge');
async function dry() {
  const report = [];
  const tiles = [];
  const proposition = {}, accept = {};
  for (const m of lot.models) {
    const enLigne = [];
    if (JUGE_DRY) for (let k = 0; k < (m.current || []).length; k++) {
      try { const b = download(m.current[k]); enLigne.push({ url: m.current[k], fp: await empreinte(await vignette(b)) }); tiles.push(await tile(b, [`${m.slug.slice(0, 26)} EN LIGNE ${k}`, k === 0 ? 'principale actuelle' : 'galerie actuelle'], 'WARN')); }
      catch (e) { tiles.push(await tile(null, [`${m.slug.slice(0, 26)} EN LIGNE ${k}`, `illisible ${e.message}`.slice(0, 34)], 'FAIL')); }
    }
    const retenus = [];
    for (let i = 0; i < (m.candidates || []).length; i++) {
      const url = m.candidates[i];
      let png = null, qc = null, err = null, juge = null, doublon = null;
      try { png = await cutout(url); qc = await qcFor(png, url); } catch (e) { err = e.message.slice(0, 120); }
      // 26/10 : qualité du détourage (nettoyage + recadrage + résolution) AVANT empreinte et juge, trottinettes seulement
      let qual = null;
      if (png && lot.entity !== 'part' && !lot.genere) { try { qual = await ameliorerEtJuger(png); png = qual.buf; } catch (e) { err = `qualité : ${e.message.slice(0, 80)}`; } }
      const verdict = err ? 'ERROR' : qc.verdict;
      let short = err ? err : (qc.reasons.join(' · ') || 'ok');
      if (JUGE_DRY && png && judge(qc, 1).ok) {
        const fp = await empreinte(await vignette(png));
        const hit = [...enLigne, ...retenus.map((r) => ({ url: `lot#${r.i}`, fp: r.fp }))].map((x) => ({ x, r: memePhoto(fp, x.fp) })).find((h) => h.r.doublon);
        if (hit) doublon = `${hit.r.raison} (${String(hit.x.url).slice(-28)})`;
        else if (qual?.refus) juge = { refus: true, motifs: qual.defauts, principale_ok: false, rang: 9 };
        else {
          try { const v = await juger(png); const pok = v.principale_ok && (!qual || qual.principale_ok); juge = { vue: v.vue, refus: v.refus, motifs: v.motifs, principale_ok: pok, rang: pok ? v.rang_principale : Math.max(2, v.rang_principale), note: [v.note, qual?.defauts?.join(', ')].filter(Boolean).join(' · ') }; }
          catch (e) { juge = { erreur: e.message.slice(0, 80) }; }
          if (juge && !juge.erreur && !juge.refus) retenus.push({ i, fp, juge, ok: verdict !== 'FAIL' });
        }
        short = doublon ? `DOUBLON ${doublon}` : juge?.erreur ? `juge : ${juge.erreur}` : juge.refus ? `REFUS ${juge.motifs.join(',')}` : `${juge.vue}${juge.principale_ok ? ' ★3/4 propre' : ''}`;
      }
      console.log(`${m.slug} #${i} ${verdict} ${short}`);
      report.push({ slug: m.slug, i, url, verdict, reasons: qc?.reasons || [], plus: qc?.plus || null, size: qc ? [qc.width, qc.height] : null, error: err, juge, doublon });
      const tv = err ? 'FAIL' : doublon || juge?.refus ? 'FAIL' : juge?.principale_ok ? 'PASS' : verdict === 'FAIL' ? 'WARN' : verdict;
      tiles.push(await tile(png, [`${m.slug.slice(0, 26)} #${i}`, `${short}`.slice(0, 34)], tv));
    }
    if (JUGE_DRY) {
      // Proposition : un 3/4 propre (s'il y en a un) en tête = nouvelle principale, puis d'autres vues DIFFÉRENTES,
      // jusqu'à 4 photos au total sur la fiche. Les vues de la galerie en ligne ne sont pas connues ici : l'anti-doublon
      // a déjà écarté les copies ; la planche est relue à l'œil avant tout envoi.
      const p34 = retenus.filter((r) => r.juge.principale_ok).sort((a, b) => a.juge.rang - b.juge.rang)[0] || null;
      const picks = p34 ? [p34] : [];
      const vues = new Set(picks.map((r) => r.juge.vue));
      // 25/10 (run 1) : le juge appelle « profil » un 3/4 léger, et ne distingue pas un 3/4 pris de l'autre côté →
      // 2 doublons d'angle sur 13 propositions. Les vues de côté (3/4 avant, 3/4 arrière, profil) comptent pour UNE seule.
      const COTE = new Set(['3/4 avant', '3/4 arriere', 'profil']);
      const famille = (v) => (COTE.has(v) ? 'cote' : v);
      const fam = new Set(picks.map((r) => famille(r.juge.vue)));
      for (const r of retenus) {
        if (picks.length + (m.current || []).length >= 4) break;
        if (picks.includes(r) || vues.has(r.juge.vue) || fam.has(famille(r.juge.vue))) continue;
        fam.add(famille(r.juge.vue));
        if (r.juge.vue === 'detail' && picks.length + (m.current || []).length >= 3) continue;
        // 25/10 (Nolan : « ce genre de roue, ça saute ») : un gros plan n'entre jamais sans une vue 3/4 propre trouvée dans
        // le même passage — sinon il peut finir seul sur la fiche (iScooter W12, Isinwheel H7 Pro).
        if (r.juge.vue === 'detail' && !p34) continue;
        picks.push(r); vues.add(r.juge.vue);
      }
      proposition[m.slug] = { id: m.id, published: m.published !== false, en_ligne: (m.current || []).length, nouvelle_principale: p34 ? p34.i : null, ajouts: picks.map((r) => ({ i: r.i, vue: r.juge.vue })), statut: p34 ? '3/4 trouvé' : retenus.length ? 'photos sans 3/4' : 'rien de valable' };
      if (picks.length) accept[m.slug] = picks.map((r) => r.i);
    }
  }
  writeFileSync(resolve(OUT, 'report.json'), JSON.stringify(report, null, 1));
  if (JUGE_DRY) {
    writeFileSync(resolve(OUT, 'proposition.json'), JSON.stringify(proposition, null, 1));
    writeFileSync(resolve(OUT, `${lot.lot}.accept.json`), JSON.stringify(accept, null, 1));
    writeFileSync(resolve(OUT, `${lot.lot}.json`), JSON.stringify(lot, null, 1));
    const st = Object.values(proposition);
    console.log(`::notice title=chasse ${lot.lot} (proposition)::${st.length} fiches · 3/4 trouvé ${st.filter((x) => x.nouvelle_principale !== null).length} · sans 3/4 ${st.filter((x) => x.statut === 'photos sans 3/4').length} · rien ${st.filter((x) => x.statut === 'rien de valable').length} · ${st.reduce((a, x) => a + x.ajouts.length, 0)} photos proposées`);
  }
  await planches(tiles);
  const c = (v) => report.filter((r) => r.verdict === v).length;
  console.log(`::notice title=photos ${lot.lot} (dry)::${report.length} candidates · PASS ${c('PASS')} · WARN ${c('WARN')} · FAIL ${c('FAIL')} · ERREUR ${c('ERROR')}`);
}


// ─── garde-fou anti-doublon (25/10) : jamais deux fois la même photo sur une fiche ───
// Compare chaque photo à envoyer aux photos DÉJÀ sur la fiche (en append) et aux photos déjà retenues dans ce lot.
// Les deux côtés passent par la même réduction (320 px) pour des empreintes comparables.
// même préparation des deux côtés : recadrage sur le produit (alpha) puis 320 px, transparence conservée
const vignette = async (buf) => {
  const t = await sharp(buf, { failOn: 'none' }).ensureAlpha().trim({ threshold: 1 }).png().toBuffer().catch(() => buf);
  return sharp(t, { failOn: 'none' }).ensureAlpha().resize(320, 320, { fit: 'inside' }).png().toBuffer();
};
async function empreintesEnLigne(env, entity, id, courant = null) {
  const table = entity === 'part' ? 'parts' : 'scooter_models';
  const r = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${table}?select=images&id=eq.${id}`, { headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}` } });
  const rows = await r.json();
  let urls;
  if (Array.isArray(rows) && rows.length === 1) urls = (rows[0].images || []).map((i) => (typeof i === 'string' ? i : i?.url)).filter(Boolean);
  // 25/10 chasseur : une fiche DÉPUBLIÉE n'est pas lisible par la clé publique (RLS) → on prend la galerie relevée en base
  // par le chasseur (lot.models[].current). process-images recompare de toute façon côté serveur (couche D).
  else if (Array.isArray(rows) && rows.length === 0 && Array.isArray(courant) && courant.length) { urls = courant; console.log(`garde-fou : fiche non lisible en public, galerie du lot utilisée (${courant.length} photo(s))`); }
  else throw new Error(`galerie illisible (${JSON.stringify(rows).slice(0, 80)})`);
  const out = [];
  for (const u of urls) {
    try { out.push({ url: u, fp: await empreinte(await vignette(download(u))) }); } catch (e) { console.log(`::warning title=garde-fou::photo en ligne illisible ${u.slice(-40)} (${e.message})`); }
  }
  return out;
}

async function write() {
  const accept = JSON.parse(readFileSync(resolve(ROOT, arg('--accept')), 'utf-8'));
  const env = Object.fromEntries(readFileSync(resolve(ROOT, '.env'), 'utf-8').split('\n').map((l) => l.match(/^([A-Z_]+)=["']?([^"'\r\n]*)/)).filter(Boolean).map((m) => [m[1], m[2]]));
  const URL_ = `${env.VITE_SUPABASE_URL}/functions/v1/process-images`;
  const out = [];
  for (const m of lot.models) {
    const picks = accept[m.slug];
    if (!Array.isArray(picks) || picks.length === 0) continue;
    const bufs = [];
    // garde-fou : empreintes déjà présentes (append) — en remplacement complet (write), seules comptent celles du lot
    let deja = [];
    if (APPEND && !lot.genere) {
      try { deja = await empreintesEnLigne(env, lot.entity, m.id, m.current); }
      catch (e) { console.log(`::warning title=GARDE-FOU ${m.slug}::${e.message} — fiche sautée par prudence`); out.push({ slug: m.slug, posted: 0, note: 'garde-fou : galerie illisible, rien envoyé' }); continue; }
    }
    for (const idx of picks) {
      const url = m.candidates[idx];
      try {
        let png = await cutout(url);
        const qc = await qcFor(png, url);
        const j = judge(qc, APPEND ? 1 : bufs.length);
        if (!j.ok) { console.log(`::warning title=REFUSÉ ${m.slug} #${idx}::${j.why.join(' · ')}`); continue; }
        if (!lot.genere) {
          const fp = await empreinte(await vignette(png));
          const res = deja.map((x) => ({ x, r: memePhoto(fp, x.fp) }));
          const proche = [...res].sort((a, b) => a.r.d - b.r.d)[0];
          if (proche) console.log(`garde-fou ${m.slug} #${idx} : plus proche ${String(proche.x.url).slice(-24)} dHash ${proche.r.d} silhouette ${proche.r.io?.toFixed(3)} couleur ${proche.r.c?.toFixed(1)}`);
          const hit = res.find((h) => h.r.doublon);
          if (hit) { console.log(`::warning title=DOUBLON ${m.slug} #${idx}::${hit.r.raison} — déjà sur la fiche (${String(hit.x.url).slice(-36)})`); continue; }
          deja.push({ url: `lot#${idx}`, fp });
        }
        // 25/10 VERROU trottinettes : juge vision (personne, téléphone, texte, 2e trott, décor = refusée).
        // En remplacement complet (write), la 1re photo envoyée doit être une vue 3/4 propre (= photo principale).
        if (lot.entity !== 'part' && !lot.genere) {
          let v;
          const qual = await ameliorerEtJuger(png);
          if (qual.refus) { console.log(`::warning title=QUALITÉ ${m.slug} #${idx}::${qual.defauts.join(', ')} — photo NON envoyée`); continue; }
          png = qual.buf;
          try { v = await juger(png); } catch (e) { console.log(`::warning title=JUGE ${m.slug} #${idx}::${e.message} — photo NON envoyée (verrou fermé)`); continue; }
          if (v.refus) { console.log(`::warning title=REFUSÉ juge ${m.slug} #${idx}::${v.motifs.join(', ')} (${v.vue})`); continue; }
          if (!APPEND && bufs.length === 0 && !(v.principale_ok && qual.principale_ok)) { console.log(`::warning title=PRINCIPALE ${m.slug} #${idx}::vue « ${v.vue} » : la 1re photo doit être un 3/4 propre — mets un 3/4 en tête du accept`); continue; }
        }
        bufs.push(png);
      } catch (e) { console.log(`::warning title=ERREUR ${m.slug} #${idx}::${e.message.slice(0, 120)}`); }
    }
    if (bufs.length === 0) { out.push({ slug: m.slug, posted: 0, note: 'aucune photo validée, galerie intacte' }); continue; }
    let posted = 0;
    for (let k = 0; k < bufs.length; k++) {
      const res = await fetch(URL_, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': env.ADMIN_BULK_SECRET },
        body: JSON.stringify({ entity_type: lot.entity === 'part' ? 'part' : 'scooter', entity_id: m.id, images_base64: [bufs[k].toString('base64')], alt_base: m.name, reset: !APPEND && k === 0 }),
      });
      const t = await res.text();
      // 25/10 : « success:true » ne suffit pas — la fonction répond succès avec processed_count 0 si l'upload n'a rien produit.
      let j = null; try { j = JSON.parse(t); } catch {}
      if (res.ok && j?.success === true && (j.processed_count ?? j.images?.length ?? 0) > 0) posted++;
      else { console.log(`::warning title=POST ${m.slug}::HTTP ${res.status} ${t.slice(0, 300)}`); if (k === 0) break; }
    }
    out.push({ slug: m.slug, posted, wanted: picks.length });
    console.log(`${m.slug} : ${posted}/${picks.length} photo(s) écrite(s)`);
  }
  writeFileSync(resolve(OUT, 'write.json'), JSON.stringify(out, null, 1));
  const tot = out.reduce((a, o) => a + o.posted, 0);
  console.log(`::notice title=photos ${lot.lot} (write)::${out.length} modèles · ${tot} photos écrites · ${out.filter((o) => o.posted < 3).length} modèles à moins de 3`);
}

(MODE === 'write' ? write() : dry()).catch((e) => { console.error(e); process.exit(1); });
