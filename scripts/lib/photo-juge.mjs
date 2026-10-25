// scripts/lib/photo-juge.mjs — juge VISION des photos de trottinettes (25/10/2026).
// Règle de Nolan (25/10) : la photo principale d'une trottinette = la trottinette de 3/4, détourée, propre, TOUTE SEULE.
// Jamais de personne (ni main), jamais d'écran / téléphone, de texte incrusté, ni de 2e trottinette, sur AUCUNE photo.
// Fait déclencheur : import du 25/10 (sync-scooters.js n'avait AUCUN contrôle) → 19 photos marketing en ligne.
// photo-qc.js (géométrie) ne voit ni une personne SUR la trottinette (1 seul morceau) ni un petit téléphone ajouté.
import sharp from 'sharp';

export const MODELE = 'claude-sonnet-5-5';
const VUES = ['3/4 avant', '3/4 arriere', 'profil', 'face', 'arriere', 'dessus', 'pliee', 'detail', 'autre'];

const TOOL = {
  name: 'verdict_photo',
  description: 'Décrit ce que montre la photo produit.',
  input_schema: {
    type: 'object',
    properties: {
      vue: { type: 'string', enum: VUES, description: "Angle de la trottinette. '3/4 avant' = vue de biais, roue avant plus proche, on voit le côté ET l'avant. 'profil' = strictement de côté. 'detail' = gros plan d'une partie (roue, écran, frein…). 'pliee' = trottinette pliée." },
      plusieurs_trottinettes: { type: 'boolean', description: "true s'il y a DEUX trottinettes ou plus sur l'image, ou une vignette / une 2e vue incrustée de la trottinette. Un gros plan d'une seule trottinette = false." },
      personne: { type: 'boolean', description: 'Un humain ou une partie du corps (main, jambe, pied, silhouette, même petite) est visible.' },
      ecran_ou_telephone: { type: 'boolean', description: "Un smartphone, une capture d'appli ou un écran AJOUTÉ à côté de la trottinette (l'écran du guidon de la trottinette ne compte pas)." },
      texte_incruste: { type: 'boolean', description: 'Du texte, un badge, une icône, une cote ou une fiche technique ajoutés sur l\'image (le logo imprimé sur la trottinette elle-même ne compte pas).' },
      autre_objet: { type: 'boolean', description: 'Un autre objet que la trottinette (casque, sac, chargeur posé à côté, décor, sol, mur).' },
      fond_propre: { type: 'boolean', description: 'Le fond est uniformément vide (détourage propre), sans décor, sans ombre portée de scène, sans résidu.' },
      coupee: { type: 'boolean', description: 'La trottinette est coupée par le bord de l\'image.' },
      note: { type: 'string', description: '15 mots maximum, en français, seulement si quelque chose cloche ; sinon chaîne vide.' },
    },
    required: ['vue', 'plusieurs_trottinettes', 'personne', 'ecran_ou_telephone', 'texte_incruste', 'autre_objet', 'fond_propre', 'coupee', 'note'],
  },
};

const SYSTEM = `Tu contrôles les photos produit d'un site de pièces détachées de trottinettes électriques.
L'image t'est montrée sur un fond gris uni : ce gris est la transparence du PNG, ce n'est PAS un décor.
Décris uniquement ce que tu vois, sans deviner. Une personne même minuscule, une main, un pied = personne:true.
Un téléphone ou une capture d'application posés à côté = ecran_ou_telephone:true.`;

/** Verdict métier à partir de la description. */
export function verdict(d) {
  // 25/10 (2e version) : REFUS = ce qui n'a rien à faire sur une fiche produit. Un gros plan ou un détourage imparfait
  // restent en galerie mais ne peuvent JAMAIS être la photo principale (3/4, propre, non coupée, seule).
  const motifs = [];
  if (d.personne) motifs.push('personne');
  if (d.ecran_ou_telephone) motifs.push('téléphone/écran');
  if (d.texte_incruste) motifs.push('texte incrusté');
  if (d.autre_objet) motifs.push('autre objet');
  if (d.plusieurs_trottinettes) motifs.push('plusieurs trottinettes / vignette');
  const refus = motifs.length > 0;
  const principale_ok = !refus && d.fond_propre && !d.coupee && (d.vue === '3/4 avant' || d.vue === '3/4 arriere');
  const rang_principale = refus ? 9 : principale_ok ? (d.vue === '3/4 avant' ? 0 : 1) : d.vue === 'detail' ? 3 : 2;
  return { refus, motifs, principale_ok, rang_principale };
}

/** Prépare l'image : alpha aplati sur gris (le blanc d'une trottinette reste visible), 512 px, JPEG. */
export async function preparer(buf) {
  return (await sharp(buf, { failOn: 'none' }).flatten({ background: '#cfcfcf' }).resize(512, 512, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer()).toString('base64');
}

/** Juge une image (Buffer). Renvoie { ...description, ...verdict } ou lève une erreur. */
export async function juger(buf, cle = process.env.ANTHROPIC_API_KEY) {
  if (!cle) throw new Error('ANTHROPIC_API_KEY absent');
  const b64 = await preparer(buf);
  for (let essai = 0; essai < 5; essai++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': cle, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODELE, max_tokens: 1000,
        system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
        tools: [TOOL], tool_choice: { type: 'auto' },
        messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } }, { type: 'text', text: 'Décris cette photo produit en appelant l\'outil verdict_photo (obligatoire, une seule fois).' }] }],
      }),
    });
    if ([429, 500, 503, 529].includes(res.status)) { await new Promise((r) => setTimeout(r, (Number(res.headers.get('retry-after')) || 10 * (essai + 1)) * 1000)); continue; }
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const j = await res.json();
    const d = j.content?.find((c) => c.type === 'tool_use')?.input;
    // un verdict incomplet n'est JAMAIS interprété (35 cas le 25/10 : champ absent lu comme un défaut) : on redemande
    if (!d || TOOL.input_schema.required.some((k) => d[k] === undefined)) { if (essai < 4) continue; throw new Error('verdict incomplet après 5 essais'); }
    return { ...d, ...verdict(d), usage: j.usage };
  }
  throw new Error('Anthropic indisponible après 5 essais');
}

/**
 * VERROU D'IMPORT (25/10) — à appeler AVANT tout envoi à process-images d'une galerie de trottinette.
 * cands : [{ i, buf }] (PNG détourés, déjà passés par photo-qc). Renvoie l'ordre d'envoi :
 * photos refusées retirées, la meilleure vue 3/4 propre EN TÊTE (= photo principale), puis les autres dans l'ordre source.
 * a34 = false → la fiche n'a pas de photo principale valable : elle DOIT rester brouillon.
 * Sans clé API, juger() lève une erreur : l'appelant n'envoie RIEN (verrou fermé, jamais ouvert par défaut).
 */
export async function trierGalerie(cands, log = (m) => console.log(m)) {
  const gardees = [], refusees = [];
  for (const c of cands) {
    const v = await juger(c.buf);
    log(`      juge #${c.i} ${v.vue}${v.refus ? ' REFUSÉE : ' + v.motifs.join(', ') : v.principale_ok ? ' (principale possible)' : ''}`);
    (v.refus ? refusees : gardees).push({ ...c, v });
  }
  gardees.sort((a, b) => a.v.rang_principale - b.v.rang_principale || a.i - b.i);
  return { gardees, refusees, a34: gardees.length > 0 && gardees[0].v.principale_ok };
}
