import { forwardRef, type ReactNode } from 'react';
import { Badge, BEIGE, BlocCode, CARBON, cadre, coupe, DISPLAY, domaine, FOND, GRIS, type KitData, Logo, Mention, ORANGE, QrSvg, Rayons, SurTitre, T, TEXTE, Titre, Trott, VERT, VERT_FONCE } from './kitBase';

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
      <div style={{ position: 'absolute', left: 18, bottom: 12 }}><T s={14} c="#e5e7eb">Mon code −10 %</T><T f={DISPLAY} s={24} w={900} c="#fff">{d.code}</T><div style={{ marginTop: 4 }}><Mention color="#e5e7eb" /></div></div>
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
      <Mention color="#9CA3AF" />
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

/* ── 3. CODE SEUL (story sans visage, 1080 × 1920) — 2e tour 25/10 : DA du site, plus trottinette ── */
const Code = forwardRef<HTMLDivElement, P>(({ v, d }, ref) => {
  const W = 360, H = 640;
  const nomTrott = d.trott?.nom ?? 'ta trottinette';
  if (v === 1) return (
    <div ref={ref} style={cadre(W, H, { background: FOND, padding: '44px 26px 26px', display: 'flex', flexDirection: 'column' })}>
      <SurTitre>Code ambassadeur</SurTitre>
      <Titre l={['−10 %', 'sur tes', 'pièces.']} vert={[0]} s={58} style={{ marginTop: 18 }} />
      <T s={17} c="#374151" style={{ marginTop: 18, lineHeight: 1.35 }}>Chambres à air, pneus, plaquettes, chargeurs : avec mon code sur piecestrottinettes.fr.</T>
      <div style={{ marginTop: 34 }}><BlocCode code={d.code} s={34} pad="16px 22px" /></div>
      <div style={{ marginTop: 'auto' }}><Logo w={150} /><div style={{ marginTop: 6 }}><Mention /></div></div>
    </div>
  );
  if (v === 2) return (
    <div ref={ref} style={cadre(W, H, { background: FOND })}>
      <div style={{ position: 'absolute', top: 40, left: 26, right: 26 }}>
        <SurTitre>{nomTrott}</SurTitre>
        <Titre l={['Ma trott', 'roule avec', 'ce code.']} vert={[2]} s={40} style={{ marginTop: 14 }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 228, height: 260, display: 'flex', justifyContent: 'center' }}><Trott d={d} h={260} /></div>
      <div style={{ position: 'absolute', left: 26, right: 26, bottom: 26, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><BlocCode code={d.code} s={30} bg={VERT} /><T s={17} w={700}>−10 %</T></div>
        <div><Logo w={140} /><div style={{ marginTop: 6 }}><Mention /></div></div>
      </div>
    </div>
  );
  if (v === 3) return (
    <div ref={ref} style={cadre(W, H, { background: FOND, padding: '40px 26px 26px', display: 'flex', flexDirection: 'column' })}>
      <Titre l={['Plus jamais', 'la mauvaise', 'pièce.']} vert={[1]} s={30} />
      <div style={{ marginTop: 18, background: '#fff', borderRadius: 18, boxShadow: '0 6px 20px rgba(0,0,0,.08)', padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ height: 190, display: 'flex', alignItems: 'center' }}><Trott d={d} h={182} /></div>
        <div style={{ alignSelf: 'stretch', marginTop: 10 }}>
          <span style={{ display: 'block', width: 26, height: 4, background: VERT, marginBottom: 8 }} />
          <T s={14} w={700} c={GRIS} style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>Pièces compatibles</T>
          <Titre l={[nomTrott]} s={22} style={{ marginTop: 4 }} />
        </div>
      </div>
      <div style={{ marginTop: 18 }}><T s={16} w={700}>−10 % avec mon code</T><div style={{ marginTop: 8 }}><BlocCode code={d.code} s={28} fleche /></div></div>
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Logo w={130} /><Mention /></div>
    </div>
  );
  if (v === 4) return (
    <div ref={ref} style={cadre(W, H, { background: FOND, padding: '56px 22px 26px', display: 'flex', flexDirection: 'column' })}>
      <SurTitre>Compatibilité garantie</SurTitre>
      <Titre l={['Plus jamais', 'la mauvaise', 'pièce.']} vert={[1]} s={36} style={{ marginTop: 16 }} />
      <T s={15} c={GRIS} style={{ marginTop: 14 }}>Tape ton modèle : on ne te montre que les pièces qui vont dessus.</T>
      <div style={{ marginTop: 26, display: 'flex', alignItems: 'stretch', background: '#fff', border: '1.5px solid #E2DCD0', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '14px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <T s={14} c={GRIS}>Code promo</T>
          <T f={DISPLAY} s={22} w={900} style={{ fontStyle: 'italic', letterSpacing: '0.02em' }}>{d.code}</T>
        </div>
        <div style={{ background: CARBON, color: '#fff', padding: '0 16px', display: 'flex', alignItems: 'center', clipPath: coupe(10) }}><T f={DISPLAY} s={16} w={900} c="#fff" style={{ fontStyle: 'italic' }}>−10 % →</T></div>
      </div>
      <div style={{ marginTop: 16, height: 210, display: 'flex', justifyContent: 'center' }}><Trott d={d} h={210} /></div>
      <div style={{ marginTop: 'auto' }}><Logo w={140} /><div style={{ marginTop: 6 }}><Mention /></div></div>
    </div>
  );
  return (
    <div ref={ref} style={cadre(W, H, { background: VERT })}>
      <div style={{ position: 'absolute', top: 40, left: 26, right: 26 }}>
        <SurTitre c="#E5EFE7" carre="#fff">Mon code</SurTitre>
        <Titre l={['−10 %', 'sur tes', 'pièces.']} c="#fff" s={54} style={{ marginTop: 16 }} />
      </div>
      <div style={{ position: 'absolute', right: -20, top: 236, height: 300, display: 'flex' }}><Trott d={d} h={300} style={{ filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.25))' }} /></div>
      <div style={{ position: 'absolute', left: 26, right: 26, bottom: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><BlocCode code={d.code} s={32} bg="#fff" fg={CARBON} /></div>
        <div><Logo w={140} neg /><div style={{ marginTop: 6 }}><Mention color="#E5E7EB" /></div></div>
      </div>
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
        <div><T s={14} c="#cfd6cc">−10 % sur tes pièces</T><T f={DISPLAY} s={24} w={900} c="#fff">{d.code}</T><T s={14} w={700} c="#e5e7eb">{domaine(d.lien)}</T><Mention color="#9CA3AF" /></div>
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

/* ── 5. POST PIÈCES DU MOMENT (4:5, 1080 × 1350) — 2e tour 25/10 : fonds clairs (pièces noires lisibles), DA du site ── */
const Post = forwardRef<HTMLDivElement, P>(({ v, d }, ref) => {
  const W = 360, H = 450;
  const pieces = (d.pieces ?? []).slice(0, 3);
  const Img = ({ p, s }: { p: { nom: string; image: string }; s: number }) => <img src={p.image} alt="" crossOrigin="anonymous" style={{ width: s, height: s, objectFit: 'contain', display: 'block' }} />;
  const Pied = ({ c = CARBON, neg = false }: { c?: string; neg?: boolean }) => (
    <div style={{ position: 'absolute', left: 20, right: 20, bottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><T s={14} w={700} c={c}>−10 % avec mon code</T><BlocCode code={d.code} s={24} pad="10px 16px" bg={neg ? '#fff' : CARBON} fg={neg ? CARBON : '#fff'} /><Mention color={neg ? '#E5E7EB' : GRIS} /></div>
      <div style={{ background: '#fff', padding: 4, borderRadius: 8 }}><QrSvg value={d.lien} size={70} /></div>
    </div>
  );
  if (v === 1) return (
    <div ref={ref} style={cadre(W, H, { background: FOND })}>
      <div style={{ position: 'absolute', top: 22, left: 20, right: 20 }}>
        <SurTitre>Les pièces du moment</SurTitre>
        <Titre l={['Ce qui s\'use', 'en premier.']} vert={[1]} s={28} style={{ marginTop: 10 }} />
      </div>
      <div style={{ position: 'absolute', top: 124, left: 20, right: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {pieces.map((p) => <div key={p.nom} style={{ background: '#fff', borderRadius: 14, padding: 8, boxShadow: '0 4px 14px rgba(0,0,0,.07)', display: 'flex', flexDirection: 'column', gap: 6 }}><Img p={p} s={90} /><T s={14} w={600}>{p.nom}</T></div>)}
      </div>
      <Pied />
    </div>
  );
  if (v === 2) return (
    <div ref={ref} style={cadre(W, H, { background: '#fff' })}>
      <div style={{ position: 'absolute', top: 22, left: 20, right: 20 }}>
        <Titre l={['−10 %', 'sur ces pièces.']} vert={[0]} s={34} />
        <T s={14} c={GRIS} style={{ marginTop: 6 }}>Et sur toutes les autres du site.</T>
      </div>
      <div style={{ position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {pieces.map((p, i) => <div key={p.nom} style={{ transform: `rotate(${(i - 1) * 7}deg)`, margin: '0 -4px', background: FOND, borderRadius: 16, padding: 6, boxShadow: '0 6px 16px rgba(0,0,0,.10)' }}><Img p={p} s={i === 1 ? 130 : 100} /></div>)}
      </div>
      <Pied />
    </div>
  );
  if (v === 3) return (
    <div ref={ref} style={cadre(W, H, { background: '#F3EEE6' })}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#D9D1C3 1.6px, transparent 1.7px)', backgroundSize: '18px 18px', opacity: 0.8 }} />
      <div style={{ position: 'absolute', top: 22, left: 20, right: 20 }}>
        <SurTitre>Sur l'établi cette semaine</SurTitre>
        <Titre l={['Les 3 pièces', 'qui sauvent', 'ta trott.']} vert={[1]} s={24} style={{ marginTop: 10 }} />
      </div>
      <div style={{ position: 'absolute', left: 14, right: 14, top: 236, height: 14, background: '#D8C3A0', borderRadius: 3, boxShadow: '0 3px 0 #B99E76' }} />
      <div style={{ position: 'absolute', left: 14, right: 14, top: 128, height: 110, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end' }}>
        {pieces.map((p) => <div key={p.nom} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><Img p={p} s={100} /></div>)}
      </div>
      <div style={{ position: 'absolute', left: 14, right: 14, top: 258, display: 'flex', justifyContent: 'space-around' }}>{pieces.map((p) => <T key={p.nom} s={14} w={600} style={{ width: 100, textAlign: 'center' }}>{p.nom}</T>)}</div>
      <Pied />
    </div>
  );
  if (v === 4) return (
    <div ref={ref} style={cadre(W, H, { background: FOND, padding: 20 })}>
      <SurTitre>Mes indispensables</SurTitre>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pieces.map((p) => (
          <div key={p.nom} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 14, padding: '6px 10px', boxShadow: '0 3px 10px rgba(0,0,0,.06)' }}>
            <Img p={p} s={64} />
            <div style={{ flex: 1 }}><span style={{ display: 'block', width: 22, height: 3, background: VERT, marginBottom: 6 }} /><Titre l={[p.nom]} s={14} /></div>
          </div>
        ))}
      </div>
      <Pied />
    </div>
  );
  return (
    <div ref={ref} style={cadre(W, H, { background: FOND })}>
      <div style={{ position: 'absolute', top: 22, left: 20, right: 20 }}>
        <SurTitre>{d.trott?.nom ?? 'Ma trott'}</SurTitre>
        <Titre l={['Autour de', 'ma trott.']} vert={[1]} s={26} style={{ marginTop: 10 }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 118, height: 196, display: 'flex', justifyContent: 'center' }}><Trott d={d} h={196} /></div>
      {pieces.map((p, i) => (
        <div key={p.nom} style={{ position: 'absolute', left: [14, 246, 246][i], top: [160, 118, 222][i], width: 100, background: '#fff', borderRadius: 12, padding: 6, boxShadow: '0 4px 12px rgba(0,0,0,.10)' }}>
          <Img p={p} s={60} /><T s={14} w={600} style={{ marginTop: 2, lineHeight: 1.1 }}>{p.nom}</T>
        </div>
      ))}
      <Pied />
    </div>
  );
});
Post.displayName = 'KitPost';

/* ── 6. BANNIÈRE LIEN EN BIO (1500 × 500) — 2e tour 25/10 : à partir de « Avec ton badge », DA du site, rien ne déborde ── */
const Banniere = forwardRef<HTMLDivElement, P>(({ v, d }, ref) => {
  const W = 480, H = 160; // exporté ×3,125 → 1500 × 500 (une hauteur fractionnaire est arrondie à l'export)
  if (v === 1) return (
    <div ref={ref} style={cadre(W, H, { background: FOND, padding: '0 22px', display: 'flex', alignItems: 'center', gap: 16 })}>
      <Badge photo={d.photo} nom={d.nom} size={108} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SurTitre>Ambassadeur</SurTitre>
        <Titre l={[d.nom]} s={18} style={{ textTransform: 'none' }} />
        <div><BlocCode code={d.code} s={22} pad="8px 14px" /></div>
      </div>
      <QrSvg value={d.lien} size={96} bg={FOND} />
    </div>
  );
  if (v === 2) return (
    <div ref={ref} style={cadre(W, H, { background: FOND })}>
      <div style={{ position: 'absolute', left: 20, top: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Badge photo={d.photo} nom={d.nom} size={84} />
        <div><Titre l={[d.nom]} s={17} style={{ textTransform: 'none' }} /><T s={14} c={GRIS} style={{ marginTop: 2 }}>−10 % sur tes pièces</T><Mention /></div>
      </div>
      <div style={{ position: 'absolute', left: 20, bottom: 16 }}><BlocCode code={d.code} s={22} pad="8px 14px" bg={VERT} /></div>
      <div style={{ position: 'absolute', right: 6, top: 4, bottom: 4, display: 'flex', alignItems: 'center' }}><Trott d={d} h={152} /></div>
      <div style={{ position: 'absolute', left: 200, bottom: 22 }}><Logo w={110} /></div>
    </div>
  );
  if (v === 3) return (
    <div ref={ref} style={cadre(W, H, { background: '#fff', borderBottom: `5px solid ${VERT}` })}>
      <div style={{ position: 'absolute', left: 20, top: 20 }}>
        <Titre l={['Plus jamais la', 'mauvaise pièce.']} vert={[1]} s={21} />
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}><BlocCode code={d.code} s={20} pad="8px 12px" fleche /><T s={14} w={700}>−10 %</T></div>
      </div>
      <div style={{ position: 'absolute', right: 20, top: 0, bottom: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Badge photo={d.photo} nom={d.nom} size={92} />
        <T s={14} w={700} style={{ maxWidth: 130, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nom}</T>
      </div>
    </div>
  );
  if (v === 4) return (
    <div ref={ref} style={cadre(W, H, { background: CARBON, padding: '0 22px', display: 'flex', alignItems: 'center', gap: 16 })}>
      <Badge photo={d.photo} nom={d.nom} size={104} ring={VERT} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SurTitre c="#cfd6cc">Mon code · −10 %</SurTitre>
        <div><BlocCode code={d.code} s={24} pad="9px 14px" bg="#fff" fg={CARBON} /></div>
        <Logo w={120} neg />
      </div>
      <div style={{ background: '#fff', padding: 5, borderRadius: 8 }}><QrSvg value={d.lien} size={84} /></div>
    </div>
  );
  return (
    <div ref={ref} style={cadre(W, H, { background: VERT })}>
      <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Badge photo={d.photo} nom={d.nom} size={100} ring="#fff" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Titre l={['Ma trott,', 'mes pièces.']} c="#fff" s={19} />
          <div><BlocCode code={d.code} s={20} pad="8px 12px" bg="#fff" fg={CARBON} /></div>
        </div>
      </div>
      <div style={{ position: 'absolute', right: 6, top: 4, bottom: 4, display: 'flex', alignItems: 'center' }}><Trott d={d} h={152} style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.25))' }} /></div>
    </div>
  );
});
Banniere.displayName = 'KitBanniere';

export const FORMATS: KitFormat[] = [
  { id: 'carte', titre: 'Ta carte', usage: 'À envoyer en message ou à poster : ta carte ambassadeur avec code et QR.', w: 360, h: 225, ratio: 3, noms: ['Littéral', 'Carbone', 'Carte Rider', 'Affiche', 'Bon d\'atelier'], Comp: Carte },
  { id: 'qr', titre: 'QR seul', usage: 'À imprimer en sticker pour ta trott, ton casque ou un comptoir.', w: 360, h: 360, ratio: 3, transparent: true, noms: ['Littéral', 'Scanne-moi', 'Pastille', 'Affiche', 'Étiquette'], Comp: Qr },
  { id: 'code', titre: 'Code seul', usage: 'Story sans visage : ton code en grand.', w: 360, h: 640, ratio: 3, noms: ['Littéral', 'Ma trott', 'Carte compat', 'Comme le site', 'Vert maison'], Comp: Code },
  { id: 'sticker', titre: 'Sticker vidéo', usage: 'PNG transparent à poser par-dessus ta vidéo TikTok ou ta story.', w: 360, h: 360, ratio: 3, transparent: true, noms: ['Littéral', 'Bandeau', 'Tampon', 'Lien en bio', 'Étiquette'], Comp: Sticker },
  { id: 'post', titre: 'Pièces du moment', usage: 'Post carré avec 3 pièces qui s\'usent le plus vite.', w: 360, h: 450, ratio: 3, noms: ['Littéral', 'Affiche claire', 'Établi clair', 'Mes indispensables', 'Autour de ma trott'], Comp: Post },
  { id: 'banniere', titre: 'Bannière lien en bio', usage: 'Pour Linktree ou la bannière de ton profil.', w: 480, h: 160, ratio: 3.125, noms: ['Badge + code', 'Badge + ma trott', 'Comme le site', 'Carbone', 'Vert maison'], Comp: Banniere },
];

export { Box };
