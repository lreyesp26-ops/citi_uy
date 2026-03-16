import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthUser, Persona } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPersonaData = async (userId: string, email: string) => {
      try {
        const { data, error } = await supabase
          .from('personas')
          .select('*')
          .eq('id_usuario', userId)
          .single();

        if (error) {
          console.error('Error fetching persona:', error);
          if (mounted) setLoading(false);
          return;
        }

        if (mounted && data) {
          setUser({
            id: userId,
            email,
            persona: data as Persona,
          });
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Check initial session
    const isSessionOnly = localStorage.getItem('session_only') === 'true';
    const isActiveTab = sessionStorage.getItem('active_tab') === 'true';

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // If session exists but we are in a new tab for a 'session_only' login, sign out
      if (session?.user && isSessionOnly && !isActiveTab) {
        await supabase.auth.signOut();
        localStorage.removeItem('session_only');
        if (mounted) setLoading(false);
        return;
      }

      if (session?.user) {
        // Refresh active tab in case it's a valid session restored
        if (isSessionOnly) sessionStorage.setItem('active_tab', 'true');
        await loadPersonaData(session.user.id, session.user.email || '');
      } else {
        if (mounted) setLoading(false);
      }
    });

    // Listen for auth changes (login/logout only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          if (localStorage.getItem('session_only') === 'true') {
            sessionStorage.setItem('active_tab', 'true');
          }
          await loadPersonaData(session.user.id, session.user.email || '');
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('session_only');
          sessionStorage.removeItem('active_tab');
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
