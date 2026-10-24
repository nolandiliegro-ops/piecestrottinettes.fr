// 24/10/2026 — « L'Atelier » : liste des vidéos des fiches « Tout savoir » (déjà vérifiées par oEmbed
// à la rédaction) pour la page /atelier/videos. Node pur, aucune dépendance, fail-soft.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FICHES = resolve(ROOT, "public", "fiches");
const OUT = resolve(ROOT, "public", "atelier", "videos.json");

try {
  const out = [];
  for (const f of existsSync(FICHES) ? readdirSync(FICHES) : []) {
    if (!f.endsWith(".json")) continue;
    try {
      const j = JSON.parse(readFileSync(resolve(FICHES, f), "utf8"));
      const v = j.video;
      if (!v || !v.id || !v.title || !v.channel) continue;
      const name = j.displayName || f.slice(0, -5);
      out.push({ id: v.id, title: v.title, channel: v.channel, uploadDate: v.uploadDate || undefined, slug: f.slice(0, -5), name, brand: name.split(" ")[0] });
    } catch {
      // fiche illisible : ignorée
    }
  }
  out.sort((a, b) => a.brand.localeCompare(b.brand, "fr") || a.name.localeCompare(b.name, "fr"));
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out), "utf8");
  console.log(`[atelier] ${out.length} vidéos -> public/atelier/videos.json`);
} catch (e) {
  console.warn(`[atelier] WARN: vidéos non générées (${e.message}).`);
}
