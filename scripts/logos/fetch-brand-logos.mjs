#!/usr/bin/env node
/**
 * scripts/logos/fetch-brand-logos.mjs — récolte des logos de marques (10/10/2026), 0 € d'API IA.
 * Lit config/logos-marques.json { slug: [domaines…] }, ouvre la page d'accueil officielle et télécharge :
 *   - l'ICÔNE carrée (apple-touch-icon, icônes du manifest ≥ 128 px) → <out>/<slug>-icon.<ext>
 *   - le LOGO d'en-tête (img/svg dont src/alt/class contient « logo ») → <out>/<slug>-logo.<ext>
 * Écrit <out>/_rapport.json. N'écrit RIEN en base : Claude choisit en regardant les fichiers.
 * Usage : node scripts/logos/fetch-brand-logos.mjs --out <dossier>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
const OUT = resolve(args[args.indexOf('--out') + 1] || 'logos');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(resolve('config/logos-marques.json'), 'utf-8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const get = async (url, ms = 15000) => {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' }, redirect: 'follow', signal: c.signal }); }
  finally { clearTimeout(t); }
};
const attr = (tag, name) => (tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i')) || [])[1];
const abs = (u, base) => { try { return new URL(u.replace(/&amp;/g, '&'), base).href; } catch { return null; } };
const pngSize = (buf) => (buf.length > 24 && buf.toString('ascii', 1, 4) === 'PNG') ? { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) } : null;
const extOf = (ct, url) => /svg/.test(ct) ? 'svg' : /png/.test(ct) ? 'png' : /webp/.test(ct) ? 'webp' : /jpe?g/.test(ct) ? 'jpg' : /icon/.test(ct) ? 'ico' : (url.split('?')[0].split('.').pop() || 'bin').slice(0, 4);

async function download(url) {
  try {
    const r = await get(url);
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || '';
    if (!/image|svg|octet/.test(ct) && !/\.(png|svg|webp|jpe?g|ico)(\?|$)/i.test(url)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 200) return null;
    return { buf, ext: extOf(ct, url), size: pngSize(buf), bytes: buf.length };
  } catch { return null; }
}

const report = {};
for (const [slug, domains] of Object.entries(cfg)) {
  report[slug] = { tried: [], icon: null, logo: null };
  for (const d of domains) {
    const home = `https://${d}/`;
    let html = '', base = home;
    try { const r = await get(home); base = r.url || home; html = r.ok ? await r.text() : ''; report[slug].tried.push(`${d} → ${r.status}`); }
    catch (e) { report[slug].tried.push(`${d} → ${e.name}`); continue; }
    if (!html) continue;
    // Icônes carrées
    const icons = [];
    for (const tag of html.match(/<link[^>]+>/gi) || []) {
      const rel = (attr(tag, 'rel') || '').toLowerCase();
      if (!/icon/.test(rel)) continue;
      const href = abs(attr(tag, 'href') || '', base); if (!href) continue;
      const sz = Number(((attr(tag, 'sizes') || '').match(/(\d+)x/) || [])[1] || (/apple/.test(rel) ? 180 : 0));
      icons.push({ href, sz: /\.svg/i.test(href) ? 999 : sz });
    }
    const man = (html.match(/<link[^>]+rel=["']manifest["'][^>]*>/i) || [])[0];
    if (man) {
      try {
        const mu = abs(attr(man, 'href'), base); const m = await (await get(mu)).json();
        for (const ic of m.icons || []) icons.push({ href: abs(ic.src, mu), sz: Number(String(ic.sizes || '').split('x')[0]) || 0 });
      } catch {}
    }
    icons.sort((a, b) => b.sz - a.sz);
    if (!report[slug].icon) for (const ic of icons.filter((i) => i.sz >= 128)) {
      const f = await download(ic.href); if (!f) continue;
      writeFileSync(resolve(OUT, `${slug}-icon.${f.ext}`), f.buf);
      report[slug].icon = { url: ic.href, ext: f.ext, declared: ic.sz, png: f.size, bytes: f.bytes }; break;
    }
    // Logo d'en-tête (wordmark)
    if (!report[slug].logo) {
      const imgs = (html.match(/<img[^>]+>/gi) || []).filter((t) => /logo/i.test(t)).slice(0, 4);
      for (const t of imgs) {
        const src = attr(t, 'src') || attr(t, 'data-src') || (attr(t, 'srcset') || '').split(/[ ,]/)[0];
        const u = src && !src.startsWith('data:') ? abs(src, base) : null; if (!u) continue;
        const f = await download(u); if (!f) continue;
        writeFileSync(resolve(OUT, `${slug}-logo.${f.ext}`), f.buf);
        report[slug].logo = { url: u, ext: f.ext, png: f.size, bytes: f.bytes }; break;
      }
    }
    if (report[slug].icon && report[slug].logo) break;
  }
  // Repli (10/10) : site qui bloque les robots → icône du domaine servie par Google (jusqu'à 256 px)
  if (!report[slug].icon && !report[slug].logo) for (const d of domains) {
    const u = `https://www.google.com/s2/favicons?domain=${d}&sz=256`;
    const f = await download(u);
    if (f && f.size && f.size.w >= 64) { writeFileSync(resolve(OUT, `${slug}-icon.${f.ext}`), f.buf); report[slug].icon = { url: u, ext: f.ext, png: f.size, bytes: f.bytes, repli: 'favicon Google' }; break; }
  }
  console.log(`${slug.padEnd(14)} icône ${report[slug].icon ? '✅' : '—'}  logo ${report[slug].logo ? '✅' : '—'}  (${report[slug].tried.join(' | ')})`);
}
writeFileSync(resolve(OUT, '_rapport.json'), JSON.stringify(report, null, 2));
