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
};

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
