import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { PRELAUNCH_EVENT, RIDER_LAUNCH_OFFER, SHOP_OPEN } from '@/config/launch';
import { useHeroScooters } from '@/hooks/useHeroScooters';

const SEEN_KEY = 'pt-prelaunch-seen';
// Pas de pop-up automatique sur ces pages (inscription, espace perso, admin…)
const QUIET_PREFIXES = ['/register', '/login', '/garage', '/profile', '/admin', '/rider', '/.lovable', '/cgv', '/mentions-legales'];

const safeGet = (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* navigation privée */ } };

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

/** Carte Rider d'exemple — 18/10 : même dessin que la vraie carte « Atelier » (validée par Nolan), avec de vraies
 *  trottinettes du site, pour qu'on ait envie de la sienne. L'ancienne (cercle « TOI », Anton) faisait maquette. */
const SampleRiderCard = () => {
  const { scooters } = useHeroScooters('');
  const hero = scooters[0];
  const others = scooters.slice(1, 5);
  return (
    <div className="relative mx-auto w-[260px] px-3.5 pt-3.5 pb-3.5 text-left motion-safe:animate-[prelaunch-float_4s_ease-in-out_infinite]"
      style={{ background: '#1A1A1A', clipPath: cut(16), fontFamily: FONT }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[19px] uppercase leading-none text-white" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.03em' }}>Ton pseudo</p>
          <p className="mt-1 text-sm font-semibold text-white/65">Niv. 1 · Apprenti · ta ville</p>
        </div>
        <span className="text-[15px] leading-none pt-0.5" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', color: '#8FBF9C' }}>+50 XP</span>
      </div>
      <div className="relative mt-10">
        <div className="relative h-[118px]" style={{ background: '#262626', clipPath: cut(10) }}>
          <span aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(60% 60% at 50% 70%, rgba(255,255,255,0.14), rgba(255,255,255,0))' }} />
          <span className="absolute left-2 bottom-2 px-2 py-0.5 text-sm font-extrabold uppercase" style={{ background: '#8FBF9C', color: '#1A1A1A', clipPath: cut(5) }}>Ta machine</span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-[136px] flex items-end justify-center">
          {hero?.image_url && <img src={hero.image_url} alt="" className="max-h-full max-w-[84%] object-contain" style={{ filter: 'drop-shadow(0 14px 12px rgba(0,0,0,0.45))' }} />}
        </div>
      </div>
      <div className="mt-2.5 flex gap-1.5">
        {others.map((o) => (
          <span key={o.id} className="w-10 h-10 overflow-hidden shrink-0" style={{ background: '#F2EFE8', clipPath: cut(5) }}>
            {o.image_url && <img src={o.image_url} alt="" className="w-full h-full object-contain p-0.5" />}
          </span>
        ))}
        <span className="flex-1 min-w-0 self-center text-sm font-semibold text-white/65 leading-tight">ton garage</span>
      </div>
      <div className="mt-3 px-3 py-2 flex items-center justify-between" style={{ background: '#262626', clipPath: cut(7), boxShadow: 'inset 0 0 0 1px #3A3A3A' }}>
        <span className="text-sm font-bold tracking-widest text-white/75">RIDER-••••••</span>
        <span className="text-[20px] leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', color: '#8FBF9C' }}>-{RIDER_LAUNCH_OFFER.percent} %</span>
      </div>
    </div>
  );
};

const PrelaunchModal = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Ouverture à la demande (clic sur « Ajouter au panier », panier, checkout)
  useEffect(() => {
    if (SHOP_OPEN) return;
    const handler = () => setOpen(true);
    window.addEventListener(PRELAUNCH_EVENT, handler);
    return () => window.removeEventListener(PRELAUNCH_EVENT, handler);
  }, []);

  // Ouverture automatique : première page vue de la session
  useEffect(() => {
    if (SHOP_OPEN || user) return;
    if (QUIET_PREFIXES.some((p) => location.pathname.startsWith(p))) return;
    if (safeGet(SEEN_KEY)) return;
    const t = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(t);
  }, [location.pathname, user]);

  if (SHOP_OPEN) return null;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) safeSet(SEEN_KEY, '1');
  };

  const goCreateCard = () => {
    safeSet(SEEN_KEY, '1');
    setOpen(false);
    navigate(user ? '/garage' : '/register?returnTo=/garage');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-32px)] max-w-md rounded-none border-0 bg-[#FAFAF8] p-0 overflow-hidden max-h-[92dvh] overflow-y-auto" style={{ clipPath: cut(18) }}>
        <style>{`@keyframes prelaunch-float{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-6px) rotate(-1.5deg)}}`}</style>
        <div className="pt-8 pb-6 px-6" style={{ background: "#E9E4DA" }}>
          <SampleRiderCard />
        </div>
        <div className="px-6 pb-6 pt-5 text-center">
          <DialogTitle className="uppercase text-[24px] leading-[1.02] text-[#1A1A1A]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em" }}>
            Le shop ouvre <span style={{ color: '#4A7C59' }}>bientôt.</span>
          </DialogTitle>
          <DialogDescription className="mt-3 text-[15px] leading-relaxed text-gray-600" style={{ fontFamily: FONT }}>
            Les commandes ne sont pas encore ouvertes. Crée ta <strong className="text-[#1A1A1A]">carte Rider</strong> dès
            maintenant&nbsp;: tu réserves <strong className="text-[#1A1A1A]">-{RIDER_LAUNCH_OFFER.percent}&nbsp;% sur ta
            première commande</strong> au lancement et on te prévient le jour J.
          </DialogDescription>

          <button
            type="button"
            onClick={goCreateCard}
            className="mt-6 w-full min-h-[52px] flex items-center justify-center px-6 py-3 font-extrabold uppercase tracking-wide text-white outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A7C59]"
            style={{ background: "#1A1A1A", clipPath: cut(10), fontFamily: FONT }}
          >
            {user ? 'Voir ma carte Rider' : 'Créer ma carte Rider'}
          </button>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="mt-2 w-full min-h-[44px] text-[15px] font-medium text-gray-600 underline-offset-4 hover:underline"
          >
            Visiter le site
          </button>

          <p className="mt-4 text-[14px] text-gray-500">
            -{RIDER_LAUNCH_OFFER.percent}&nbsp;% plafonné à {RIDER_LAUNCH_OFFER.maxEuros}&nbsp;€, une commande, valable{' '}
            {RIDER_LAUNCH_OFFER.validityDays}&nbsp;jours après l'ouverture. Hors trottinettes complètes et batteries.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrelaunchModal;
