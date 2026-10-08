import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { PRELAUNCH_EVENT, RIDER_LAUNCH_OFFER, SHOP_OPEN } from '@/config/launch';

const SEEN_KEY = 'pt-prelaunch-seen';
// Pas de pop-up automatique sur ces pages (inscription, espace perso, admin…)
const QUIET_PREFIXES = ['/register', '/login', '/garage', '/profile', '/admin', '/rider', '/.lovable', '/cgv', '/mentions-legales'];

const safeGet = (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* navigation privée */ } };

/** Mini carte Rider d'exemple — donne l'ambiance sans dépendre des données. */
const SampleRiderCard = () => (
  <div className="relative mx-auto w-[220px] aspect-[5/7] rounded-2xl bg-[#1A1A1A] text-white shadow-xl overflow-hidden rotate-[-4deg] motion-safe:animate-[prelaunch-float_4s_ease-in-out_infinite]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(74,124,89,0.55),transparent_60%)]" />
    <div className="relative h-full flex flex-col p-4">
      <div className="flex items-center justify-between text-[14px] font-semibold tracking-wide">
        <span className="font-display text-lg tracking-widest">RIDER</span>
        <span className="rounded-full bg-[#4A7C59] px-2 py-0.5 text-[14px]">LVL 1</span>
      </div>
      <div className="mt-5 mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-[#4A7C59] to-[#2c4a35] border-2 border-white/30 flex items-center justify-center font-display text-3xl">
        TOI
      </div>
      <p className="mt-3 text-center font-display text-2xl tracking-wider">TON PSEUDO</p>
      <p className="text-center text-[14px] text-white/70">Ta machine · ton garage</p>
      <div className="mt-auto rounded-xl border border-dashed border-white/40 bg-white/5 p-2 text-center">
        <p className="text-[14px] text-white/70">Offre de lancement</p>
        <p className="font-display text-2xl tracking-wider text-[#9fd3ad]">-{RIDER_LAUNCH_OFFER.percent} %</p>
      </div>
    </div>
  </div>
);

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
      <DialogContent className="w-[calc(100%-32px)] max-w-md rounded-2xl border-0 bg-[#F5F0E8] p-0 overflow-hidden max-h-[92dvh] overflow-y-auto">
        <style>{`@keyframes prelaunch-float{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-6px) rotate(-2deg)}}`}</style>
        <div className="bg-[#4A7C59]/10 pt-8 pb-6 px-6">
          <SampleRiderCard />
        </div>
        <div className="px-6 pb-6 pt-5 text-center">
          <DialogTitle className="font-black uppercase tracking-tight text-2xl leading-tight text-[#1A1A1A]">
            Le shop ouvre bientôt
          </DialogTitle>
          <DialogDescription className="mt-3 text-[15px] leading-relaxed text-gray-600">
            Les commandes ne sont pas encore ouvertes. Crée ta <strong className="text-[#1A1A1A]">carte Rider</strong> dès
            maintenant&nbsp;: tu réserves <strong className="text-[#1A1A1A]">-{RIDER_LAUNCH_OFFER.percent}&nbsp;% sur ta
            première commande</strong> au lancement et on te prévient le jour J.
          </DialogDescription>

          <button
            type="button"
            onClick={goCreateCard}
            className="mt-6 w-full min-h-[48px] rounded-lg bg-[#4A7C59] hover:bg-[#3A6449] px-6 py-3 font-semibold uppercase tracking-wide text-white transition-colors"
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
