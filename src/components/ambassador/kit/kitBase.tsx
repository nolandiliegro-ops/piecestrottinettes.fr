import type { CSSProperties, ReactNode } from 'react';
import { QrSvg } from '../AmbassadorStory';

/* Kit de partage ambassadeur (25/10/2026) — briques communes à tous les formats.
   Chaque format est un cadre en px CSS, exporté par html-to-image au multiple qui donne sa taille réelle. */

export const VERT = '#4A7C59';
export const VERT_FONCE = '#3A6449';
export const CARBON = '#1A1A1A';
export const BEIGE = '#F5F0E8';
export const ORANGE = '#FF6600';
export const GRIS = '#6B7280';
export const DISPLAY = "'Unbounded', sans-serif";
export const TEXTE = "'Plus Jakarta Sans', sans-serif";

export type KitData = {
  photo: string | null;
  nom: string;
  code: string;
  lien: string;
  wallpaper?: string | null;
  pieces?: { nom: string; image: string }[];
  /** La trottinette mise en avant dans son garage (photo détourée du modèle) ; repli : un modèle populaire. */
  trott?: { nom: string; image: string } | null;
};

/* 25/10 (retour Nolan) : la DA du site, pas d'effets « voiture » ni de rayons ronds.
   Titres Unbounded 900 italique MAJUSCULES bicolores (comme « PLUS JAMAIS LA MAUVAISE PIÈCE. »),
   sur-titre carré vert + capitales espacées, blocs à coin coupé, fond clair #FAFAF8. */
export const FOND = '#FAFAF8';
export const coupe = (n = 10) => `polygon(0 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% 100%, 0 100%)`;

export const Titre = ({ l, s, c = CARBON, vert = [], style = {} }: { l: string[]; s: number; c?: string; vert?: number[]; style?: CSSProperties }) => (
  <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', fontSize: s, lineHeight: 0.98, letterSpacing: '-0.02em', color: c, ...style }}>
    {l.map((x, i) => <div key={i} style={{ color: vert.includes(i) ? VERT : c }}>{x}</div>)}
  </div>
);

export const SurTitre = ({ children, c = GRIS, carre = VERT }: { children: ReactNode; c?: string; carre?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ width: 9, height: 9, background: carre, flexShrink: 0 }} />
    <span style={{ fontFamily: TEXTE, fontWeight: 700, fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase', color: c, lineHeight: 1.1 }}>{children}</span>
  </div>
);

/** Le code dans un bloc à coin coupé, comme le bouton « TROUVER → » du site. */
export const BlocCode = ({ code, s = 30, bg = CARBON, fg = '#fff', fleche = false, pad = '12px 20px' }: { code: string; s?: number; bg?: string; fg?: string; fleche?: boolean; pad?: string }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: bg, color: fg, padding: pad, clipPath: coupe(Math.round(s * 0.45)) }}>
    <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontStyle: 'italic', fontSize: s, letterSpacing: '0.02em', lineHeight: 1 }}>{code}</span>
    {fleche && <span style={{ fontFamily: TEXTE, fontWeight: 800, fontSize: s * 0.7, lineHeight: 1 }}>→</span>}
  </div>
);

export const Logo = ({ w, neg = false }: { w: number; neg?: boolean }) => (
  <img src={neg ? '/brand/logo-pt-2026-negatif.svg' : '/brand/logo-pt-2026.svg'} alt="piecestrottinettes.fr" style={{ width: w, height: 'auto', display: 'block' }} />
);

export const Trott = ({ d, h, style = {} }: { d: KitData; h: number; style?: CSSProperties }) => (
  d.trott?.image ? <img src={d.trott.image} alt="" crossOrigin="anonymous" style={{ height: h, width: 'auto', objectFit: 'contain', display: 'block', ...style }} /> : null
);

export { QrSvg };

export const domaine = (lien: string) => lien.replace(/^https?:\/\//, '').split(/[/?]/)[0];

export const cadre = (w: number, h: number, extra: CSSProperties = {}): CSSProperties => ({
  width: w, height: h, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', flexShrink: 0, ...extra,
});

export const Badge = ({ photo, nom, size, ring = 'transparent' }: { photo: string | null; nom: string; size: number; ring?: string }) => (
  photo
    ? <img src={photo} alt="" crossOrigin="anonymous" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', boxShadow: `0 0 0 4px ${ring}`, display: 'block' }} />
    : <span style={{ width: size, height: size, borderRadius: '50%', background: VERT, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: DISPLAY, fontSize: size * 0.4, fontWeight: 900 }}>{nom.slice(0, 1).toUpperCase()}</span>
);

/** Mention imposée par la loi influenceurs (art. 5) sur tout visuel posté par un créateur. */
export const Mention = ({ color = GRIS, size = 14 }: { color?: string; size?: number }) => (
  <p style={{ fontFamily: TEXTE, fontSize: size, color, margin: 0, lineHeight: 1.2 }}>Collaboration commerciale</p>
);

/** Rayons du badge IA, réutilisés comme signature graphique du kit. */
export const Rayons = ({ cx, cy, r = 700, alpha = '22' }: { cx: number | string; cy: number | string; r?: number; alpha?: string }) => (
  <div style={{ position: 'absolute', left: cx, top: cy, width: r * 2, height: r * 2, marginLeft: -r, marginTop: -r, background: `repeating-conic-gradient(${ORANGE}${alpha} 0deg 6deg, transparent 6deg 18deg)`, pointerEvents: 'none' }} />
);

export const T = ({ children, f = TEXTE, s = 14, w = 400, c = CARBON, style = {} }: { children: ReactNode; f?: string; s?: number; w?: number; c?: string; style?: CSSProperties }) => (
  <p style={{ fontFamily: f, fontSize: s, fontWeight: w, color: c, margin: 0, lineHeight: 1.15, ...style }}>{children}</p>
);
