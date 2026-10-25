/**
 * 25/10/2026 — 5 propositions de pop-up d'avant-lancement (Nolan : « il rentre mal, ce n'est pas joli… je voulais un
 * effet wow, et qu'on comprenne que le shop ouvre bientôt »). Aperçu : `?popup=1..5` (gardé pour l'onglet),
 * `?popup=0` = la version actuelle. Chaque variante gère son entrée elle-même (plus l'animation par défaut du Dialog,
 * qui glissait du haut à gauche). SKOT parle dans toutes ; « Visiter le site » est toujours un vrai bouton.
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
type Props = { variant: number; reason: PopupReason; loggedIn: boolean; onVisit: () => void; onGarage: () => void };

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

const Buttons = ({ reason, loggedIn, onVisit, onGarage, dark = false, delay = 0 }: Omit<Props, 'variant'> & { dark?: boolean; delay?: number }) => {
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
const Rideau = (p: Omit<Props, 'variant'>) => {
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

/* 2 · NÉON — l'enseigne de la boutique s'allume en grésillant sur un mur sombre ; SKOT dessous, sa bulle. */
const Neon = (p: Omit<Props, 'variant'>) => {
  const img = useSkotImg();
  const ph = phrase(p.reason, p.loggedIn);
  return (
    <div className="pv-a relative w-[calc(100vw-24px)] max-w-[420px] overflow-hidden" style={{ clipPath: cut(18), animation: 'pv-pop .5s cubic-bezier(.2,.9,.3,1.15) both', background: 'radial-gradient(90% 60% at 50% 20%, #2F3A33 0%, #151515 70%)' }}>
      <Close dark />
      <div className="px-5 pt-9 pb-2 text-center">
        <p className="pv-a text-[44px] leading-[0.9] uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', animation: 'pv-flicker 1.1s linear .3s both, pv-glow 2.6s ease-in-out 1.5s infinite' }}>Le shop</p>
        <DialogPrimitive.Title asChild>
          <p className="pv-a mt-1 text-[34px] leading-[0.95] uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', color: SOFT, animation: 'pv-flicker 1.2s linear .7s both, pv-glow 2.6s ease-in-out 1.9s infinite' }}>ouvre bientôt</p>
        </DialogPrimitive.Title>
      </div>
      <div className="relative flex items-end gap-1 px-3 pt-2">
        <img src={img} alt="SKOT, la mascotte de l'atelier" className="pv-a w-[132px] h-[132px] shrink-0" style={{ animation: 'pv-roll .8s cubic-bezier(.2,.9,.3,1) 1.2s both, pv-ride 3s ease-in-out 2.1s infinite' }} />
        <div className="flex-1 min-w-0 mb-8"><Bubble titre={ph.t} delay={1.8} dark>{ph.d}</Bubble></div>
      </div>
      <div className="px-5 pt-2 pb-5 grid gap-3">
        <Buttons {...p} dark delay={2} />
        <Offer loggedIn={p.loggedIn} dark delay={2.1} />
      </div>
    </div>
  );
};

/* 3 · TICKET — SKOT tend son ticket d'ouverture (le code RIDER) : on comprend « bientôt » ET « ce que j'y gagne ». */
const Ticket = (p: Omit<Props, 'variant'>) => {
  const img = useSkotImg();
  const ph = phrase(p.reason, p.loggedIn);
  return (
    <div className="pv-a relative w-[calc(100vw-24px)] max-w-[420px] overflow-hidden bg-[#E9E4DA]" style={{ clipPath: cut(18), animation: 'pv-rise .5s cubic-bezier(.2,.9,.3,1.1) both' }}>
      <Close />
      <div className="px-5 pt-7"><Title size="text-[30px]" /></div>
      <div className="relative h-[262px] mt-2">
        <img src={img} alt="SKOT, la mascotte de l'atelier" className="pv-a absolute left-1 bottom-0 w-[150px] h-[150px]" style={{ animation: 'pv-roll .8s cubic-bezier(.2,.9,.3,1) .4s both, pv-ride 3s ease-in-out 1.3s infinite' }} />
        <div className="pv-a absolute right-4 top-1 w-[186px]" style={{ animation: 'pv-ticket .6s cubic-bezier(.2,.9,.3,1.2) 1s both' }}>
          <div className="relative px-4 py-3 text-white" style={{ background: CARBON, mask: 'radial-gradient(circle 9px at 0 50%, transparent 98%, #000) left/51% 100% no-repeat, radial-gradient(circle 9px at 100% 50%, transparent 98%, #000) right/51% 100% no-repeat', WebkitMask: 'radial-gradient(circle 9px at 0 50%, transparent 98%, #000) left/51% 100% no-repeat, radial-gradient(circle 9px at 100% 50%, transparent 98%, #000) right/51% 100% no-repeat' }}>
            <p className="text-[14px] font-bold uppercase tracking-[0.14em]" style={{ fontFamily: FONT, color: SOFT }}>Ticket d'ouverture</p>
            <p className="mt-1 text-[28px] leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic' }}>-{RIDER_LAUNCH_OFFER.percent} %</p>
            <p className="mt-2 pt-2 text-[14px] font-bold tracking-widest" style={{ fontFamily: FONT, borderTop: '2px dashed rgba(255,255,255,.3)' }}>RIDER-••••••</p>
          </div>
        </div>
        <div className="absolute left-[150px] right-3 bottom-2"><Bubble titre={ph.t} delay={1.6}>{p.reason === 'panier' ? ph.d : 'Ton ticket t’attend dans ton garage.'}</Bubble></div>
      </div>
      <div className="px-5 pt-4 pb-5 grid gap-3 bg-[#FAFAF8]">
        <Buttons {...p} delay={1.9} />
        <Offer loggedIn={p.loggedIn} delay={2} />
      </div>
    </div>
  );
};

