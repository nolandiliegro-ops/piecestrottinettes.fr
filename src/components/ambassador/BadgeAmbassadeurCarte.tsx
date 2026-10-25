import type { ReactNode } from 'react';

/* Badge « Ambassadeur » sur la carte Rider du site (25/10/2026, Nolan : « la carte sur le site de l'ambassadeur,
   elle a un badge en plus » ; « il ne faut pas qu'il y ait moins d'informations parce qu'il est ambassadeur »).
   Il s'ajoute sous le nom (ou sur l'avatar) ; rien d'autre ne bouge. 5 propositions ; la n°1 est la lecture littérale. */

const VERT = '#4A7C59';
const SOFT = '#8FBF9C';
const TEXTE = "'Plus Jakarta Sans', sans-serif";
const cut = (c: number) => `polygon(0 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, 0 100%)`;

export const NOMS_BADGE = ['Étiquette verte', 'Sur-titre', 'Coin', 'Avatar certifié', 'Ligne discrète'] as const;

const Coche = ({ s = 12, c = '#fff' }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 12 12" aria-hidden><path d="M2 6.4 4.7 9 10 3.4" stroke={c} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/** `sous` : sous le nom, dans l'en-tête de la carte · `haut` : posé en absolu sur la carte. */
export const badgeAmbassadeur = (v: number): { sous?: ReactNode; haut?: ReactNode } => {
  const label = 'Ambassadeur';
  if (v === 1) return {
    sous: (
      <span className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1" style={{ background: VERT, clipPath: cut(7), fontFamily: TEXTE }}>
        <Coche />
        <span className="text-sm font-extrabold uppercase text-white" style={{ letterSpacing: '0.12em' }}>{label}</span>
      </span>
    ),
  };
  if (v === 2) return {
    sous: (
      <span className="mt-1.5 inline-flex items-center gap-2" style={{ fontFamily: TEXTE }}>
        <span className="w-[9px] h-[9px]" style={{ background: SOFT }} />
        <span className="text-sm font-extrabold uppercase" style={{ letterSpacing: '0.14em', color: SOFT }}>{label}</span>
      </span>
    ),
  };
  if (v === 3) return {
    haut: (
      <div className="absolute right-0 top-[92px] z-10 pl-4 pr-3 py-1.5 inline-flex items-center gap-1.5" style={{ background: VERT, clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%)', fontFamily: TEXTE }}>
        <Coche />
        <span className="text-sm font-extrabold uppercase text-white" style={{ letterSpacing: '0.12em' }}>{label}</span>
      </div>
    ),
  };
  if (v === 4) return {
    haut: (
      <>
        {/* Cadre vert derrière l'avatar (rendu avant l'en-tête : l'avatar se pose dessus). */}
        <div aria-hidden className="absolute left-[13px] top-[13px] w-[58px] h-[58px] pointer-events-none" style={{ background: VERT, clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }} />
        <span aria-label={label} className="absolute left-[54px] top-[54px] z-10 w-[22px] h-[22px] inline-flex items-center justify-center" style={{ background: VERT, boxShadow: '0 0 0 2px #fff' }}><Coche s={13} /></span>
      </>
    ),
  };
  return {
    sous: (
      <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: SOFT, fontFamily: TEXTE }}>
        <Coche c={SOFT} /> {label} · piecestrottinettes.fr
      </span>
    ),
  };
};
