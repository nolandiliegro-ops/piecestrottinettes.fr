import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

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
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
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
  const queryClient = useQueryClient();

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
          
          // 🔄 REFETCH IMMÉDIAT CATALOGUE - Se déclenche sur SIGNED_IN et INITIAL_SESSION
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
            console.log(`[Auth] 🔄 Refetch immédiat catalogue (event=${event}, user=${session.user.email})`);
            
            // REFETCH ACTIF au lieu d'invalidation passive
            queryClient.refetchQueries({ queryKey: ['brands'], type: 'active' });
            queryClient.refetchQueries({ queryKey: ['categories'], type: 'active' });
            queryClient.refetchQueries({ queryKey: ['scooter_models'], type: 'active' });
            queryClient.refetchQueries({ queryKey: ['all_parts'], type: 'active' });
            queryClient.refetchQueries({ queryKey: ['compatible_parts'], type: 'active' });
            queryClient.refetchQueries({ queryKey: ['parent-categories'], type: 'active' });
            queryClient.refetchQueries({ queryKey: ['user_scooters'], type: 'active' });
            queryClient.refetchQueries({ queryKey: ['garage'], type: 'active' });
            console.log('[Auth] ✅ Refetch actif lancé - données en cours de rechargement');
          }
          
          // ✅ GOOGLE OAUTH SUCCESS - Pas de redirect, laisser React Router gérer
          if (event === 'SIGNED_IN' && session.user.app_metadata?.provider === 'google') {
            console.log('[Auth] ========== GOOGLE OAUTH SUCCESS ==========');
            console.log('[Auth] ✅ Connexion Google réussie pour:', session.user.email);
            console.log('[Auth] ✅ Données chargées, React Router va gérer la navigation');
          }
        }
        
        // Synchroniser session et user IMMÉDIATEMENT
        setSession(session);
        setUser(session?.user ?? null);
        
        // Charger le profil avec try/catch - NON BLOQUANT
        if (session?.user) {
          console.log('[Auth] 📥 Chargement du profil...');
          try {
            const profile = await fetchProfile(session.user.id);
            if (isMounted) {
              setProfile(profile);
              console.log('[Auth] ✅ Profile chargé:', profile?.display_name || 'Aucun nom');
            }
          } catch (profileError) {
            console.error('[Auth] ⚠️ Erreur chargement profil (non bloquant):', profileError);
            // On continue sans profil, ce n'est pas bloquant
            if (isMounted) {
              setProfile(null);
            }
          }
        } else {
          setProfile(null);
          console.log('[Auth] 🔓 Aucune session, profil réinitialisé');
        }
        
        // CRITIQUE: setLoading(false) TOUJOURS appelé, quoi qu'il arrive
        if (isMounted) {
          setLoading(false);
          console.log('[Auth] ✅ Loading terminé, état synchronisé');
          console.log('[Auth] Final state - user:', !!session?.user, 'loading: false');
        }
      }
    );

    // Déclencher la vérification initiale AVEC gestion d'erreur massive
    console.log('[Auth] 🔄 Triggering initial session check via getSession()...');
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('[Auth] ========== 🔴 ERREUR CRITIQUE getSession() ==========');
        console.error('[Auth] 🔴 Message:', error.message);
        console.error('[Auth] 🔴 Status:', (error as any).status || 'N/A');
        console.error('[Auth] 🔴 Name:', error.name);
        console.error('[Auth] 🔴 Full error:', JSON.stringify(error, null, 2));
        console.error('[Auth] 🔴 URL actuelle:', window.location.href);
        console.error('[Auth] 🔴 Hash:', window.location.hash);
        console.error('[Auth] 🔴 Search:', window.location.search);
        console.error('[Auth] 🔴 Origin:', window.location.origin);
        console.error('[Auth] ============================================');
        
        // Force loading false pour débloquer l'UI
        if (isMounted) {
          setLoading(false);
        }
      } else {
        console.log('[Auth] ✅ getSession() réussi');
        console.log('[Auth] Session exists:', !!data.session);
        if (data.session?.user) {
          console.log('[Auth] User email:', data.session.user.email);
          console.log('[Auth] Provider:', data.session.user.app_metadata?.provider);
        }
      }
    }).catch((e) => {
      console.error('[Auth] ========== 🔴 EXCEPTION getSession() ==========');
      console.error('[Auth] 🔴 Exception:', e);
      console.error('[Auth] ============================================');
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      console.log('[Auth] 🧹 Cleanup - unsubscribing from auth state changes');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

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
    console.log('[Auth] 🚪 Déconnexion en cours...');
    try {
      // Clear React Query cache BEFORE signout to prevent stale data
      queryClient.clear();
      console.log('[Auth] ✅ Cache cleared');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      console.log('[Auth] ✅ Supabase signOut successful');
      
      // Clear local state
      setUser(null);
      setSession(null);
      setProfile(null);
      console.log('[Auth] ✅ Local state cleared');
    } catch (error) {
      console.error('[Auth] ❌ SignOut error:', error);
      // Force clear state even on error
      setUser(null);
      setSession(null);
      setProfile(null);
      queryClient.clear();
    }
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

  const resetPassword = async (email: string) => {
    // IMPORTANT STABILITY:
    // 1) Purge session best-effort BEFORE requesting a reset, to avoid polluted sessions (old OAuth tokens)
    // 2) Use a canonical redirect URL via URL() to avoid malformed links
    const redirectTo = new URL('/reset-password', window.location.origin).toString();

    const withTimeout = async <T,>(p: Promise<T>, ms: number, label: string): Promise<T> => {
      return await Promise.race([
        p,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`${label} (timeout ${ms}ms)`)), ms)
        ),
      ]);
    };

    try {
      // Best effort: do not block on signOut if network is flaky.
      // Use any-cast to support builds where the 'scope' option typing is absent.
      const authAny = supabase.auth as any;
      await withTimeout(authAny.signOut({ scope: 'global' }), 1500, 'signOut').catch(() => undefined);
    } catch {
      // Ignore - reset should still be attempted
    }

    console.log('[Auth] 📧 Envoi email reset vers:', email);
    console.log('[Auth] 📧 RedirectTo:', redirectTo);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    
    if (error) {
      console.error('[Auth] ❌ Erreur reset password:', error.message);
    } else {
      console.log('[Auth] ✅ Email de reset envoyé');
    }
    
    return { error };
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
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
