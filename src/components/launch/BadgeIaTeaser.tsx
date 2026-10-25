/* « Ton badge IA » pour donner envie de s'inscrire (25/10/2026, Nolan : « sur la homepage et sur le pop-up… marquer
   qu'en créant sa carte Rider on a son profil en IA… c'est vraiment un truc gaming »).
   Faits seulement : inscription gratuite, un selfie, l'IA dessine 2 badges, tu gardes ton préféré, 3 essais ; le badge
   devient ta photo de profil et s'affiche sur ta carte Rider. Exemple = le badge de Nolan. 5 propositions ; n°1 = littéral. */
import { Sparkles } from 'lucide-react';

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = '#1A1A1A';
const GREEN = '#4A7C59';
const SOFT = '#8FBF9C';
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;
const ch = (c: number) => `polygon(0 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, ${c}px 100%, 0 calc(100% - ${c}px))`;
export const EXEMPLE_BADGE_IA = '/kit/badge-exemple.webp';
export const NOMS_TEASER = ['Littéral', 'Avant/après', 'Mode jeu', 'Sur ta carte', 'Bandeau nouveau'] as const;

const Silhouette = ({ s, dark }: { s: number; dark: boolean }) => (
  <span className="inline-flex items-center justify-center shrink-0" style={{ width: s, height: s, background: dark ? 'rgba(255,255,255,0.12)' : '#E5E7EB', clipPath: ch(8) }}>
    <svg width={s * 0.56} height={s * 0.56} viewBox="0 0 24 24" fill="none" stroke={dark ? 'rgba(255,255,255,0.6)' : '#9CA3AF'} strokeWidth="1.6"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
  </span>
);
const Fleche = ({ dark }: { dark: boolean }) => (
  <svg width="30" height="18" viewBox="0 0 34 20" className="shrink-0"><path d="M2 10h26M20 3l8 7-8 7" stroke={dark ? '#FFFFFF' : CARBON} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/** `dark` : posé sur un fond sombre (accueil, wallpaper) ; sinon sur fond clair (fenêtre d'arrivée). */
const BadgeIaTeaser = ({ v, dark = false }: { v: number; dark?: boolean }) => {
  const fg = dark ? '#FFFFFF' : CARBON;
  const mute = dark ? 'rgba(255,255,255,0.82)' : '#374151';

  if (v === 1) return (
    <p className="flex items-start gap-2 text-[15px] font-semibold leading-snug" style={{ fontFamily: FONT, color: fg }}>
      <Sparkles className="w-5 h-5 shrink-0 mt-px" style={{ color: dark ? SOFT : GREEN }} />
      <span>En créant ta carte Rider, ta photo de profil devient un <b>badge de rider dessiné par l'IA</b>. Gratuit.</span>
    </p>
  );

  if (v === 2) return (
    <div className="flex items-center gap-3 p-3" style={{ background: dark ? 'rgba(26,26,26,0.72)' : '#FFFFFF', clipPath: cut(12), boxShadow: dark ? 'inset 0 0 0 1px rgba(255,255,255,0.2)' : 'inset 0 0 0 1px #E5E7EB' }}>
      <Silhouette s={52} dark={dark} />
      <Fleche dark={dark} />
      <img src={EXEMPLE_BADGE_IA} alt="Exemple de badge rider IA" className="w-[60px] h-[60px] rounded-full object-cover shrink-0" />
      <div className="min-w-0">
        <p className="text-[15px] uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', color: fg }}>Ton selfie devient ton badge</p>
        <p className="mt-0.5 text-sm" style={{ fontFamily: FONT, color: mute }}>Offert avec ta carte Rider.</p>
      </div>
    </div>
  );

  if (v === 3) return (
    <div className="p-3.5" style={{ background: CARBON, clipPath: cut(14), boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ fontFamily: FONT, color: SOFT }}>Badge rider IA</span>
        <span className="px-2 py-0.5 text-sm font-extrabold text-white" style={{ fontFamily: FONT, background: GREEN, clipPath: cut(6) }}>3 essais · gratuit</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <img src={EXEMPLE_BADGE_IA} alt="Exemple de badge rider IA" className="w-[64px] h-[64px] rounded-full object-cover shrink-0" style={{ boxShadow: `0 0 0 3px ${SOFT}` }} />
        <span className="w-[64px] h-[64px] rounded-full shrink-0 inline-flex items-center justify-center text-[28px]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.3)' }}>?</span>
        <p className="min-w-0 text-[15px] leading-snug text-white" style={{ fontFamily: FONT }}>Un selfie, l'IA t'en dessine <b>2</b>. Tu gardes le meilleur.</p>
      </div>
    </div>
  );

  if (v === 4) return (
    <div className="flex items-center gap-3">
      <div className="relative w-[150px] shrink-0 p-2.5" style={{ background: CARBON, clipPath: ch(12), boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }}>
        <div className="flex items-center gap-2">
          <img src={EXEMPLE_BADGE_IA} alt="" className="w-9 h-9 object-cover bg-white" style={{ clipPath: ch(5) }} />
          <div className="min-w-0">
            <p className="text-[14px] uppercase leading-none text-white truncate" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic' }}>Toi</p>
            <p className="mt-1 text-sm leading-none" style={{ fontFamily: FONT, color: SOFT }}>Carte Rider</p>
          </div>
        </div>
        <div className="mt-2 h-14" style={{ background: 'linear-gradient(180deg, rgba(143,191,156,0.25), rgba(255,255,255,0.04))', clipPath: cut(6) }} />
      </div>
      <p className="min-w-0 text-[15px] leading-snug" style={{ fontFamily: FONT, color: fg }}>
        <b className="block uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic' }}>Ta tête en badge</b>
        <span style={{ color: mute }}>sur ta carte Rider et ton profil. L'IA le dessine à partir d'un selfie.</span>
      </p>
    </div>
  );

  return (
    <div className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5" style={{ background: GREEN, clipPath: cut(10) }}>
      <img src={EXEMPLE_BADGE_IA} alt="" className="w-11 h-11 rounded-full object-cover shrink-0 bg-white" />
      <span className="px-1.5 py-0.5 text-sm font-extrabold uppercase text-[#1A1A1A] bg-white shrink-0" style={{ fontFamily: FONT, clipPath: cut(5) }}>Nouveau</span>
      <p className="min-w-0 text-[15px] font-bold leading-tight text-white" style={{ fontFamily: FONT }}>Ton badge rider IA, offert à l'inscription</p>
    </div>
  );
};

export default BadgeIaTeaser;

/** Variante par l'adresse : `?badgeia=1..5` (gardée pour l'onglet), accueil et fenêtre d'arrivée ensemble.
 *  Défaut 0 = rien d'affiché, en attendant le choix de Nolan. */
export const BADGE_IA_DEFAUT = 0;
export function readBadgeIaVariant(): { v: number; force: boolean } {
  if (typeof window === 'undefined') return { v: BADGE_IA_DEFAUT, force: false };
  try {
    const q = new URLSearchParams(window.location.search).get('badgeia');
    if (q !== null && /^[0-5]$/.test(q)) { window.sessionStorage.setItem('pt-badgeia', q); return { v: Number(q), force: true }; }
    const s = window.sessionStorage.getItem('pt-badgeia');
    return s && /^[0-5]$/.test(s) ? { v: Number(s), force: true } : { v: BADGE_IA_DEFAUT, force: false };
  } catch {
    return { v: BADGE_IA_DEFAUT, force: false };
  }
}
