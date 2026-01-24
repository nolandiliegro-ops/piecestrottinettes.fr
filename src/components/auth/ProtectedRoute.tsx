import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // === LOGS DE DÉTECTION ===
  console.log('[ProtectedRoute] ========== CHECK ==========');
  console.log('[ProtectedRoute] loading:', loading);
  console.log('[ProtectedRoute] user:', !!user);
  console.log('[ProtectedRoute] path:', window.location.pathname);

  if (loading) {
    console.log('[ProtectedRoute] ⏳ En attente de la session...');
    return (
      <div className="min-h-screen bg-greige flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-garage" />
          <p className="text-carbon/60 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] ⚠️ REDIRECTION FORCÉE vers /login');
    console.log('[ProtectedRoute] Raison: user est null après loading=false');
    console.log('[ProtectedRoute] Current path:', window.location.pathname);
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] ✅ Accès autorisé pour:', user.email);
  return <>{children}</>;
};

export default ProtectedRoute;