/* 4 · PLEIN ÉCRAN — l'écran entier passe au noir, les mots tombent un par un, SKOT traverse en roulant. Cinéma. */
const PleinEcran = (p: Omit<Props, 'variant'>) => {
  const img = useSkotImg();
  const ph = phrase(p.reason, p.loggedIn);
  const w = (txt: string, d: number, color = '#FFFFFF') => (
    <span className="pv-a block" style={{ animation: `pv-word .55s cubic-bezier(.2,.9,.3,1) ${d}s both`, color }}>{txt}</span>
  );
  return (
    <div className="pv-a fixed inset-0 overflow-y-auto" style={{ background: CARBON, animation: 'pv-fade .35s ease both' }}>
      <Close dark />
      <div className="min-h-full max-w-[560px] mx-auto px-6 pt-16 pb-8 flex flex-col">
        <DialogPrimitive.Title asChild>
          <h2 className="uppercase leading-[0.9] text-[56px] sm:text-[76px]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.04em' }}>
            {w('Le shop', 0.2)}{w('ouvre', 0.45)}{w('bientôt.', 0.7, SOFT)}
          </h2>
        </DialogPrimitive.Title>
        <div className="relative mt-6 flex items-end gap-2">
          <img src={img} alt="SKOT, la mascotte de l'atelier" className="pv-a w-[150px] h-[150px] shrink-0" style={{ animation: 'pv-across 1s cubic-bezier(.2,.9,.3,1) 1s both, pv-ride 3s ease-in-out 2s infinite' }} />
          <div className="flex-1 min-w-0 mb-10"><Bubble titre={ph.t} delay={1.8} dark>{ph.d}</Bubble></div>
        </div>
        <div className="mt-auto pt-6 grid gap-3">
          <Buttons {...p} dark delay={2} />
          <Offer loggedIn={p.loggedIn} dark delay={2.1} />
        </div>
      </div>
    </div>
  );
};

/* 5 · REPASSÉ — la fenêtre actuelle, gardée, mais avec le message en gros en tête et une entrée propre (elle monte du bas,
   SKOT arrive en roulant, sa bulle s'ouvre). La lecture la plus littérale : même chose, mais qu'on comprenne et que ce soit joli. */
const Repasse = (p: Omit<Props, 'variant'>) => {
  const img = useSkotImg();
  const ph = phrase(p.reason, p.loggedIn);
  return (
    <div className="pv-a relative w-[calc(100vw-24px)] max-w-[420px] overflow-hidden bg-[#FAFAF8]" style={{ clipPath: cut(18), animation: 'pv-rise .5s cubic-bezier(.2,.9,.3,1.1) both' }}>
      <Close dark />
      <div className="px-5 pt-7 pb-5" style={{ background: CARBON }}><Title dark size="text-[30px]" /></div>
      <div className="flex items-end gap-1 px-3 pt-3" style={{ background: '#E9E4DA' }}>
        <img src={img} alt="SKOT, la mascotte de l'atelier" className="pv-a w-[132px] h-[132px] shrink-0" style={{ animation: 'pv-roll .75s cubic-bezier(.2,.9,.3,1) .35s both, pv-ride 3s ease-in-out 1.2s infinite' }} />
        <div className="flex-1 min-w-0 mb-8"><Bubble titre={ph.t} delay={1}>{ph.d}</Bubble></div>
      </div>
      <div className="px-5 pt-4 pb-5 grid gap-3">
        <Buttons {...p} delay={1.2} />
        <Offer loggedIn={p.loggedIn} delay={1.3} />
      </div>
    </div>
  );
};

export const PrelaunchStage = ({ variant, ...p }: Props) => {
  const full = variant === 4;
  return (
    <DialogPrimitive.Portal>
      <style>{CSS}</style>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,.72)', animation: 'pv-fade .3s ease both' }} />
      <DialogPrimitive.Content
        aria-describedby={undefined}
        className={full ? 'fixed inset-0 z-50 outline-none' : 'fixed inset-0 z-50 flex items-center justify-center p-3 outline-none overflow-y-auto'}
        onPointerDownOutside={(e) => { if (full) e.preventDefault(); }}
      >
        {variant === 1 && <Rideau {...p} />}
        {variant === 2 && <Neon {...p} />}
        {variant === 3 && <Ticket {...p} />}
        {variant === 4 && <PleinEcran {...p} />}
        {variant === 5 && <Repasse {...p} />}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
};

/** Variante choisie par l'adresse : `?popup=N` (gardé pour l'onglet). Défaut = 1 (Rideau, choix de Nolan du 25/10) ; 0 = ancienne fenêtre. */
export function readPopupVariant(): { v: number; forced: boolean } {
  if (typeof window === 'undefined') return { v: 1, forced: false };
  try {
    const q = new URLSearchParams(window.location.search).get('popup');
    if (q !== null && /^[0-5]$/.test(q)) { window.sessionStorage.setItem('pt-popup', q); return { v: Number(q), forced: true }; }
    const s = window.sessionStorage.getItem('pt-popup');
    // Choix de Nolan du 25/10 : « Rideau » par défaut ; `?popup=0` = ancienne fenêtre.
    return { v: s && /^[0-5]$/.test(s) ? Number(s) : 1, forced: false };
  } catch {
    return { v: 1, forced: false };
  }
}
