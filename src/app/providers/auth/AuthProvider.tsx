import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AuthContext } from "./AuthContext";
import { authService } from "@/shared/api/auth/auth.service";
import { staffService } from "@/shared/api/staff/staff.service";
import type { CurrentUser, UserSession } from "@/shared/types/auth";
import { supabase } from "@/shared/lib/supabase";

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const currentSession = await authService.getSession();

      if (!currentSession) {
        setUser(null);
        setSession(null);
        return;
      }

      const currentUser = await staffService.getCurrentStaff(
        currentSession.user.id
      );

      setUser(currentUser);
      setSession({
        accessToken: currentSession.access_token,
        refreshToken: currentSession.refresh_token,
        expiresAt: currentSession.expires_at ?? 0,
        user: currentUser,
      });
    } catch (error) {
      console.error(error);
      setUser(null);
      setSession(null);
      await authService.logout().catch(() => {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadSession();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        void loadSession();
      }
    });

    return () => subscription.unsubscribe();
  }, [loadSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        await authService.login(email, password);
        await loadSession();
      } catch (error) {
        setLoading(false);
        throw error; // отдаём форме логина показать ошибку
      }
    },
    [loadSession]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    await authService.logout();
    setUser(null);
    setSession(null);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await authService.refreshSession();
    await loadSession();
  }, [loadSession]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAuthenticated: session !== null,
      login,
      logout,
      refresh,
    }),
    [user, session, loading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}