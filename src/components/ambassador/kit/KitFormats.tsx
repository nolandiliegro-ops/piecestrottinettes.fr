import { forwardRef, type ReactNode } from 'react';
import { Badge, BEIGE, CARBON, cadre, DISPLAY, domaine, GRIS, type KitData, Mention, ORANGE, QrSvg, Rayons, T, TEXTE, VERT, VERT_FONCE } from './kitBase';

/* Kit de partage ambassadeur (25/10/2026) — 6 formats visuels × 5 propositions.
   Doc : claude/PT-lot-avatar-ia.md · méthode « cinq propositions rendues ». La n°1 de chaque format est la lecture littérale. */

type P = { v: number; d: KitData };
type Comp = ReturnType<typeof forwardRef<HTMLDivElement, P>>;

export type KitFormat = {
  id: 'carte' | 'qr' | 'code' | 'sticker' | 'post' | 'banniere';
  titre: string;
  usage: string;
  w: number; h: number; // cadre en px CSS
  ratio: number;        // multiplicateur d'export → taille réelle
  transparent?: boolean;
  noms: [string, string, string, string, string];
  Comp: Comp;
};

const Box = ({ children, style }: { children: ReactNode; style?: React.CSSProperties }) => <div style={style}>{children}</div>;

/* ── 1. CARTE (format carte de visite, 1080 × 675) ── */
const Carte = forwardRef<HTMLDivElement, P>(({ v, d }, ref) => {
  const W = 360, H = 225;
  if (v === 1) return (
    <div ref={ref} style={cadre(W, H, { background: '#fff', borderRadius: 18, padding: 18, display: 'flex', gap: 14, alignItems: 'center' })}>
      <Badge photo={d.photo} nom={d.nom} size={96} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <T f={DISPLAY} s={17} w={900}>{d.nom}</T>
        <T s={14} c={GRIS}>Ambassadeur piecestrottinettes.fr</T>
        <T f={DISPLAY} s={22} w={900} c={VERT} style={{ marginTop: 6 }}>{d.code}</T>
        <T s={14}>−10 % sur tes pièces</T>
      </div>
      <QrSvg value={d.lien} size={80} />
    </div>
  );
  if (v === 2) return (
    <div ref={ref} style={cadre(W, H, { background: `linear-gradient(135deg, ${CARBON} 0%, #2b2f2a 100%)`, borderRadius: 18, padding: 20, color: '#fff' })}>
      <T f={DISPLAY} s={14} w={800} c="#cfd6cc" style={{ letterSpacing: 1, maxWidth: 230 }}>piecestrottinettes.fr</T>
      <div style={{ position: 'absolute', right: 18, top: 16 }}><Badge photo={d.photo} nom={d.nom} size={70} ring="#ffffff22" /></div>
      <T f={DISPLAY} s={30} w={900} c="#fff" style={{ marginTop: 52, letterSpacing: 3 }}>{d.code}</T>
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div><T s={14} c="#cfd6cc">Carte ambassadeur</T><T f={DISPLAY} s={15} w={800} c="#fff">{d.nom}</T></div>
        <div style={{ background: '#fff', padding: 4, borderRadius: 8 }}><QrSvg value={d.lien} size={58} /></div>
      </div>
    </div>
  );
  if (v === 3) return (
    <div ref={ref} style={cadre(W, H, { background: d.wallpaper ? `${CARBON} url(${d.wallpaper}) center/cover` : CARBON, borderRadius: 18 })}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,.75) 0%, rgba(0,0,0,.15) 70%)' }} />
      <div style={{ position: 'absolute', left: 18, top: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Badge photo={d.photo} nom={d.nom} size={72} ring="#fff" />
        <div><T f={DISPLAY} s={17} w={900} c="#fff">{d.nom}</T><T s={14} c="#e5e7eb">Carte Rider · ambassadeur</T></div>
      </div>
      <div style={{ position: 'absolute', left: 18, bottom: 16 }}><T s={14} c="#e5e7eb">Mon code −10 %</T><T f={DISPLAY} s={24} w={900} c="#fff">{d.code}</T></div>
      <div style={{ position: 'absolute', right: 16, bottom: 16, background: '#fff', padding: 5, borderRadius: 10 }}><QrSvg value={d.lien} size={66} /></div>
    </div>
  );
  if (v === 4) return (
    <div ref={ref} style={cadre(W, H, { background: '#fff', borderRadius: 18 })}>
      <Rayons cx={70} cy={112} r={420} />
      <div style={{ position: 'absolute', left: 16, top: 40 }}><Badge photo={d.photo} nom={d.nom} size={110} /></div>
      <div style={{ position: 'absolute', left: 146, top: 26, right: 16 }}>
        <T f={DISPLAY} s={30} w={900}>−10 %</T>
        <T f={DISPLAY} s={14} w={800}>avec le code de {d.nom}</T>
        <T f={DISPLAY} s={24} w={900} c={VERT} style={{ marginTop: 8 }}>{d.code}</T>
      </div>
      <div style={{ position: 'absolute', right: 14, bottom: 12, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <T s={14} w={700}>{domaine(d.lien)}</T>
        <div style={{ background: '#fff', padding: 3, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}><QrSvg value={d.lien} size={56} /></div>
      </div>
    </div>
  );
  return (
    <div ref={ref} style={cadre(W, H, { background: BEIGE, borderRadius: 14, display: 'flex' })}>
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Badge photo={d.photo} nom={d.nom} size={58} /><T f={DISPLAY} s={15} w={900}>{d.nom}</T></div>
        <div><T s={14} c={GRIS}>Bon d'atelier · −10 %</T><T f={DISPLAY} s={24} w={900} c={VERT}>{d.code}</T></div>
      </div>
      <div style={{ width: 0, borderLeft: `2px dashed ${CARBON}40`, margin: '10px 0' }} />
      <div style={{ width: 118, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <QrSvg value={d.lien} size={84} bg={BEIGE} />
        <T s={14} w={700}>Scanne</T>
      </div>
    </div>
  );
});
Carte.displayName = 'KitCarte';

/* ── 2. QR SEUL (carré imprimable, 1080 × 1080) ── */
const Qr = forwardRef<HTMLDivElement, P>(({ v, d }, ref) => {
  const W = 360;
  if (v === 1) return (
    <div ref={ref} style={cadre(W, W, { background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 })}>
      <QrSvg value={d.lien} size={260} />
      <T s={16} w={700}>{domaine(d.lien)}</T>
    </div>
  );
  if (v === 2) return (
    <div ref={ref} style={cadre(W, W, { background: CARBON, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 })}>
      <T f={DISPLAY} s={22} w={900} c="#fff" style={{ letterSpacing: 2 }}>SCANNE-MOI</T>
      <div style={{ background: '#fff', padding: 12, borderRadius: 20 }}><QrSvg value={d.lien} size={210} /></div>
      <T s={15} c="#e5e7eb">−10 % · code <b style={{ color: '#fff' }}>{d.code}</b></T>
    </div>
  );
  if (v === 3) return (
    <div ref={ref} style={cadre(W, W, { background: 'transparent' })}>
      <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', background: VERT, boxShadow: `0 0 0 8px #fff inset` }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <T f={DISPLAY} s={16} w={900} c="#fff">−10 % AVEC</T>
        <div style={{ background: '#fff', padding: 8, borderRadius: 14 }}><QrSvg value={d.lien} size={170} /></div>
        <T f={DISPLAY} s={18} w={900} c="#fff">{d.code}</T>
      </div>
    </div>
  );
  if (v === 4) return (
    <div ref={ref} style={cadre(W, W, { background: '#fff' })}>
      <Rayons cx="50%" cy="50%" r={420} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <T f={DISPLAY} s={34} w={900}>−10 %</T>
        <div style={{ background: '#fff', padding: 10, borderRadius: 16, boxShadow: '0 6px 20px rgba(0,0,0,.12)' }}><QrSvg value={d.lien} size={190} /></div>
        <T f={DISPLAY} s={18} w={900} c={VERT}>{d.code}</T>
      </div>
    </div>
  );
  return (
    <div ref={ref} style={cadre(W, W, { background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
      <div style={{ width: 260, height: 330, background: BEIGE, borderRadius: 18, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 34, gap: 8, boxShadow: '0 4px 14px rgba(0,0,0,.12)' }}>
        <span style={{ position: 'absolute', top: 12, width: 14, height: 14, borderRadius: '50%', background: '#fff', boxShadow: `inset 0 0 0 2px ${CARBON}55` }} />
        <QrSvg value={d.lien} size={200} bg={BEIGE} />
        <T f={DISPLAY} s={20} w={900} c={VERT}>{d.code}</T>
        <T s={14} c={GRIS}>étiquette atelier · −10 %</T>
      </div>
    </div>
  );
});
Qr.displayName = 'KitQr';

/* ── 3. CODE SEUL (story sans visage, 1080 × 1920) ── */
const Code = forwardRef<HTMLDivElement, P>(({ v, d }, ref) => {
  const W = 360, H = 640;
  if (v === 1) return (
    <div ref={ref} style={cadre(W, H, { background: BEIGE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 })}>
      <T s={18} style={{ textAlign: 'center' }}>Mon code pour −10 % sur tes pièces de trottinette</T>
      <T f={DISPLAY} s={46} w={900} c={VERT}>{d.code}</T>
      <T s={16} w={700}>{domaine(d.lien)}</T>
      <div style={{ position: 'absolute', bottom: 26 }}><Mention /></div>
    </div>
  );
  if (v === 2) return (
    <div ref={ref} style={cadre(W, H, { background: '#2b2f2a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 })}>
      <T f={DISPLAY} s={16} w={800} c="#cfd6cc" style={{ letterSpacing: 2 }}>IMMATRICULÉ</T>
      <div style={{ width: 300, height: 92, background: '#fff', borderRadius: 10, border: `4px solid ${CARBON}`, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 34, background: '#1d4ed8', display: 'grid', placeItems: 'center' }}><T s={14} w={800} c="#fff">F</T></div>
        <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}><T f={DISPLAY} s={34} w={900}>{d.code}</T></div>
      </div>
      <T s={17} c="#fff" style={{ textAlign: 'center' }}>−10 % sur tes pièces</T>
      <T s={15} w={700} c="#e5e7eb">{domaine(d.lien)}</T>
      <div style={{ position: 'absolute', bottom: 26 }}><Mention color="#9CA3AF" /></div>
    </div>
  );
  if (v === 3) return (
    <div ref={ref} style={cadre(W, H, { background: CARBON, display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
      <div style={{ width: 270, background: '#fff', padding: '26px 20px', fontFamily: "'Courier New', monospace", color: CARBON, display: 'flex', flexDirection: 'column', gap: 8, clipPath: 'polygon(0 0,100% 0,100% 96%,92% 100%,84% 96%,76% 100%,68% 96%,60% 100%,52% 96%,44% 100%,36% 96%,28% 100%,20% 96%,12% 100%,4% 96%,0 100%)' }}>
        <T s={16} w={700} style={{ textAlign: 'center', fontFamily: 'inherit' }}>PIECESTROTTINETTES.FR</T>
        <T s={14} style={{ textAlign: 'center', fontFamily: 'inherit' }}>— ticket de remise —</T>
        <div style={{ borderTop: `2px dashed ${CARBON}`, margin: '6px 0' }} />
        <T s={15} style={{ fontFamily: 'inherit' }}>Remise ............ −10 %</T>
        <T s={15} style={{ fontFamily: 'inherit' }}>Code</T>
        <T f={DISPLAY} s={30} w={900} c={VERT} style={{ textAlign: 'center' }}>{d.code}</T>
        <div style={{ borderTop: `2px dashed ${CARBON}`, margin: '6px 0' }} />
        <T s={14} style={{ textAlign: 'center', fontFamily: 'inherit' }}>Collaboration commerciale</T>
      </div>
    </div>
  );
  if (v === 4) return (
    <div ref={ref} style={cadre(W, H, { background: '#fff' })}>
      <Rayons cx="50%" cy={300} r={700} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 }}>
        <T f={DISPLAY} s={64} w={900}>−10 %</T>
        <T f={DISPLAY} s={18} w={900} style={{ textTransform: 'uppercase', textAlign: 'center' }}>sur tes pièces de trott</T>
        <div style={{ marginTop: 22, background: VERT, borderRadius: 999, padding: '14px 28px' }}><T f={DISPLAY} s={30} w={900} c="#fff">{d.code}</T></div>
        <T s={16} w={700} style={{ marginTop: 12 }}>{domaine(d.lien)}</T>
      </div>
      <div style={{ position: 'absolute', bottom: 26, width: '100%', display: 'flex', justifyContent: 'center' }}><Mention /></div>
    </div>
  );
  return (
    <div ref={ref} style={cadre(W, H, { background: '#0f120f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 })}>
      <T s={17} c="#cfd6cc">mon code atelier</T>
      <T f={DISPLAY} s={48} w={900} c="#bfe8cb" style={{ textShadow: `0 0 12px ${VERT}, 0 0 28px ${VERT}` }}>{d.code}</T>
      <T s={18} c="#fff">−10 % sur tes pièces</T>
      <T s={15} w={700} c="#e5e7eb">{domaine(d.lien)}</T>
      <div style={{ position: 'absolute', bottom: 26 }}><Mention color="#9CA3AF" /></div>
    </div>
  );
});
Code.displayName = 'KitCode';

/* ── 4. STICKER VIDÉO (PNG transparent à poser sur une vidéo, 1080 × 1080) ── */
const Sticker = forwardRef<HTMLDivElement, P>(({ v, d }, ref) => {
  const W = 360;
  const base = cadre(W, W, { background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' });
  if (v === 1) return (
    <div ref={ref} style={base}>
      <div style={{ background: '#fff', borderRadius: 999, padding: '14px 24px', boxShadow: '0 4px 14px rgba(0,0,0,.25)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <T s={15}>Code <b>−10 %</b></T>
        <T f={DISPLAY} s={30} w={900} c={VERT}>{d.code}</T>
      </div>
    </div>
  );
  if (v === 2) return (
    <div ref={ref} style={{ ...base, alignItems: 'flex-end', paddingBottom: 40 }}>
      <div style={{ width: 330, background: CARBON, borderRadius: 16, padding: 12, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 14px rgba(0,0,0,.3)' }}>
        <div style={{ background: '#fff', padding: 4, borderRadius: 8 }}><QrSvg value={d.lien} size={72} /></div>
        <div><T s={14} c="#cfd6cc">−10 % sur tes pièces</T><T f={DISPLAY} s={24} w={900} c="#fff">{d.code}</T><T s={14} w={700} c="#e5e7eb">{domaine(d.lien)}</T></div>
      </div>
    </div>
  );
  if (v === 3) return (
    <div ref={ref} style={base}>
      <div style={{ width: 230, height: 230, borderRadius: '50%', background: '#fff', boxShadow: `0 0 0 10px ${VERT}, 0 0 0 16px #fff, 0 6px 18px rgba(0,0,0,.3)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-8deg)' }}>
        <T f={DISPLAY} s={40} w={900}>−10 %</T>
        <T f={DISPLAY} s={22} w={900} c={VERT}>{d.code}</T>
      </div>
    </div>
  );
  if (v === 4) return (
    <div ref={ref} style={base}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ background: ORANGE, borderRadius: 12, padding: '10px 18px', boxShadow: '0 4px 14px rgba(0,0,0,.25)' }}><T f={DISPLAY} s={20} w={900} c="#fff">LIEN EN BIO</T></div>
        <svg width="60" height="70" viewBox="0 0 60 70"><path d="M30 0 V52 M10 34 L30 60 L50 34" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M30 0 V52 M10 34 L30 60 L50 34" stroke={CARBON} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <div style={{ background: '#fff', borderRadius: 12, padding: '8px 16px' }}><T s={15}>code <b style={{ color: VERT }}>{d.code}</b> · −10 %</T></div>
      </div>
    </div>
  );
  return (
    <div ref={ref} style={base}>
      <div style={{ position: 'relative', background: '#fff', padding: '18px 26px 18px 46px', clipPath: 'polygon(14% 0,100% 0,100% 100%,14% 100%,0 50%)', boxShadow: '0 4px 14px rgba(0,0,0,.25)' }}>
        <span style={{ position: 'absolute', left: 22, top: '50%', marginTop: -7, width: 14, height: 14, borderRadius: '50%', background: CARBON }} />
        <T s={15} c={GRIS}>−10 % avec le code</T>
        <T f={DISPLAY} s={30} w={900} c={VERT}>{d.code}</T>
      </div>
    </div>
  );
});
Sticker.displayName = 'KitSticker';

/* ── 5. POST PIÈCES DU MOMENT (carré 4:5, 1080 × 1350) ── */
const Post = forwardRef<HTMLDivElement, P>(({ v, d }, ref) => {
  const W = 360, H = 450;
  const pieces = (d.pieces ?? []).slice(0, 3);
  const Img = ({ p, s }: { p: { nom: string; image: string }; s: number }) => <img src={p.image} alt="" crossOrigin="anonymous" style={{ width: s, height: s, objectFit: 'contain', display: 'block' }} />;
  if (v === 1) return (
    <div ref={ref} style={cadre(W, H, { background: '#fff', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 })}>
      <T f={DISPLAY} s={20} w={900} style={{ textTransform: 'uppercase' }}>Les pièces qui sauvent ta trott</T>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {pieces.map((p) => <div key={p.nom} style={{ background: BEIGE, borderRadius: 12, padding: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}><Img p={p} s={86} /><T s={14} style={{ textAlign: 'center' }}>{p.nom}</T></div>)}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div><T s={15}>−10 % avec mon code</T><T f={DISPLAY} s={28} w={900} c={VERT}>{d.code}</T><Mention /></div>
        <QrSvg value={d.lien} size={78} />
      </div>
    </div>
  );
  if (v === 2) return (
    <div ref={ref} style={cadre(W, H, { background: CARBON, padding: 20, display: 'flex', flexDirection: 'column' })}>
      <T f={DISPLAY} s={14} w={800} c="#cfd6cc" style={{ letterSpacing: 2 }}>SUR L'ÉTABLI CETTE SEMAINE</T>
      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 170, borderBottom: '10px solid #6b5a43' }}>
        {pieces.map((p, i) => <Img key={p.nom} p={p} s={i === 1 ? 120 : 96} />)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>{pieces.map((p) => <T key={p.nom} s={14} c="#e5e7eb" style={{ width: 100, textAlign: 'center' }}>{p.nom}</T>)}</div>
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div><T s={15} c="#e5e7eb">−10 % avec</T><T f={DISPLAY} s={28} w={900} c="#fff">{d.code}</T><Mention color="#9CA3AF" /></div>
        <div style={{ background: '#fff', padding: 4, borderRadius: 8 }}><QrSvg value={d.lien} size={70} /></div>
      </div>
    </div>
  );
  if (v === 3) return (
    <div ref={ref} style={cadre(W, H, { background: BEIGE, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 })}>
      <T f={DISPLAY} s={18} w={900}>Ma liste d'entretien</T>
      {pieces.map((p) => (
        <div key={p.nom} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 12, padding: 8 }}>
          <Img p={p} s={62} /><T s={15} w={700} style={{ flex: 1 }}>{p.nom}</T><span style={{ width: 22, height: 22, borderRadius: 6, background: VERT, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 15 }}>✓</span>
        </div>
      ))}
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div><T s={15}>Code −10 %</T><T f={DISPLAY} s={26} w={900} c={VERT}>{d.code}</T><Mention /></div>
        <QrSvg value={d.lien} size={72} bg={BEIGE} />
      </div>
    </div>
  );
  if (v === 4) return (
    <div ref={ref} style={cadre(W, H, { background: '#fff' })}>
      <Rayons cx="50%" cy={200} r={520} />
      <div style={{ position: 'absolute', top: 20, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <T f={DISPLAY} s={40} w={900}>−10 %</T><T f={DISPLAY} s={15} w={900} style={{ textTransform: 'uppercase' }}>sur ces pièces et toutes les autres</T>
      </div>
      <div style={{ position: 'absolute', top: 130, left: 10, right: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {pieces.map((p, i) => <div key={p.nom} style={{ transform: `rotate(${(i - 1) * 8}deg)`, margin: '0 -6px' }}><Img p={p} s={i === 1 ? 140 : 110} /></div>)}
      </div>
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div><T s={15}>Le code de {d.nom}</T><T f={DISPLAY} s={28} w={900} c={VERT}>{d.code}</T><Mention /></div>
        <div style={{ background: '#fff', padding: 4, borderRadius: 10, boxShadow: '0 3px 10px rgba(0,0,0,.12)' }}><QrSvg value={d.lien} size={70} /></div>
      </div>
    </div>
  );
  return (
    <div ref={ref} style={cadre(W, H, { background: VERT, padding: 18 })}>
      {pieces.map((p, i) => (
        <div key={p.nom} style={{ position: 'absolute', left: [18, 140, 70][i], top: [24, 40, 180][i], transform: `rotate(${[-6, 5, -2][i]}deg)`, background: '#fff', padding: '8px 8px 6px', boxShadow: '0 4px 12px rgba(0,0,0,.25)' }}>
          <div style={{ width: 120, height: 110, background: BEIGE, display: 'grid', placeItems: 'center' }}><Img p={p} s={100} /></div>
          <T s={14} style={{ width: 120, marginTop: 4 }}>{p.nom}</T>
        </div>
      ))}
      <div style={{ position: 'absolute', left: 18, right: 18, bottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div><T s={15} c="#fff">−10 % avec</T><T f={DISPLAY} s={28} w={900} c="#fff">{d.code}</T><Mention color="#E5E7EB" /></div>
        <div style={{ background: '#fff', padding: 4, borderRadius: 8 }}><QrSvg value={d.lien} size={68} /></div>
      </div>
    </div>
  );
});
Post.displayName = 'KitPost';

/* ── 6. BANNIÈRE LIEN EN BIO (1500 × 500) ── */
const Banniere = forwardRef<HTMLDivElement, P>(({ v, d }, ref) => {
  const W = 480, H = 160; // exporté ×3,125 → 1500 × 500 (une hauteur fractionnaire est arrondie à l'export)
  const pieces = (d.pieces ?? []).slice(0, 3);
  if (v === 1) return (
    <div ref={ref} style={cadre(W, H, { background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' })}>
      <div><T s={15}>−10 % sur tes pièces avec mon code</T><T f={DISPLAY} s={34} w={900} c={VERT}>{d.code}</T><T s={15} w={700}>{domaine(d.lien)}</T></div>
      <QrSvg value={d.lien} size={110} />
    </div>
  );
  if (v === 2) return (
    <div ref={ref} style={cadre(W, H, { background: CARBON, padding: '0 22px', display: 'flex', alignItems: 'center', gap: 16 })}>
      <div style={{ display: 'flex', gap: 2 }}>{pieces.map((p) => <img key={p.nom} src={p.image} alt="" crossOrigin="anonymous" style={{ width: 72, height: 96, objectFit: 'contain' }} />)}</div>
      <div style={{ flex: 1 }}><T s={14} c="#cfd6cc">Pièces de trott · −10 %</T><T f={DISPLAY} s={30} w={900} c="#fff">{d.code}</T><T s={14} w={700} c="#e5e7eb">{domaine(d.lien)}</T></div>
    </div>
  );
  if (v === 3) return (
    <div ref={ref} style={cadre(W, H, { background: '#fff' })}>
      <Rayons cx={420} cy={84} r={520} />
      <div style={{ position: 'absolute', left: 24, top: 26 }}><T f={DISPLAY} s={44} w={900}>−10 %</T><T f={DISPLAY} s={15} w={900} style={{ textTransform: 'uppercase' }}>sur tes pièces de trott</T></div>
      <div style={{ position: 'absolute', right: 24, top: 34, background: VERT, borderRadius: 999, padding: '12px 22px' }}><T f={DISPLAY} s={26} w={900} c="#fff">{d.code}</T></div>
      <div style={{ position: 'absolute', right: 30, bottom: 22 }}><T s={14} w={700}>{domaine(d.lien)}</T></div>
    </div>
  );
  if (v === 4) return (
    <div ref={ref} style={cadre(W, H, { background: '#2b2f2a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 })}>
      <div style={{ width: 290, height: 80, background: '#fff', borderRadius: 10, border: `4px solid ${CARBON}`, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 30, background: '#1d4ed8', display: 'grid', placeItems: 'center' }}><T s={14} w={800} c="#fff">F</T></div>
        <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}><T f={DISPLAY} s={30} w={900}>{d.code}</T></div>
      </div>
      <div><T s={15} c="#fff">−10 %</T><T s={14} w={700} c="#e5e7eb">{domaine(d.lien)}</T></div>
    </div>
  );
  return (
    <div ref={ref} style={cadre(W, H, { background: BEIGE, padding: '0 22px', display: 'flex', alignItems: 'center', gap: 18 })}>
      <Badge photo={d.photo} nom={d.nom} size={120} />
      <div style={{ flex: 1 }}><T f={DISPLAY} s={18} w={900}>{d.nom}</T><T s={14} c={GRIS}>ambassadeur piecestrottinettes.fr</T><T f={DISPLAY} s={28} w={900} c={VERT} style={{ marginTop: 6 }}>{d.code}</T></div>
      <QrSvg value={d.lien} size={92} bg={BEIGE} />
    </div>
  );
});
Banniere.displayName = 'KitBanniere';

export const FORMATS: KitFormat[] = [
  { id: 'carte', titre: 'Ta carte', usage: 'À envoyer en message ou à poster : ta carte ambassadeur avec code et QR.', w: 360, h: 225, ratio: 3, noms: ['Littéral', 'Carbone', 'Carte Rider', 'Affiche', 'Bon d\'atelier'], Comp: Carte },
  { id: 'qr', titre: 'QR seul', usage: 'À imprimer en sticker pour ta trott, ton casque ou un comptoir.', w: 360, h: 360, ratio: 3, transparent: true, noms: ['Littéral', 'Scanne-moi', 'Pastille', 'Affiche', 'Étiquette'], Comp: Qr },
  { id: 'code', titre: 'Code seul', usage: 'Story sans visage : ton code en grand.', w: 360, h: 640, ratio: 3, noms: ['Littéral', 'Plaque', 'Ticket', 'Affiche', 'Néon'], Comp: Code },
  { id: 'sticker', titre: 'Sticker vidéo', usage: 'PNG transparent à poser par-dessus ta vidéo TikTok ou ta story.', w: 360, h: 360, ratio: 3, transparent: true, noms: ['Littéral', 'Bandeau', 'Tampon', 'Lien en bio', 'Étiquette'], Comp: Sticker },
  { id: 'post', titre: 'Pièces du moment', usage: 'Post carré avec 3 pièces qui s\'usent le plus vite.', w: 360, h: 450, ratio: 3, noms: ['Littéral', 'Établi', 'Liste d\'entretien', 'Affiche', 'Polaroïds'], Comp: Post },
  { id: 'banniere', titre: 'Bannière lien en bio', usage: 'Pour Linktree ou la bannière de ton profil.', w: 480, h: 160, ratio: 3.125, noms: ['Littéral', 'Établi', 'Affiche', 'Plaque', 'Avec ton badge'], Comp: Banniere },
];

export { Box };
