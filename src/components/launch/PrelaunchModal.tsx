import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { PRELAUNCH_EVENT, RIDER_LAUNCH_OFFER, SHOP_OPEN } from '@/config/launch';
import { skotSaison } from '@/lib/skotSaison';
import { PrelaunchStage, readPopupVariant } from './PrelaunchVariants';

const SEEN_KEY = 'pt-prelaunch-seen';
// Pas de pop-up automatique sur ces pages (inscription, espace perso, admin…)
const QUIET_PREFIXES = ['/register', '/login', '/garage', '/profile', '/admin', '/rider', '/.lovable', '/cgv', '/mentions-legales', '/pro'];

const safeGet = (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* navigation privée */ } };

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

/* 25/10/2026 (Nolan : « ce message d'accueil est chiant, le bouton Visiter le site est petit, on est trop obligé de
   faire sa carte Rider… j'aimerais que ce soit SKOT, la mascotte, qui parle ») : SKOT accueille, « Visiter le site »
   est un vrai bouton de même taille, l'inscription devient une proposition. Tenue de saison comme ailleurs. */
const CARBON = '#1A1A1A';
const SkotSays = ({ titre, children }: { titre: string; children: React.ReactNode }) => {
  const [saison] = useState(() => skotSaison());
  const img = saison ? `/skot/p-${saison}.webp` : '/skot/p-salut.webp';
  return (
    <div className="flex items-end gap-2">
      <img src={img} alt="SKOT, la mascotte de l'atelier" width={132} height={132} draggable={false}
        className="w-[136px] h-[136px] sm:w-[150px] sm:h-[150px] -ml-2 shrink-0 select-none motion-safe:animate-[prelaunch-ride_3.2s_ease-in-out_infinite]"
        style={{ transformOrigin: '50% 100%', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.22))' }} />
      <div className="relative flex-1 min-w-0 mb-8 p-[2px]" style={{ background: CARBON, clipPath: cut(10) }}>
        <div className="bg-white px-4 py-3 text-left" style={{ clipPath: cut(9) }}>
          <DialogTitle className="text-[17px] font-extrabold italic leading-tight" style={{ fontFamily: FONT, color: CARBON }}>{titre}</DialogTitle>
          <DialogDescription asChild>
            <div className="mt-1 text-[15px] leading-snug" style={{ fontFamily: FONT, color: '#374151' }}>{children}</div>
          </DialogDescription>
        </div>
      </div>
    </div>
  );
};

const PrelaunchModal = () => {
  const [open, setOpen] = useState(false);
  // « accueil » = première visite ; « panier » = clic sur Ajouter au panier / panier / paiement
  const [reason, setReason] = useState<'accueil' | 'panier'>('accueil');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  // 25/10 : 5 propositions derrière `?popup=1..5` (0 = cette version). `?popup=N` ouvre la fenêtre tout de suite, même déjà vue.
  const [{ v: variant, forced }] = useState(readPopupVariant);
  useEffect(() => {
    if (SHOP_OPEN || !forced) return;
    const t = window.setTimeout(() => { setReason('accueil'); setOpen(true); }, 600);
    return () => window.clearTimeout(t);
  }, [forced]);

  // Ouverture à la demande (clic sur « Ajouter au panier », panier, checkout)
  useEffect(() => {
    if (SHOP_OPEN) return;
    const handler = () => { setReason('panier'); setOpen(true); };
    window.addEventListener(PRELAUNCH_EVENT, handler);
    return () => window.removeEventListener(PRELAUNCH_EVENT, handler);
  }, []);

  // Ouverture automatique : première page vue de la session
  useEffect(() => {
    if (SHOP_OPEN || user) return;
    if (QUIET_PREFIXES.some((p) => location.pathname.startsWith(p))) return;
    if (safeGet(SEEN_KEY)) return;
    const t = window.setTimeout(() => { setReason('accueil'); setOpen(true); }, 900);
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

  if (variant > 0) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {open && <PrelaunchStage variant={variant} reason={reason} loggedIn={!!user} onVisit={() => handleOpenChange(false)} onGarage={goCreateCard} />}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-32px)] max-w-[420px] rounded-none border-0 bg-[#FAFAF8] p-0 overflow-hidden max-h-[92dvh] overflow-y-auto" style={{ clipPath: cut(18) }}>
        <style>{`@keyframes prelaunch-ride{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-5px) rotate(1.5deg)}}`}</style>
        <div className="pt-12 px-5 pb-1" style={{ background: '#E9E4DA' }}>
          {reason === 'panier' ? (
            <SkotSays titre="Pas encore, le shop ouvre bientôt !">
              Les commandes ne sont pas encore ouvertes. Crée ton garage : tu réserves <b style={{ color: CARBON }}>-{RIDER_LAUNCH_OFFER.percent}&nbsp;% sur ta première commande</b> et je te préviens le jour&nbsp;J.
            </SkotSays>
          ) : (
            <SkotSays titre="Salut, moi c'est SKOT !">
              Je connais toutes les pièces du catalogue. Dis-moi ta trott, je te montre ce qui va dessus. Le shop ouvre bientôt.
            </SkotSays>
          )}
        </div>
        <div className="px-5 pt-5 pb-5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={reason === 'panier' ? goCreateCard : () => handleOpenChange(false)}
              className="min-h-[52px] px-3 font-extrabold uppercase text-[15px] text-white outline-none focus-visible:ring-2 focus-visible:ring-[#4A7C59]"
              style={{ background: CARBON, clipPath: cut(10), fontFamily: FONT }}
            >
              {reason === 'panier' ? (user ? 'Mon garage' : 'Créer mon garage') : 'Visiter le site'}
            </button>
            <button
              type="button"
              onClick={reason === 'panier' ? () => handleOpenChange(false) : goCreateCard}
              className="min-h-[52px] px-3 font-extrabold uppercase text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-[#4A7C59]"
              style={{ background: '#FFFFFF', color: CARBON, clipPath: cut(10), boxShadow: `inset 0 0 0 2px ${CARBON}`, fontFamily: FONT }}
            >
              {reason === 'panier' ? 'Continuer' : (user ? 'Mon garage' : 'Créer mon garage')}
            </button>
          </div>
          {!user && reason === 'accueil' && (
            <p className="mt-3 text-[14px] font-semibold text-center" style={{ fontFamily: FONT, color: '#374151' }}>
              Garage gratuit = ton code RIDER : <span style={{ color: '#4A7C59' }}>-{RIDER_LAUNCH_OFFER.percent}&nbsp;%</span> sur ta première commande au lancement.
            </p>
          )}
          <p className="mt-2 text-[14px] text-gray-500 text-center">
            Plafonné à {RIDER_LAUNCH_OFFER.maxEuros}&nbsp;€, une commande, valable {RIDER_LAUNCH_OFFER.validityDays}&nbsp;jours après l'ouverture. Hors trottinettes complètes et batteries.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrelaunchModal;
