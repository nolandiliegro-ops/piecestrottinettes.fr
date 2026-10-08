import { useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { SHOP_OPEN, openPrelaunch } from '@/config/launch';

/** Ferme une page d'achat (panier, checkout) tant que le shop n'est pas ouvert. */
const ShopGate = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    if (!SHOP_OPEN) openPrelaunch();
  }, []);
  if (!SHOP_OPEN) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default ShopGate;
