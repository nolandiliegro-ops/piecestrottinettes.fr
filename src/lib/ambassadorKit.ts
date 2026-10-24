/** Programme ambassadeurs (24/10/2026) — contenus partagés entre l'espace créateur, la page de candidature et l'admin. */

export const SITE_AMB = 'https://piecestrottinettes.fr';
export const lienCreateur = (code: string) => `${SITE_AMB}/?ref=${code}`;

export const STATUTS_JURIDIQUES = [
  { k: 'particulier', label: 'Particulier' },
  { k: 'auto_entrepreneur', label: 'Auto-entrepreneur' },
  { k: 'societe', label: 'Société' },
] as const;

export const RESEAUX_AMB = [
  { k: 'tiktok', label: 'TikTok', profil: (h: string) => `https://www.tiktok.com/@${h}` },
  { k: 'instagram', label: 'Instagram', profil: (h: string) => `https://www.instagram.com/${h}` },
  { k: 'youtube', label: 'YouTube', profil: (h: string) => `https://www.youtube.com/@${h}` },
  { k: 'autre', label: 'Autre', profil: (_h: string) => '' },
] as const;

/** Lien du profil public à partir du pseudo (« @karim.ride ») et du réseau ; vide si inconnu. */
export function lienProfil(handle: string | null | undefined, reseau: string | null | undefined): string {
  const h = (handle ?? '').trim().replace(/^@/, '');
  if (!h) return '';
  if (/^https?:\/\//i.test(h)) return h;
  const r = RESEAUX_AMB.find((x) => x.k === (reseau ?? 'tiktok'));
  return r ? r.profil(encodeURIComponent(h).replace(/%2E/g, '.')) : '';
}

/** Numéro au format international pour wa.me (France par défaut : 06… → 336…). */
export function numeroWhatsApp(tel: string | null | undefined): string {
  let d = (tel ?? '').replace(/[^\d+]/g, '');
  if (!d) return '';
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0') && d.length === 10) d = `33${d.slice(1)}`;
  return d.replace(/\D/g, '');
}

export const REGLES_CONTENU = [
  'Affiche « Publicité » ou « Collaboration commerciale » à l\'écran pendant toute la vidéo (obligation légale).',
  'Ne parle jamais de débridage : c\'est illégal et contraire au contrat.',
  'Montre des vraies réparations, des vrais problèmes : c\'est ce qui fait vendre.',
  'Dis ton code à voix haute ET mets ton lien en bio.',
];

export const HOOKS = [
  '« Ta trottinette crève tout le temps ? Voilà la chambre à air que je mets maintenant. »',
  '« 3 signes que tes plaquettes sont mortes (le 2e, personne ne le voit). »',
  '« J\'ai trouvé le site qui te dit quelle pièce va sur TA trottinette. »',
];

type Modele = { id: string; label: string; sujet: string; corps: string };

/** Modèles de messages (mail et WhatsApp). Variables : {prenom} {code} {lien} {espace}. */
export const MODELES_MESSAGE: Modele[] = [
  {
    id: 'demarchage', label: 'Démarchage',
    sujet: 'Partenariat piecestrottinettes.fr : 10 % pour toi, 10 % pour ta commu',
    corps: `Salut {prenom},

Je suis Nolan, je tiens l'atelier Steedy Trott à Marseille et le site piecestrottinettes.fr (pièces détachées de trottinettes, avec la compatibilité exacte pour chaque modèle).

J'aime ce que tu fais et je te propose de devenir ambassadeur : ta communauté a 10 % de remise avec ton code perso, et toi tu touches 10 % de commission sur chaque commande, payée tous les mois par PayPal. Tu suis tout en direct (clics, ventes, gains) dans ton espace.

Ça te tente ? Réponds simplement à ce message et je t'envoie ton code.

Nolan`,
  },
  {
    id: 'relance', label: 'Relance',
    sujet: 'Petite relance : ton code ambassadeur piecestrottinettes.fr',
    corps: `Salut {prenom},

Je me permets de te relancer pour le partenariat : 10 % de remise pour ta commu, 10 % de commission pour toi sur chaque commande, payés chaque mois.

Si c'est oui, je t'envoie ton code dans la journée. Si ce n'est pas le moment, aucun souci, dis-le moi.

Nolan`,
  },
  {
    id: 'bienvenue', label: 'Bienvenue + kit',
    sujet: 'Bienvenue dans le programme ambassadeur piecestrottinettes.fr',
    corps: `Salut {prenom}, bienvenue !

Ton code : {code} (10 % pour ta communauté)
Ton lien à mettre en bio : {lien}

Ton espace créateur (clics, ventes, gains, contrat) : {espace}
Connecte-toi avec cette adresse email, tu reçois un lien de connexion.

Les règles d'or :
- Affiche « Publicité » ou « Collaboration commerciale » pendant toute la vidéo (obligatoire).
- Jamais de débridage.
- Dis ton code à voix haute et mets le lien en bio.

Ta commission : 10 % sur chaque commande, versée tous les mois par PayPal dès 20 €.

À fond,
Nolan`,
  },
  { id: 'libre', label: 'Message libre', sujet: '', corps: 'Salut {prenom},\n\n\n\nNolan' },
];

export function remplirModele(texte: string, v: { prenom: string; code: string }) {
  return texte
    .replace(/\{prenom\}/g, v.prenom)
    .replace(/\{code\}/g, v.code || '(ton code arrive)')
    .replace(/\{lien\}/g, v.code ? lienCreateur(v.code) : `${SITE_AMB}`)
    .replace(/\{espace\}/g, `${SITE_AMB}/ambassadeur`);
}
