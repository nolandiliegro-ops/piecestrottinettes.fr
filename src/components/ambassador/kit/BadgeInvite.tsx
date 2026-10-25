import { Sparkles, X } from 'lucide-react';
import { BEIGE, CARBON, DISPLAY, GRIS, Rayons, T, TEXTE, VERT } from './kitBase';

/* Invitation à créer son badge IA (25/10/2026) — affichée UNE fois : à l'ouverture de l'espace ambassadeur sans badge,
   et juste après la création de la carte Rider. 5 propositions ; la n°1 est la lecture littérale. */

type Props = { v: number; exemple: string; onCreer: () => void; onPlusTard: () => void; contexte: 'ambassadeur' | 'rider' };

const btn: React.CSSProperties = { minHeight: 44, borderRadius: 10, padding: '0 18px', fontFamily: TEXTE, fontWeight: 700, fontSize: 15, cursor: 'pointer', border: 0 };

const Boutons = ({ onCreer, onPlusTard, sombre = false }: { onCreer: () => void; onPlusTard: () => void; sombre?: boolean }) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    <button type="button" onClick={onCreer} style={{ ...btn, background: VERT, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Sparkles size={16} />Créer mon badge</button>
    <button type="button" onClick={onPlusTard} style={{ ...btn, background: 'transparent', color: sombre ? '#e5e7eb' : GRIS }}>Plus tard</button>
  </div>
);

const BadgeInvite = ({ v, exemple, onCreer, onPlusTard, contexte }: Props) => {
  const pourQui = contexte === 'ambassadeur' ? 'Ta photo de profil sur tes visuels de partage.' : 'Ta photo de profil sur ta carte Rider.';

  if (v === 1) return (
    <div style={{ width: 340, background: '#fff', borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 10px 30px rgba(0,0,0,.18)' }}>
      <T f={DISPLAY} s={18} w={900} style={{ textTransform: 'uppercase' }}>Crée ton badge rider</T>
      <T s={15} c="#374151">Un selfie, et l'IA te dessine un badge illustré. {pourQui} Gratuit, 3 essais.</T>
      <Boutons onCreer={onCreer} onPlusTard={onPlusTard} />
    </div>
  );

  if (v === 2) return (
    <div style={{ width: 340, background: '#fff', borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 10px 30px rgba(0,0,0,.18)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ width: 92, height: 92, borderRadius: 16, background: '#E5E7EB', display: 'grid', placeItems: 'center' }}>
          <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.6"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
        </div>
        <svg width="34" height="20" viewBox="0 0 34 20"><path d="M2 10h26M20 3l8 7-8 7" stroke={CARBON} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <img src={exemple} alt="Exemple de badge rider" style={{ width: 104, height: 104, borderRadius: '50%', objectFit: 'cover' }} />
      </div>
      <T f={DISPLAY} s={17} w={900} style={{ textAlign: 'center' }}>Ton selfie devient un badge</T>
      <T s={15} c="#374151" style={{ textAlign: 'center' }}>{pourQui} 30 secondes, gratuit.</T>
      <div style={{ display: 'flex', justifyContent: 'center' }}><Boutons onCreer={onCreer} onPlusTard={onPlusTard} /></div>
    </div>
  );

  if (v === 3) return (
    <div style={{ width: 340, background: BEIGE, borderRadius: 18, padding: 18, display: 'flex', gap: 12, alignItems: 'flex-end', boxShadow: '0 10px 30px rgba(0,0,0,.18)' }}>
      <img src="/skot/hd/skot-photo.webp" alt="" style={{ width: 110, height: 'auto' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 12, border: `2px solid ${CARBON}` }}>
          <T s={15} w={700}>Fais-moi un sourire !</T>
          <T s={14} c="#374151" style={{ marginTop: 4 }}>Je te transforme en badge de rider. {pourQui}</T>
        </div>
        <Boutons onCreer={onCreer} onPlusTard={onPlusTard} />
      </div>
    </div>
  );

  if (v === 4) return (
    <div style={{ width: 360, background: CARBON, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <img src={exemple} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <T s={15} w={700} c="#fff">Ajoute ton badge IA</T>
        <T s={14} c="#cfd6cc">Un selfie, 30 secondes.</T>
      </div>
      <button type="button" onClick={onCreer} style={{ ...btn, background: VERT, color: '#fff', padding: '0 14px' }}>Créer</button>
      <button type="button" onClick={onPlusTard} aria-label="Fermer" style={{ ...btn, background: 'transparent', color: '#9CA3AF', padding: 0, width: 44 }}><X size={18} /></button>
    </div>
  );

  return (
    <div style={{ width: 340, height: 520, background: '#fff', borderRadius: 18, overflow: 'hidden', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,.18)' }}>
      <Rayons cx="50%" cy={190} r={420} />
      <div style={{ position: 'absolute', top: 22, left: 0, right: 0, textAlign: 'center' }}>
        <T f={DISPLAY} s={26} w={900} style={{ textTransform: 'uppercase', textAlign: 'center' }}>Ton badge</T>
        <T f={DISPLAY} s={16} w={900} style={{ textTransform: 'uppercase', textAlign: 'center' }}>de rider t'attend</T>
      </div>
      <div style={{ position: 'absolute', top: 104, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <img src={exemple} alt="Exemple de badge rider" style={{ width: 190, height: 190, borderRadius: '50%', objectFit: 'cover' }} />
      </div>
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <T s={15} c="#374151" style={{ textAlign: 'center' }}>{pourQui} Un selfie, l'IA fait le reste.</T>
        <Boutons onCreer={onCreer} onPlusTard={onPlusTard} />
      </div>
    </div>
  );
};

export default BadgeInvite;
