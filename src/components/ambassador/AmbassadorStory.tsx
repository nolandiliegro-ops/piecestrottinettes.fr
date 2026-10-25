import { forwardRef, useMemo } from 'react';
import { encode } from '@/lib/vendor/uqr';

/* Visuel story ambassadeur (25/10/2026) — doc : claude/PT-lot-avatar-ia.md (reste à faire n°1).
   Cadre 360 × 640 px à l'écran, exporté en 1080 × 1920 (pixelRatio 3) : badge IA du créateur, son code, son lien en QR.
   5 propositions derrière ?story=1..5 (méthode « cinq propositions rendues »). */

export type StoryProps = {
  variante: number;
  photo: string | null;
  nom: string;
  code: string;
  lien: string;
  wallpaper?: string | null;
};

const VERT = '#4A7C59';
const CARBON = '#1A1A1A';
const BEIGE = '#F5F0E8';
const ORANGE = '#FF6600';
const DISPLAY = "'Unbounded', sans-serif";
const TEXTE = "'Plus Jakarta Sans', sans-serif";

/** QR dessiné en carrés SVG (pas d'image externe : l'export html-to-image reste fiable). */
export const QrSvg = ({ value, size, fg = CARBON, bg = '#FFFFFF' }: { value: string; size: number; fg?: string; bg?: string }) => {
  const qr = useMemo(() => encode(value, { ecc: 'M', border: 2 }), [value]);
  const n = qr.size;
  const rects: string[] = [];
  qr.data.forEach((row, y) => row.forEach((on, x) => { if (on) rects.push(`M${x} ${y}h1v1h-1z`); }));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" aria-label="QR code vers le lien du créateur">
      <rect width={n} height={n} fill={bg} />
      <path d={rects.join('')} fill={fg} />
    </svg>
  );
};

