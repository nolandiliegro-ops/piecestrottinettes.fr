import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Détecte si l'URL contient des tokens OAuth (callback en cours)
 */
const hasOAuthTokensInUrl = (): boolean => {
  const hash = window.location.hash;
  const search = window.location.search;
  
  return hash.includes('access_token') || 
         hash.includes('refresh_token') || 
         search.includes('code=') ||
         search.includes('access_token=');
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // === LOGS DE DÉTECTION ===
  console.log('[ProtectedRoute] ========== CHECK ==========');
  console.log('[ProtectedRoute] loading:', loading);
  console.log('[ProtectedRoute] user:', !!user);
  console.log('[ProtectedRoute] path:', window.location.pathname);
  console.log('[ProtectedRoute] hash:', window.location.hash ? '[TOKENS PRÉSENTS]' : '[vide]');

  // Loading state - afficher le loader
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

  // 🛡️ GARDE ANTI-BOUCLE OAUTH
  // Si pas d'utilisateur MAIS tokens OAuth présents → attendre le parsing
  if (!user) {
    const oauthInProgress = hasOAuthTokensInUrl();
    
    if (oauthInProgress) {
      console.log('[ProtectedRoute] 🔄 Tokens OAuth détectés dans l\'URL');
      console.log('[ProtectedRoute] ⏳ Attente du parsing Supabase...');
      console.log('[ProtectedRoute] 🛡️ BLOCAGE de la redirection vers /login');
      
      return (
        <div className="min-h-screen bg-greige flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-garage" />
            <p className="text-carbon/60 font-medium">Finalisation de la connexion...</p>
          </div>
        </div>
      );
    }
    
    console.log('[ProtectedRoute] ⚠️ REDIRECTION FORCÉE vers /login');
    console.log('[ProtectedRoute] Raison: user est null, pas de tokens OAuth');
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] ✅ Accès autorisé pour:', user.email);
  return <>{children}</>;
};

export default ProtectedRoute;
