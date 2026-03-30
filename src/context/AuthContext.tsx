import React, { createContext, useEffect, useRef, useState } from 'react';
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
  signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const initialSessionHandled = useRef(false);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef<AuthUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const armSafetyTimer = () => {
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = setTimeout(() => {
      setLoading(prev => {
        if (prev) console.warn('[AuthContext] Safety timeout: loading forzado a false');
        return false;
      });
    }, 8000);
  };

  const disarmSafetyTimer = () => {
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  };

  useEffect(() => {
    let mounted = true;
    armSafetyTimer();

    const done = () => {
      if (mounted) {
        setLoading(false);
        disarmSafetyTimer();
      }
    };

    // Carga inicial con loading visible (primera vez o recarga de página)
    const loadPersonaData = async (userId: string, email: string): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('personas')
          .select('*')
          .eq('id_usuario', userId)
          .single();

        if (!mounted) return;

        if (error) {
          console.error('[AuthContext] Error fetching persona:', error);
          done();
          return;
        }

        if (data) {
          const authUser: AuthUser = { id: userId, email, persona: data as Persona };
          setUser(authUser);
          userRef.current = authUser;
        }
      } catch (err) {
        console.error('[AuthContext] Unexpected error:', err);
      } finally {
        done();
      }
    };

    // Refresco silencioso: NO toca loading ni el spinner.
    // Se usa cuando el token se refresca automáticamente y el user ya está en memoria.
    const silentRefreshPersona = async (userId: string, email: string): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('personas')
          .select('*')
          .eq('id_usuario', userId)
          .single();

        if (!mounted || error || !data) return;

        const authUser: AuthUser = { id: userId, email, persona: data as Persona };
        setUser(authUser);
        userRef.current = authUser;
      } catch (err) {
        console.error('[AuthContext] Silent refresh error:', err);
      }
    };

    const isSessionOnly = localStorage.getItem('session_only') === 'true';
    const isActiveTab = sessionStorage.getItem('active_tab') === 'true';

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user && isSessionOnly && !isActiveTab) {
        await supabase.auth.signOut();
        localStorage.removeItem('session_only');
        done();
        return;
      }

      if (session?.user) {
        if (isSessionOnly) sessionStorage.setItem('active_tab', 'true');
        initialSessionHandled.current = true;
        await loadPersonaData(session.user.id, session.user.email ?? '');
      } else {
        initialSessionHandled.current = true;
        done();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          if (initialSessionHandled.current) {
            if (localStorage.getItem('session_only') === 'true') {
              sessionStorage.setItem('active_tab', 'true');
            }
            // Si ya hay un usuario en memoria, es un re-login por refresco de token.
            // Refrescamos silenciosamente SIN activar loading para evitar spinner infinito.
            if (userRef.current) {
              await silentRefreshPersona(session.user.id, session.user.email ?? '');
            } else {
              // Sin usuario en memoria → carga normal con spinner
              armSafetyTimer();
              await loadPersonaData(session.user.id, session.user.email ?? '');
            }
          } else {
            initialSessionHandled.current = true;
          }

        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token refrescado automáticamente por Supabase — refrescar silenciosamente
          // sin mostrar spinner al usuario.
          await silentRefreshPersona(session.user.id, session.user.email ?? '');

        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('session_only');
          sessionStorage.removeItem('active_tab');
          initialSessionHandled.current = false;
          if (mounted) {
            setUser(null);
            userRef.current = null;
            done();
          }
        }
      }
    );

    return () => {
      mounted = false;
      disarmSafetyTimer();
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    userRef.current = null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};