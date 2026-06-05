// POINT UNIQUE DE SWAP MOTEUR — pour changer @imgly → rembg/autre, ne modifier QUE ce fichier
//
// Contrat (stable, SB3/SB4 s'emboîtent dessus) :
//   detoure(input) -> Promise<Buffer>
//   input : URL (string) OU Buffer/Uint8Array
//   retour : Buffer PNG détouré
// Aucune écriture disque, aucun appel réseau autre que removeBackground().

import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { removeBackground } from '@imgly/background-removal-node';

// Le publicPath par défaut du package est calculé via path.resolve(cwd) et casse
// dès que le cwd n'est pas le dossier qui contient node_modules/@imgly. On le fixe
// ici sur le dist réellement installé, résolu depuis ce fichier (indépendant du cwd).
const require = createRequire(import.meta.url);
const distDir = dirname(require.resolve('@imgly/background-removal-node'));
const publicPath = `${pathToFileURL(distDir).href}/`;

export async function detoure(input) {
  const blob = await removeBackground(input, { publicPath });
  return Buffer.from(await blob.arrayBuffer());
}
