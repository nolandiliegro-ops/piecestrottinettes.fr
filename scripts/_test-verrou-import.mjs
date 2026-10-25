#!/usr/bin/env node
// scripts/_test-verrou-import.mjs — test du verrou photo d'import (25/10/2026). Lecture seule, aucun envoi.
// Prouve que trierGalerie (utilisé par sync-scooters / update-photos) : 1. refuse un composite, 2. met le 3/4 EN TÊTE
// même s'il arrive en dernier, 3. renvoie a34:false sans 3/4 propre (fiche bloquée en brouillon), 4. reste FERMÉ sans clé.
import { execFileSync } from 'child_process';
import { trierGalerie } from './lib/photo-juge.mjs';
const B = 'https://kqsxscjtlipregkrmucg.supabase.co/storage/v1/object/public/scooter-photos/';
const get = (p) => execFileSync('curl', ['-s', '-f', '-L', '--max-time', '40', B + p], { maxBuffer: 64 << 20 });
const composite = get('e82a6f98-f4aa-48cf-b098-ee2206641652/1792892442818_0.png'); // iscooter-f7-ultra #0 (homme + téléphone)
const profil = get('cffb867e-cb1d-426b-bbc2-079659977d66/1792443186219_0.png');     // navee-gt3-max #1 (profil)
const pliee = get('cffb867e-cb1d-426b-bbc2-079659977d66/1792868207753_0.png');      // navee-gt3-max #2 (pliée)
const troisQuarts = get('cffb867e-cb1d-426b-bbc2-079659977d66/1792443184671_0.png'); // navee-gt3-max #0 (3/4)
let ok = true; const check = (c, m) => { console.log(`${c ? 'OK ' : 'KO '} ${m}`); if (!c) ok = false; };

const t1 = await trierGalerie([{ i: 0, buf: composite }, { i: 1, buf: profil }, { i: 2, buf: troisQuarts }]);
check(t1.refusees.length === 1 && t1.refusees[0].i === 0, 'cas 1 : le composite (personne + téléphone) est refusé');
check(t1.gardees[0]?.i === 2 && t1.a34, 'cas 1 : le 3/4 arrivé en dernier part EN TÊTE (photo principale)');
const t2 = await trierGalerie([{ i: 0, buf: profil }, { i: 1, buf: pliee }]);
check(t2.a34 === false, 'cas 2 : sans 3/4 propre, a34=false → rien envoyé, fiche en brouillon');
const cle = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
let ferme = false; try { await trierGalerie([{ i: 0, buf: troisQuarts }]); } catch { ferme = true; }
process.env.ANTHROPIC_API_KEY = cle;
check(ferme, 'cas 3 : sans clé API, le verrou reste FERMÉ (erreur, aucun envoi)');
console.log(ok ? '::notice title=verrou import::4/4 OK' : '::error title=verrou import::ÉCHEC');
process.exitCode = ok ? 0 : 1;
