// Re-export so existing imports keep working
export { AuthContext } from './AuthContextDef';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AuthUser, Persona } from '../types';
import { AuthContext } from './AuthContextDef';

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
      setLoading(false);
    }, 5000);
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

    // Solo se usa en la carga inicial (primera vez o login fresco).
    // NO se llama en refreshes de token, para no interferir con el cliente Supabase.
    const loadPersonaData = async (userId: string, email: string): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('personas')
          .select('*')
          .eq('id_usuario', userId)
          .single();

        if (!mounted) return;

        if (error) {
          done();
          return;
        }

        if (data) {
          const authUser: AuthUser = { id: userId, email, persona: data as Persona };
          setUser(authUser);
          userRef.current = authUser;
        }
      } catch {
        // error silencioso
      } finally {
        done();
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

            if (userRef.current) {
              // El token fue refrescado automáticamente por Supabase.
              // El cliente ya tiene el nuevo JWT internamente — no hacer NADA más.
              // Hacer queries adicionales aquí interfiere con el refresh y bloquea
              // las queries de los módulos.
              return;
            }

            // Sin usuario en memoria → login real, cargar datos con spinner.
            armSafetyTimer();
            await loadPersonaData(session.user.id, session.user.email ?? '');

          } else {
            // Primer SIGNED_IN tras getSession → ya lo manejó getSession, ignorar.
            initialSessionHandled.current = true;
          }

        } else if (event === 'TOKEN_REFRESHED') {
          // Supabase ya actualizó el JWT internamente. No hacer nada adicional.
          return;

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