import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AuthUser = {
  id: number;
  username: string;
  role?: string;
  pacienteId?: number | null;
  pacienteIds?: number[];
};

type LoginPayload = {
  token: string;
  user: AuthUser;
};

interface AuthContextValue {
  isHydrated: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (payload: LoginPayload) => void;
  logout: () => void;
}

const SESSION_STORAGE_KEY = '@gs_auth_session';

const AuthContext = createContext<AuthContextValue>({
  isHydrated: false,
  token: null,
  user: null,
  login: () => undefined,
  logout: () => undefined,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let mounted = true;

    const hydrateSession = async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) {
          return;
        }
        const session = JSON.parse(raw) as LoginPayload | null;
        if (!session?.token || !session?.user) {
          await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
          return;
        }
        if (!mounted) {
          return;
        }
        setToken(session.token);
        setUser(session.user);
      } catch (error) {
        console.warn('[auth] no se pudo restaurar la sesion local', error);
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        if (mounted) {
          setIsHydrated(true);
        }
      }
    };

    hydrateSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persistSession = async () => {
      try {
        if (!token || !user) {
          await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
          return;
        }
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token, user }));
      } catch (error) {
        console.warn('[auth] no se pudo persistir la sesion local', error);
      }
    };

    persistSession();
  }, [isHydrated, token, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isHydrated,
      token,
      user,
      login: ({ token: newToken, user: authUser }) => {
        setToken(newToken);
        setUser(authUser);
      },
      logout: () => {
        setToken(null);
        setUser(null);
      },
    }),
    [isHydrated, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
