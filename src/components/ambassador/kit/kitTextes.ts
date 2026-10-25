/* Textes prêts à copier du kit ambassadeur (25/10/2026) — 5 tons proposés, chacun avec bio, légende et message privé.
   {CODE} et {LIEN} sont remplacés par le code et le lien du créateur. Chaque légende porte la mention de collaboration. */

export type TonTextes = { nom: string; idee: string; bio: string; legende: string; message: string };

export const TONS: TonTextes[] = [
  {
    nom: 'Littéral',
    idee: 'Le code, la remise, le site. Rien d\'autre.',
    bio: '−10 % sur tes pièces de trottinette avec le code {CODE} 👉 {LIEN}',
    legende: '−10 % sur tes pièces de trottinette avec mon code {CODE} sur piecestrottinettes.fr. #collaborationcommerciale',
    message: 'Salut ! Si tu as besoin de pièces pour ta trott, mon code {CODE} te fait −10 % sur piecestrottinettes.fr : {LIEN}',
  },
  {
    nom: 'Le pote',
    idee: 'Comme un conseil entre riders, sans ton de vendeur.',
    bio: 'Je roule, je casse, je répare 🛴 Mes pièces : {LIEN} (code {CODE}, −10 %)',
    legende: 'Crevé encore une fois 😅 Je commande toujours mes chambres à air au même endroit, et avec {CODE} t\'as −10 %. Lien en bio. #collaborationcommerciale',
    message: 'Frère, pour ta trott prends tes pièces là, ils te disent ce qui va sur ton modèle. Et avec mon code {CODE} t\'as −10 % : {LIEN}',
  },
  {
    nom: 'L\'atelier',
    idee: 'Le ton du mécano qui sait, rassurant sur la compatibilité.',
    bio: 'Entretien trottinette · pièces compatibles vérifiées · −10 % code {CODE} · {LIEN}',
    legende: 'Plaquettes, pneus, chambres à air : vérifie que la pièce va sur ton modèle avant d\'acheter. Sur piecestrottinettes.fr c\'est affiché, et {CODE} te fait −10 %. #collaborationcommerciale',
    message: 'Pour ta trott, tape ton modèle sur {LIEN} : tu n\'as que les pièces qui montent dessus. Code {CODE} pour −10 %.',
  },
  {
    nom: 'Bon plan',
    idee: 'Court, chiffré, pour ceux qui cherchent l\'économie.',
    bio: '💸 −10 % pièces trott → code {CODE} · {LIEN}',
    legende: 'Bon plan pièces de trott : −10 % avec {CODE}. Chambre à air, pneu, plaquettes, chargeur. Lien en bio. #collaborationcommerciale',
    message: 'Bon plan : −10 % sur toutes les pièces de trott avec le code {CODE} 👉 {LIEN}',
  },
  {
    nom: 'Marseille',
    idee: 'L\'accent de l\'atelier, comme les voix de la série.',
    bio: 'Rider marseillais 🛴 Mes pièces ici : {LIEN} · code {CODE} = −10 %',
    legende: 'Ta trott elle fait la tête ? Fais pas le fada, change la chambre à air avant de crever sur la Corniche. Avec {CODE} t\'as −10 %. #collaborationcommerciale',
    message: 'Oh, pour tes pièces de trott vas-y sur {LIEN}, et mets mon code {CODE}, t\'as −10 %. Tranquille.',
  },
];

export const remplirTexte = (t: string, code: string, lien: string) => t.split('{CODE}').join(code).split('{LIEN}').join(lien);
