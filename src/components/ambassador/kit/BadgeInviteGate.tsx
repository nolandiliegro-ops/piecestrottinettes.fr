import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { aUnBadgeIa, inviteDejaVue } from './badgeInviteEtat';

/* Invitation badge IA « juste après la création de la carte Rider » (25/10/2026).
   Montée dans App : ne charge rien tant que la condition n'est pas remplie (compte de moins de 48 h, pas de badge IA,
   jamais vue sur cet appareil), et ne s'ouvre jamais sur le tunnel d'achat, l'admin ni l'espace ambassadeur (qui a la sienne). */

const BadgeInviteModal = lazy(() => import('./BadgeInviteModal'));

const PAGES_CALMES = ['/checkout', '/panier', '/payment-success', '/admin', '/ambassadeur', '/login', '/register', '/auth'];
const FENETRE_MS = 48 * 3600 * 1000;

const BadgeInviteGate = () => {
  const { user, profile } = useAuth();
  const { pathname } = useLocation();
  const [etat, setEtat] = useState<'attente' | 'ouverte' | 'fermee'>('attente');

  const eligible = !!user && !!profile
    && !PAGES_CALMES.some((p) => pathname.startsWith(p))
    && (() => { const age = Date.now() - new Date(profile.created_at).getTime(); return age >= 0 && age < FENETRE_MS; })()
    && !aUnBadgeIa(profile.avatar_url) && !inviteDejaVue('rider');

  // Verrou : une fois ouverte, la fenêtre reste montée jusqu'à sa fermeture (la marquer « vue » ou poser le badge
  // ne doit pas la démonter en plein dialogue).
  // 1,2 s après l'arrivée (sur le Garage en général) : la page est posée avant que l'invitation n'apparaisse.
  useEffect(() => {
    if (etat !== 'attente' || !eligible) return;
    const t = window.setTimeout(() => setEtat('ouverte'), 1200);
    return () => window.clearTimeout(t);
  }, [etat, eligible]);

  if (etat !== 'ouverte') return null;
  return <Suspense fallback={null}><BadgeInviteModal contexte="rider" onFin={() => setEtat('fermee')} /></Suspense>;
};

export default BadgeInviteGate;
