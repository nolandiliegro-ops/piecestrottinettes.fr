// scripts/_read-dryrun.mjs
// Affiche UNIQUEMENT la valeur du flag DRY_RUN du .env (jamais le reste du fichier).
// Même sémantique de défaut que sync-airtable-wattiz.js : absent → true.

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const content = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
let raw;
for (const line of content.split('\n')) {
  const m = line.match(/^DRY_RUN=["']?([^"'\r\n]*)["']?/);
  if (m) raw = m[1].trim();
}
const effective = String(raw ?? 'true').toLowerCase() !== 'false';
console.log(`DRY_RUN (ligne .env) : ${raw === undefined ? '(absente)' : raw}`);
console.log(`DRY_RUN effectif      : ${effective}`);