// Le lien complet (avec ?ref=) vit dans le QR ; en clair, le domaine seul se lit et se tape sans erreur.
const lienCourt = (lien: string) => lien.replace(/^https?:\/\//, '').split(/[/?]/)[0];

const Badge = ({ photo, nom, size, ring = 'transparent' }: { photo: string | null; nom: string; size: number; ring?: string }) => (
  photo
    ? <img src={photo} alt="" crossOrigin="anonymous" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', boxShadow: `0 0 0 4px ${ring}` }} />
    : <span style={{ width: size, height: size, borderRadius: '50%', background: VERT, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: DISPLAY, fontSize: size * 0.4, fontWeight: 900 }}>{nom.slice(0, 1).toUpperCase()}</span>
);

const Mention = ({ color = '#6B7280' }: { color?: string }) => (
  <p style={{ fontFamily: TEXTE, fontSize: 14, color, margin: 0 }}>Collaboration commerciale</p>
);

const cadre: React.CSSProperties = { width: 360, height: 640, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', flexShrink: 0 };

const AmbassadorStory = forwardRef<HTMLDivElement, StoryProps>(({ variante, photo, nom, code, lien, wallpaper }, ref) => {
  const court = lienCourt(lien);

  // 1 · Littéral — ce que la demande dit, rien de plus : badge, nom, code, QR, lien, sur le beige du site.
  if (variante === 1) return (
    <div ref={ref} style={{ ...cadre, background: BEIGE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '44px 28px 32px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <Badge photo={photo} nom={nom} size={168} />
        <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 24, color: CARBON, margin: 0, textAlign: 'center' }}>{nom}</p>
        <p style={{ fontFamily: TEXTE, fontSize: 16, color: CARBON, margin: 0, textAlign: 'center' }}>−10 % sur tes pièces de trottinette avec mon code</p>
        <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 40, color: VERT, margin: 0, letterSpacing: 1 }}>{code}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ background: '#fff', padding: 10, borderRadius: 16 }}><QrSvg value={lien} size={150} /></div>
        <p style={{ fontFamily: TEXTE, fontWeight: 700, fontSize: 15, color: CARBON, margin: 0 }}>{court}</p>
        <Mention />
      </div>
    </div>
  );

  // 2 · Ticket — un bon d'atelier détachable, fond carbone, code + QR sur le coupon.
  if (variante === 2) return (
    <div ref={ref} style={{ ...cadre, background: CARBON, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px 28px' }}>
      <p style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 14, color: BEIGE, margin: 0, letterSpacing: 2, textTransform: 'uppercase' }}>piecestrottinettes.fr</p>
      <div style={{ marginTop: 28, zIndex: 2 }}><Badge photo={photo} nom={nom} size={150} ring={CARBON} /></div>
      <div style={{ marginTop: -60, width: '100%', background: BEIGE, borderRadius: 18, padding: '72px 22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 20, color: CARBON, margin: 0 }}>Bon de {nom}</p>
        <p style={{ fontFamily: TEXTE, fontSize: 15, color: '#374151', margin: 0 }}>−10 % sur toutes tes pièces</p>
        <div style={{ width: '100%', borderTop: `2px dashed ${CARBON}33`, margin: '10px 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <QrSvg value={lien} size={112} bg={BEIGE} />
          <div>
            <p style={{ fontFamily: TEXTE, fontSize: 14, color: '#6B7280', margin: 0 }}>Code</p>
            <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 28, color: VERT, margin: 0 }}>{code}</p>
          </div>
        </div>
      </div>
      <p style={{ fontFamily: TEXTE, fontWeight: 700, fontSize: 15, color: BEIGE, margin: '16px 0 4px' }}>{court}</p>
      <Mention color="#9CA3AF" />
    </div>
  );

  // 3 · Carte Rider — la carte Rider existante repassée : le wallpaper du créateur en fond, bandeau code + QR en bas.
  if (variante === 3) return (
    <div ref={ref} style={{ ...cadre, background: wallpaper ? `${CARBON} url(${wallpaper}) center/cover` : CARBON }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.05) 45%, rgba(0,0,0,.75) 100%)' }} />
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <Badge photo={photo} nom={nom} size={176} ring="#fff" />
        <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 24, color: '#fff', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,.6)' }}>{nom}</p>
      </div>
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 24, background: '#fff', borderRadius: 18, padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
        <QrSvg value={lien} size={104} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: TEXTE, fontSize: 14, color: '#6B7280', margin: 0 }}>−10 % avec mon code</p>
          <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 26, color: VERT, margin: 0 }}>{code}</p>
          <p style={{ fontFamily: TEXTE, fontWeight: 700, fontSize: 14, color: CARBON, margin: '2px 0 0' }}>{court}</p>
          <Mention />
        </div>
      </div>
    </div>
  );

  // 4 · Affiche — gros titre en majuscules, rayons comme sur le badge, QR dans le coin.
  if (variante === 4) return (
    <div ref={ref} style={{ ...cadre, background: '#fff' }}>
      <div style={{ position: 'absolute', left: '50%', top: 300, width: 900, height: 900, marginLeft: -450, marginTop: -450, background: `repeating-conic-gradient(${ORANGE}22 0deg 6deg, transparent 6deg 18deg)` }} />
      <div style={{ position: 'relative', padding: '40px 26px 0' }}>
        <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 46, lineHeight: 1, color: CARBON, margin: 0, textTransform: 'uppercase' }}>−10 %</p>
        <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 22, lineHeight: 1.1, color: CARBON, margin: '6px 0 0', textTransform: 'uppercase' }}>sur tes pièces de trott</p>
      </div>
      <div style={{ position: 'absolute', top: 178, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Badge photo={photo} nom={nom} size={220} />
      </div>
      <div style={{ position: 'absolute', left: 22, right: 22, bottom: 26, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ fontFamily: TEXTE, fontSize: 15, color: CARBON, margin: 0 }}>Le code de {nom}</p>
          <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 32, color: VERT, margin: '2px 0 4px' }}>{code}</p>
          <p style={{ fontFamily: TEXTE, fontWeight: 700, fontSize: 14, color: CARBON, margin: 0 }}>{court}</p>
          <Mention />
        </div>
        <div style={{ background: '#fff', padding: 6, borderRadius: 12, boxShadow: '0 4px 14px rgba(0,0,0,.12)' }}><QrSvg value={lien} size={96} /></div>
      </div>
    </div>
  );

  // 5 · Sticker — le badge seul en très grand comme un autocollant, code en pastille, fond vert maison.
  return (
    <div ref={ref} style={{ ...cadre, background: VERT, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px 28px' }}>
      <div style={{ background: '#fff', borderRadius: '50%', padding: 10, boxShadow: '0 10px 30px rgba(0,0,0,.25)', transform: 'rotate(-4deg)' }}>
        <Badge photo={photo} nom={nom} size={250} />
      </div>
      <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 22, color: '#fff', margin: '26px 0 10px' }}>{nom}</p>
      <span style={{ background: '#fff', color: CARBON, borderRadius: 999, padding: '10px 22px', fontFamily: DISPLAY, fontWeight: 900, fontSize: 26 }}>{code}</span>
      <p style={{ fontFamily: TEXTE, fontSize: 15, color: '#fff', margin: '10px 0 0' }}>−10 % sur tes pièces</p>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ background: '#fff', padding: 6, borderRadius: 10 }}><QrSvg value={lien} size={80} /></div>
        <div>
          <p style={{ fontFamily: TEXTE, fontWeight: 700, fontSize: 14, color: '#fff', margin: 0 }}>{court}</p>
          <Mention color="#E5E7EB" />
        </div>
      </div>
    </div>
  );
});
AmbassadorStory.displayName = 'AmbassadorStory';

export default AmbassadorStory;
