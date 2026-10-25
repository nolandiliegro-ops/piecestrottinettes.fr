/**
 * Pop-up d'avant-lancement « Rideau » (choix de Nolan du 25/10/2026 parmi 5 propositions ; les 4 autres et l'ancienne
 * fenêtre ont été retirées après validation sur téléphone). Le rideau métallique descend sur la devanture, SKOT arrive
 * en roulant et parle ; « Visiter le site » est un vrai bouton. `?popup` dans l'adresse l'ouvre tout de suite (test).
 */
import { useState, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { RIDER_LAUNCH_OFFER } from '@/config/launch';
import { skotSaison } from '@/lib/skotSaison';

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = '#1A1A1A';
const GREEN = '#4A7C59';
const SOFT = '#8FBF9C';
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

export type PopupReason = 'accueil' | 'panier';
type Props = { reason: PopupReason; loggedIn: boolean; onVisit: () => void; onGarage: () => void };

const CSS = `
@keyframes pv-fade{from{opacity:0}to{opacity:1}}
@keyframes pv-rise{0%{opacity:0;transform:translateY(48px) scale(.96)}70%{opacity:1;transform:translateY(-6px) scale(1.01)}100%{opacity:1;transform:none}}
@keyframes pv-pop{0%{opacity:0;transform:scale(.6)}70%{opacity:1;transform:scale(1.06)}100%{opacity:1;transform:none}}
@keyframes pv-shutter{0%{transform:translateY(-102%)}55%{transform:translateY(0)}68%{transform:translateY(-5%)}80%{transform:translateY(0)}100%{transform:translateY(0)}}
@keyframes pv-shutter-up{from{transform:translateY(0)}to{transform:translateY(-58%)}}
@keyframes pv-roll{0%{transform:translateX(-160%) rotate(-4deg)}75%{transform:translateX(6%) rotate(2deg)}100%{transform:none}}
@keyframes pv-ride{0%,100%{transform:translateY(0) rotate(-1.2deg)}50%{transform:translateY(-5px) rotate(1.2deg)}}
@keyframes pv-flicker{0%,18%,22%,25%,53%,57%{opacity:1}20%,24%,55%{opacity:.15}0%{opacity:0}}
@keyframes pv-glow{0%,100%{filter:drop-shadow(0 0 6px currentColor) drop-shadow(0 0 18px currentColor)}50%{filter:drop-shadow(0 0 4px currentColor) drop-shadow(0 0 12px currentColor)}}
@keyframes pv-ticket{0%{opacity:0;transform:translateY(70px) rotate(-8deg)}70%{opacity:1;transform:translateY(-6px) rotate(-3deg)}100%{opacity:1;transform:rotate(-3deg)}}
@keyframes pv-word{0%{opacity:0;transform:translateX(-40px);clip-path:inset(0 100% 0 0)}100%{opacity:1;transform:none;clip-path:inset(0 0 0 0)}}
@keyframes pv-across{0%{transform:translateX(-120vw)}100%{transform:none}}
.pv-a{animation-fill-mode:both}
@media (prefers-reduced-motion:reduce){.pv-a,.pv-a *{animation:none!important}}
`;

const useSkotImg = () => {
  const [saison] = useState(() => skotSaison());
  return saison ? `/skot/p-${saison}.webp` : '/skot/p-salut.webp';
};

const Bubble = ({ titre, children, delay = 0, dark = false }: { titre: string; children?: ReactNode; delay?: number; dark?: boolean }) => (
  <div className="pv-a relative p-[2px]" style={{ background: dark ? '#FFFFFF' : CARBON, clipPath: cut(10), animation: `pv-pop .45s cubic-bezier(.2,.9,.3,1.3) ${delay}s both`, transformOrigin: '0% 100%' }}>
    <div className="px-3.5 py-2.5 text-left" style={{ background: dark ? CARBON : '#FFFFFF', clipPath: cut(9) }}>
      <p className="text-[15px] font-extrabold italic leading-tight" style={{ fontFamily: FONT, color: dark ? '#FFFFFF' : CARBON }}>{titre}</p>
      {children && <p className="mt-0.5 text-[14px] leading-snug" style={{ fontFamily: FONT, color: dark ? 'rgba(255,255,255,.8)' : '#374151' }}>{children}</p>}
    </div>
  </div>
);

const Buttons = ({ reason, loggedIn, onVisit, onGarage, dark = false, delay = 0 }: Props & { dark?: boolean; delay?: number }) => {
  const primary = reason === 'panier' ? { label: loggedIn ? 'Mon garage' : 'Créer mon garage', on: onGarage } : { label: 'Visiter le site', on: onVisit };
  const second = reason === 'panier' ? { label: 'Continuer', on: onVisit } : { label: loggedIn ? 'Mon garage' : 'Créer mon garage', on: onGarage };
  return (
    <div className="pv-a grid grid-cols-2 gap-2" style={{ animation: `pv-fade .4s ease ${delay}s both` }}>
      <button type="button" onClick={primary.on} className="min-h-[54px] px-3 font-extrabold uppercase text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-[#4A7C59]"
        style={{ background: dark ? '#FFFFFF' : CARBON, color: dark ? CARBON : '#FFFFFF', clipPath: cut(10), fontFamily: FONT }}>{primary.label}</button>
      <button type="button" onClick={second.on} className="min-h-[54px] px-3 font-extrabold uppercase text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-[#4A7C59]"
        style={{ background: 'transparent', color: dark ? '#FFFFFF' : CARBON, clipPath: cut(10), boxShadow: `inset 0 0 0 2px ${dark ? '#FFFFFF' : CARBON}`, fontFamily: FONT }}>{second.label}</button>
    </div>
  );
};

const Offer = ({ loggedIn, dark = false, delay = 0 }: { loggedIn: boolean; dark?: boolean; delay?: number }) => (
  <div className="pv-a text-center" style={{ animation: `pv-fade .4s ease ${delay}s both` }}>
    {!loggedIn && (
      <p className="text-[14px] font-semibold" style={{ fontFamily: FONT, color: dark ? 'rgba(255,255,255,.9)' : '#374151' }}>
        Garage gratuit = ton code RIDER : <span style={{ color: dark ? SOFT : GREEN }}>-{RIDER_LAUNCH_OFFER.percent} %</span> sur ta première commande.
      </p>
    )}
    <p className="mt-1 text-[14px]" style={{ fontFamily: FONT, color: dark ? 'rgba(255,255,255,.55)' : '#6B7280' }}>
      Plafonné à {RIDER_LAUNCH_OFFER.maxEuros} €, une commande, {RIDER_LAUNCH_OFFER.validityDays} jours après l'ouverture. Hors trottinettes complètes et batteries.
    </p>
  </div>
);

const Close = ({ dark = false }: { dark?: boolean }) => (
  <DialogPrimitive.Close aria-label="Fermer" className="absolute right-2 top-2 z-20 w-11 h-11 inline-flex items-center justify-center rounded-full" style={{ color: dark ? '#FFFFFF' : CARBON, background: dark ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.7)' }}>
    <X className="w-5 h-5" />
  </DialogPrimitive.Close>
);

const phrase = (reason: PopupReason, loggedIn = false) =>
  reason === 'panier'
    ? { t: 'Pas encore, patience !', d: loggedIn ? "Les commandes ouvrent très bientôt. Ton garage est prêt : je te préviens le jour J." : 'Les commandes ouvrent très bientôt. Crée ton garage, je te préviens le jour J.' }
    : { t: "Moi, c'est SKOT !", d: 'Le shop ouvre très bientôt. En attendant, visite : dis-moi ta trott, je te montre ce qui va dessus.' };

const Title = ({ className = '', dark = false, size = 'text-[30px]' }: { className?: string; dark?: boolean; size?: string }) => (
  <DialogPrimitive.Title className={`uppercase leading-[0.95] ${size} ${className}`} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.03em', color: dark ? '#FFFFFF' : CARBON }}>
    Le shop ouvre <span style={{ color: dark ? SOFT : GREEN }}>bientôt.</span>
  </DialogPrimitive.Title>
);

/* 1 · RIDEAU — la devanture de la boutique : le rideau métallique descend et rebondit, « LE SHOP OUVRE BIENTÔT » peint
   dessus ; SKOT arrive en roulant sur le trottoir devant et parle. La métaphore la plus claire : fermé, mais plus pour longtemps. */
const Rideau = (p: Props) => {
  const img = useSkotImg();
  const ph = phrase(p.reason, p.loggedIn);
  const slats = 'repeating-linear-gradient(180deg,#DAD7D0 0 12px,#B7B3AA 12px 14px,#EEECE6 14px 16px)';
  return (
    <div className="pv-a relative w-[calc(100vw-24px)] max-w-[420px] overflow-hidden bg-[#FAFAF8]" style={{ clipPath: cut(18), animation: 'pv-rise .5s cubic-bezier(.2,.9,.3,1.1) both' }}>
      <Close dark />
      {/* devanture : bandeau carbone + rideau */}
      <div className="relative" style={{ background: CARBON }}>
        <p className="pl-4 pr-14 pt-3 pb-2 text-[14px] font-bold uppercase tracking-[0.16em]" style={{ fontFamily: FONT, color: SOFT }}>piecestrottinettes.fr · atelier</p>
        <div className="relative mx-3 h-[150px] overflow-hidden" style={{ background: '#2A2A2A' }}>
          <div className="pv-a absolute inset-0 flex flex-col items-center justify-center" style={{ background: slats, animation: 'pv-shutter 1s cubic-bezier(.3,.7,.3,1) .2s both', boxShadow: 'inset 0 -6px 0 #8B877E' }}>
            <span className="px-2 text-[27px] uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', color: CARBON, letterSpacing: '-0.03em' }}>Le shop ouvre</span>
            <span className="mt-1.5 px-3 py-1 text-[30px] uppercase leading-none text-white" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', background: GREEN, clipPath: cut(8) }}>bientôt</span>
          </div>
        </div>
        <div className="h-3" />
      </div>
      {/* trottoir */}
      <div className="relative flex items-end gap-1 px-3 pt-3" style={{ background: '#E9E4DA' }}>
        <img src={img} alt="SKOT, la mascotte de l'atelier" className="pv-a w-[132px] h-[132px] shrink-0" style={{ animation: 'pv-roll .8s cubic-bezier(.2,.9,.3,1) 1.15s both, pv-ride 3s ease-in-out 2s infinite' }} />
        <div className="flex-1 min-w-0 mb-8"><Bubble titre={ph.t} delay={1.8}>{ph.d}</Bubble></div>
      </div>
      <div className="px-5 pt-4 pb-5 grid gap-3">
        <Title className="sr-only" />
        <Buttons {...p} delay={2} />
        <Offer loggedIn={p.loggedIn} delay={2.1} />
      </div>
    </div>
  );
};

export const PrelaunchStage = (p: Props) => (
  <DialogPrimitive.Portal>
    <style>{CSS}</style>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,.72)', animation: 'pv-fade .3s ease both' }} />
    <DialogPrimitive.Content
      aria-describedby={undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 outline-none overflow-y-auto"
    >
      <Rideau {...p} />
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

/** `?popup` (n'importe quelle valeur) ouvre la fenêtre tout de suite, même déjà vue : sert aux tests. */
export function readPopupForced(): boolean {
  if (typeof window === 'undefined') return false;
  try { return new URLSearchParams(window.location.search).has('popup'); } catch { return false; }
}
