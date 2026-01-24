import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  display_name: string | null;
  performance_points: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile;
  };

  useEffect(() => {
    // Flag pour éviter les mises à jour après unmount
    let isMounted = true;
    
    console.log('[Auth] ========== INITIALISATION ==========');
    console.log('[Auth] Setting up onAuthStateChange listener...');
    
    // onAuthStateChange est la SOURCE DE VÉRITÉ UNIQUE
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Éviter les mises à jour si le composant est démonté
        if (!isMounted) {
          console.log('[Auth] ⚠️ Component unmounted, skipping state update');
          return;
        }
        
        // === LOGS DE DEBUG AUTH ===
        console.log('[Auth] ========== AUTH STATE CHANGE ==========');
        console.log('[Auth] Event:', event);
        console.log('[Auth] Session exists:', !!session);
        console.log('[Auth] Current path:', window.location.pathname);
        
        if (session?.user) {
          console.log('[Auth] User ID:', session.user.id);
          console.log('[Auth] User email:', session.user.email);
          console.log('[Auth] Provider:', session.user.app_metadata?.provider);
          
          // Confirmation spécifique Google OAuth
          if (event === 'SIGNED_IN' && session.user.app_metadata?.provider === 'google') {
            console.log('[Auth] ========== GOOGLE OAUTH SUCCESS ==========');
            console.log('[Auth] ✅ Connexion Google réussie pour:', session.user.email);
            console.log('[Auth] User sera redirigé vers /garage par le router');
          }
        }
        
        // Synchroniser session et user IMMÉDIATEMENT
        setSession(session);
        setUser(session?.user ?? null);
        
        // Charger le profil AVANT de passer loading à false
        if (session?.user) {
          console.log('[Auth] 📥 Chargement du profil...');
          const profile = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(profile);
            console.log('[Auth] ✅ Profile chargé:', profile?.display_name || 'Aucun nom');
          }
        } else {
          setProfile(null);
          console.log('[Auth] 🔓 Aucune session, profil réinitialisé');
        }
        
        // CRITIQUE: setLoading(false) SEULEMENT après tout le reste
        if (isMounted) {
          setLoading(false);
          console.log('[Auth] ✅ Loading terminé, état 100% synchronisé');
          console.log('[Auth] Final state - user:', !!session?.user, 'loading: false');
        }
      }
    );

    // Déclencher la vérification initiale - onAuthStateChange recevra le résultat
    // NE PAS appeler setLoading(false) ici, laisser onAuthStateChange gérer
    console.log('[Auth] 🔄 Triggering initial session check via getSession()...');
    supabase.auth.getSession();

    return () => {
      console.log('[Auth] 🧹 Cleanup - unsubscribing from auth state changes');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const signInWithGoogle = async () => {
    // Redirection explicite vers /garage après OAuth
    const redirectUrl = `${window.location.origin}/garage`;
    
    // === LOGS DE DEBUG GOOGLE OAUTH ===
    console.log('[Google OAuth] ========== STARTING AUTHENTICATION ==========');
    console.log('[Google OAuth] Current origin:', window.location.origin);
    console.log('[Google OAuth] Redirect URL:', redirectUrl);
    console.log('[Google OAuth] Expected callback: https://kqsxscjtlipregkrmucg.supabase.co/auth/v1/callback');
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      
      if (error) {
        console.error('[Google OAuth] ========== ERROR ==========');
        console.error('[Google OAuth] Message:', error.message);
        console.error('[Google OAuth] Full error:', error);
        
        // Diagnostic automatique
        if (error.message.includes('redirect_uri_mismatch')) {
          console.error('[Google OAuth] 🔴 DIAGNOSTIC: redirect_uri_mismatch');
          console.error('[Google OAuth] ACTION: Vérifiez les "Authorized redirect URIs" dans Google Cloud Console');
          console.error('[Google OAuth] URI attendue: https://kqsxscjtlipregkrmucg.supabase.co/auth/v1/callback');
        } else if (error.message.includes('invalid_client')) {
          console.error('[Google OAuth] 🔴 DIAGNOSTIC: invalid_client');
          console.error('[Google OAuth] ACTION: Le Client ID ou Client Secret est incorrect dans Lovable Cloud');
        } else if (error.message.includes('requested path is invalid')) {
          console.error('[Google OAuth] 🔴 DIAGNOSTIC: Site URL mismatch');
          console.error('[Google OAuth] ACTION: Vérifiez Site URL dans Lovable Cloud Auth Settings');
        } else if (error.message.includes('access_denied')) {
          console.error('[Google OAuth] 🔴 DIAGNOSTIC: access_denied');
          console.error('[Google OAuth] ACTION: L\'utilisateur a refusé l\'accès ou le compte Google n\'est pas autorisé');
        }
        
        return { error };
      }
      
      console.log('[Google OAuth] ========== REDIRECT INITIATED ==========');
      console.log('[Google OAuth] Provider:', data?.provider);
      console.log('[Google OAuth] Redirect URL:', data?.url);
      
      return { error: null };
    } catch (e) {
      console.error('[Google OAuth] ========== UNEXPECTED ERROR ==========');
      console.error('[Google OAuth] Exception:', e);
      return { error: e as Error };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const updatedProfile = await fetchProfile(user.id);
      setProfile(updatedProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
