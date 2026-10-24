import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { captureRefFromSearch } from '@/lib/referral';

/** Mémorise le code créateur de tout lien `?ref=CODE`, sur n'importe quelle page. Ne rend rien. */
const ReferralCapture = () => {
  const { search } = useLocation();
  useEffect(() => {
    if (search.includes('ref=')) captureRefFromSearch(search);
  }, [search]);
  return null;
};

export default ReferralCapture;
