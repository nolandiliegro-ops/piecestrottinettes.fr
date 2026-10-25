/* « Ton badge IA » pour donner envie de s'inscrire (25/10/2026, Nolan : « sur la homepage et sur le pop-up… marquer
   qu'en créant sa carte Rider on a son profil en IA… c'est vraiment un truc gaming »).
   Faits seulement : inscription gratuite, un selfie, l'IA dessine 2 badges, tu gardes ton préféré, 3 essais.
   Exemple = le badge de Nolan.
   2e tour (25/10, Nolan : « le mode jeu, mais trop de texte… il faut pas que ce soit noir… peut-être un truc à part ») :
   cinq versions « mode jeu », claires, en quelques mots. La n°3 est un bloc à part, sous le bloc garage de l'accueil. */

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = '#1A1A1A';
const GREEN = '#4A7C59';
const SOFT = '#8FBF9C';
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;
export const EXEMPLE_BADGE_IA = '/kit/badge-exemple.webp';
export const NOMS_TEASER = ['Pastille claire', 'Badge vert', 'Bloc à part', 'Lequel tu gardes ?', 'Essais offerts'] as const;

const Rond = ({ s, q = false, ring = SOFT }: { s: number; q?: boolean; ring?: string }) => q
  ? <span className="rounded-full shrink-0 inline-flex items-center justify-center" style={{ width: s, height: s, fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', fontSize: s * 0.42, color: GREEN, background: '#FFFFFF', boxShadow: `inset 0 0 0 2px ${GREEN}` }}>?</span>
  : <img src={EXEMPLE_BADGE_IA} alt="Exemple de badge rider IA" className="rounded-full object-cover shrink-0 bg-white" style={{ width: s, height: s, boxShadow: `0 0 0 3px ${ring}` }} />;

const Gros = ({ children, c = CARBON, s = 16 }: { children: React.ReactNode; c?: string; s?: number }) => (
  <p className="uppercase leading-[0.95]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em', color: c, fontSize: s }}>{children}</p>
);

/** `dark` : posé sur un fond sombre (accueil) ; sinon sur fond clair (fenêtre d'arrivée). Toutes les versions sont claires. */
const BadgeIaTeaser = ({ v, dark = false }: { v: number; dark?: boolean }) => {
  if (v === 1) return (
    <div className="inline-flex items-center gap-3 pl-2 pr-4 py-2 bg-white" style={{ clipPath: cut(12), boxShadow: dark ? 'none' : 'inset 0 0 0 1px #E5E7EB' }}>
      <span className="flex -space-x-3"><Rond s={46} /><Rond s={46} q /></span>
      <Gros s={15}>Ton badge IA<br /><span style={{ color: GREEN }}>offert</span></Gros>
    </div>
  );

  if (v === 2) return (
    <div className="inline-flex items-center gap-3 pl-2 pr-3 py-2" style={{ background: GREEN, clipPath: cut(12) }}>
      <Rond s={50} ring="#FFFFFF" />
      <Gros c="#FFFFFF" s={16}>Joue ton<br />badge IA</Gros>
      <span className="px-2 py-1 text-sm font-extrabold bg-white" style={{ fontFamily: FONT, color: GREEN, clipPath: cut(6) }}>Gratuit</span>
    </div>
  );

  if (v === 3) return (
    <div className="flex items-center justify-between gap-4 p-4" style={{ background: '#FAFAF8', clipPath: cut(16), boxShadow: dark ? 'none' : 'inset 0 0 0 1px #E5E7EB' }}>
      <div className="min-w-0">
        <Gros s={22}>Ton badge<br /><span style={{ color: GREEN }}>rider IA.</span></Gros>
        <p className="mt-2 text-[15px] font-semibold" style={{ fontFamily: FONT, color: '#374151' }}>1 selfie · 2 badges · tu gardes le meilleur</p>
      </div>
      <span className="flex items-center -space-x-4 shrink-0"><Rond s={64} /><Rond s={64} q /></span>
    </div>
  );

  if (v === 4) return (
    <div className="flex items-center gap-4">
      <span className="relative w-[112px] h-[80px] shrink-0">
        <span className="absolute left-0 top-1 w-[62px] h-[74px] bg-white flex items-center justify-center" style={{ transform: 'rotate(-8deg)', clipPath: cut(8), boxShadow: '0 6px 14px rgba(0,0,0,.18)' }}><Rond s={46} /></span>
        <span className="absolute left-[48px] top-0 w-[62px] h-[74px] bg-white flex items-center justify-center" style={{ transform: 'rotate(7deg)', clipPath: cut(8), boxShadow: '0 6px 14px rgba(0,0,0,.18)' }}><Rond s={46} q /></span>
      </span>
      <Gros c={dark ? '#FFFFFF' : CARBON} s={17}>Lequel<br />tu gardes ?</Gros>
    </div>
  );

  return (
    <div className="inline-flex items-center gap-3 pl-2 pr-4 py-2 bg-white" style={{ clipPath: cut(12), boxShadow: dark ? 'none' : 'inset 0 0 0 1px #E5E7EB' }}>
      <Rond s={48} />
      <div>
        <Gros s={14}>Badge IA</Gros>
        <span className="mt-1.5 flex items-center gap-1.5">
          {[0, 1, 2].map((k) => <span key={k} className="w-5 h-2.5" style={{ background: GREEN, clipPath: cut(3) }} />)}
          <span className="ml-1 text-sm font-extrabold" style={{ fontFamily: FONT, color: GREEN }}>3 essais offerts</span>
        </span>
      </div>
    </div>
  );
};

export default BadgeIaTeaser;

/** Variante par l'adresse : `?badgeia=1..5` (gardée pour l'onglet), accueil et fenêtre d'arrivée ensemble ; 0 = rien.
 *  Choix de Nolan (25/10, 2e tour) : 1 · Pastille claire, sur l'accueil ET dans la fenêtre d'arrivée. */
export const BADGE_IA_DEFAUT = 1;
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
