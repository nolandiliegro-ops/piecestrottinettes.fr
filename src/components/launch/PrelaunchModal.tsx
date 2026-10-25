import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dialog } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { PRELAUNCH_EVENT, SHOP_OPEN } from '@/config/launch';
import { PrelaunchStage, readPopupForced } from './PrelaunchVariants';

const SEEN_KEY = 'pt-prelaunch-seen';
// Pas de pop-up automatique sur ces pages (inscription, espace perso, admin…)
const QUIET_PREFIXES = ['/register', '/login', '/garage', '/profile', '/admin', '/rider', '/.lovable', '/cgv', '/mentions-legales', '/pro'];

const safeGet = (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* navigation privée */ } };

/* Pop-up d'avant-lancement : « Rideau » (choix de Nolan du 25/10/2026). SKOT accueille, « Visiter le site » est un
   vrai bouton, l'inscription reste une proposition. L'ancienne fenêtre et les variantes 2..5 sont retirées. */
const PrelaunchModal = () => {
  const [open, setOpen] = useState(false);
  // « accueil » = première visite ; « panier » = clic sur Ajouter au panier / panier / paiement
  const [reason, setReason] = useState<'accueil' | 'panier'>('accueil');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  // `?popup` dans l'adresse ouvre la fenêtre tout de suite, même déjà vue (tests).
  const [forced] = useState(readPopupForced);
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {open && <PrelaunchStage reason={reason} loggedIn={!!user} onVisit={() => handleOpenChange(false)} onGarage={goCreateCard} />}
    </Dialog>
  );
};

export default PrelaunchModal;
