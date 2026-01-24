import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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

/**
 * Détecte si l'URL contient une ERREUR OAuth (ex: ?error=server_error)
 */
const getOAuthErrorFromUrl = (): { error: string; description: string } | null => {
  const hash = window.location.hash;
  const search = window.location.search;
  
  // Parse les deux sources possibles
  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace('#', '?'));
  
  const error = searchParams.get('error') || hashParams.get('error');
  const description = searchParams.get('error_description') || hashParams.get('error_description');
  
  if (error) {
    return {
      error,
      description: decodeURIComponent(description || 'Erreur de connexion inconnue')
    };
  }
  return null;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [oauthTimeout, setOauthTimeout] = useState(false);
  
  // === Détection OAuth (appelé à chaque render, pas dans un hook) ===
  const oauthError = getOAuthErrorFromUrl();
  const oauthInProgress = hasOAuthTokensInUrl();

  // === TIMEOUT DE SÉCURITÉ 10 SECONDES ===
  useEffect(() => {
    if (oauthInProgress && !user && !loading) {
      console.log('[ProtectedRoute] ⏰ Démarrage timer timeout OAuth (10s)');
      
      const timer = setTimeout(() => {
        console.error('[ProtectedRoute] ⏰ TIMEOUT OAuth atteint (10s)');
        console.error('[ProtectedRoute] user:', !!user, 'loading:', loading);
        setOauthTimeout(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, oauthInProgress]);

  // Log de l'erreur OAuth au montage
  useEffect(() => {
    if (oauthError) {
      console.error('[ProtectedRoute] 🔴 ========== ERREUR OAUTH DÉTECTÉE AU MONTAGE ==========');
      console.error('[ProtectedRoute] Error:', oauthError.error);
      console.error('[ProtectedRoute] Description:', oauthError.description);
      console.error('[ProtectedRoute] URL complète:', window.location.href);
    }
  }, [oauthError]);

  // === LOGS DE DIAGNOSTIC ===
  console.log('🛡️ État ProtectedRoute:', {
    user: !!user,
    loading,
    oauthError: !!oauthError,
    oauthInProgress,
    oauthTimeout,
    path: window.location.pathname,
    hash: window.location.hash ? '[TOKENS]' : '[vide]',
    search: window.location.search ? '[PARAMS]' : '[vide]'
  });

  // === RENDU CONDITIONNEL (après tous les hooks) ===

  // 🔴 CAS 1: ERREUR OAUTH → REDIRECTION IMMÉDIATE (avant loading check!)
  if (oauthError) {
    console.error('[ProtectedRoute] 🔴 REDIRECTION IMMÉDIATE vers /login (erreur OAuth)');
    toast.error(`Échec de connexion: ${oauthError.description}`);
    return <Navigate to="/login" replace />;
  }

  // Loading state - afficher le loader SEULEMENT si pas de user
  // FIX CRITIQUE: Autoriser l'accès si user existe, même si loading = true (profil en cours)
  if (loading && !user) {
    console.log('[ProtectedRoute] ⏳ En attente de la session (user=null, loading=true)...');
    return (
      <div className="min-h-screen bg-greige flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-garage" />
          <p className="text-carbon/60 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  // 🔴 CAS 2: TIMEOUT OAuth atteint
  if (oauthTimeout) {
    console.error('[ProtectedRoute] 🔴 TIMEOUT - Redirection forcée vers /login');
    toast.error('La connexion a pris trop de temps. Veuillez réessayer.');
    return <Navigate to="/login" replace />;
  }

  // 🛡️ GARDE ANTI-BOUCLE OAUTH (user=null)
  if (!user) {
    // 🔄 CAS 3: Tokens présents mais pas encore parsés → spinner temporaire
    if (oauthInProgress) {
      console.log('[ProtectedRoute] 🔄 Tokens OAuth détectés dans l\'URL');
      console.log('[ProtectedRoute] ⏳ Attente du parsing Supabase (max 10s)...');
      console.log('[ProtectedRoute] 🛡️ BLOCAGE de la redirection vers /login');
      
      return (
        <div className="min-h-screen bg-greige flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-garage" />
            <p className="text-carbon/60 font-medium">Finalisation de la connexion...</p>
            <p className="text-carbon/40 text-sm">Timeout dans 10 secondes</p>
          </div>
        </div>
      );
    }
    
    // ⚠️ CAS 4: Pas de user, pas de tokens → redirection login
    console.log('[ProtectedRoute] ⚠️ REDIRECTION FORCÉE vers /login');
    console.log('[ProtectedRoute] Raison: user est null, pas de tokens OAuth');
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] ✅ Accès autorisé pour:', user.email);
  return <>{children}</>;
};

export default ProtectedRoute;
