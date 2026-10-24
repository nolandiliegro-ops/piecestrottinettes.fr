import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { captureRefFromSearch, logRefVisit } from '@/lib/referral';
import { useAuth } from '@/hooks/useAuth';

/**
 * Programme ambassadeurs (24/10/2026), monté une fois dans App :
 * - mémorise le code créateur de tout lien `?ref=CODE` et compte le clic ;
 * - ramène sur /ambassadeur un créateur qui vient de cliquer son lien de connexion (si le lien l'a déposé sur l'accueil).
 */
const ReferralCapture = () => {
  const { search, pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!search.includes('ref=')) return;
    const code = captureRefFromSearch(search);
    if (code) logRefVisit(code);
  }, [search]);

  useEffect(() => {
    if (!user || pathname === '/ambassadeur') return;
    try {
      const t = Number(localStorage.getItem('pt-amb-retour') || 0);
      if (t && Date.now() - t < 60 * 60 * 1000) {
        localStorage.removeItem('pt-amb-retour');
        navigate('/ambassadeur', { replace: true });
      }
    } catch {
      /* stockage indisponible */
    }
  }, [user, pathname, navigate]);

  return null;
};

export default ReferralCapture;
