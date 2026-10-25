#!/usr/bin/env node
// scripts/_juge-second-avis.mjs — 2e avis (Opus) sur les photos refusées par le juge (25/10/2026). Lecture seule.
// Question ÉTROITE : un élément a-t-il été AJOUTÉ autour de la trottinette (personne, téléphone/appli, texte/badge/cote
// ajoutés, 2e trottinette ou vignette, objet posé) ? L'écran, les autocollants et les logos DE la trottinette ne comptent pas.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { preparer } from './lib/photo-juge.mjs';
const L = JSON.parse(readFileSync('config/photos/juge-second-avis.json', 'utf-8'));
const TOOL = { name: 'avis', description: 'Avis sur la photo.', input_schema: { type: 'object', properties: {
  element_ajoute: { type: 'boolean', description: "true si quelque chose a été AJOUTÉ autour de la trottinette : une personne ou une partie du corps, un téléphone ou une capture d'appli, du texte / badge / icône / cote ajoutés, une 2e trottinette ou une vignette, un objet posé (casque, sac, chargeur…). false pour l'écran, les autocollants, logos et textes imprimés SUR la trottinette elle-même, et pour un simple gros plan." },
  quoi: { type: 'string', description: 'Ce qui a été ajouté, 8 mots max, sinon vide.' } }, required: ['element_ajoute', 'quoi'] } };
mkdirSync('out/juge', { recursive: true });
const out = [];
for (const x of L) {
  const buf = execFileSync('curl', ['-s', '-f', '-L', '--max-time', '40', x.url], { maxBuffer: 64 << 20 });
  const b64 = await preparer(buf);
  let d = null;
  for (let e = 0; e < 4 && !d; e++) {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-opus-5-5', max_tokens: 600, tools: [TOOL], tool_choice: { type: 'auto' },
        system: "Photo produit d'une trottinette électrique, fond gris = transparence. Réponds en appelant l'outil avis.",
        messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } }, { type: 'text', text: "Un élément a-t-il été ajouté autour de la trottinette ? Appelle l'outil avis." }] }] }) });
    if (!r.ok) { await new Promise((s) => setTimeout(s, 5000)); continue; }
    const j = await r.json(); const t = j.content?.find((c) => c.type === 'tool_use')?.input;
    if (t && typeof t.element_ajoute === 'boolean') d = t;
  }
  out.push({ ...x, avis2: d });
  console.log(`${x.slug} #${x.i} juge1=${x.m.join('/')} avis2=${d ? (d.element_ajoute ? 'AJOUT ' + d.quoi : 'rien') : 'ERREUR'}`);
}
writeFileSync('out/juge/second-avis.json', JSON.stringify(out, null, 1));
console.log(`::notice title=second avis::${out.filter((o) => o.avis2?.element_ajoute).length}/${out.length} confirmés · ${out.filter((o) => !o.avis2).length} erreur(s)`);
