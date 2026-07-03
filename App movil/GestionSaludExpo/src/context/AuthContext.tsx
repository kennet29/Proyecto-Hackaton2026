import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

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

type LogoutOptions = {
  message?: string;
};

interface AuthContextValue {
  isHydrated: boolean;
  token: string | null;
  user: AuthUser | null;
  sessionMessage: string | null;
  login: (payload: LoginPayload) => void;
  logout: (options?: LogoutOptions) => void;
  clearSessionMessage: () => void;
}

const SESSION_STORAGE_KEY = '@gs_auth_session';
const EXPIRED_SESSION_MESSAGE = 'Tu sesion ha caducado. Inicia sesion nuevamente.';
const INVALID_SESSION_MESSAGE = 'Tu sesion ya no es valida. Inicia sesion nuevamente.';

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding =
    normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const decoder = globalThis.atob;

  if (typeof decoder !== 'function') {
    throw new Error('base64 decoder unavailable');
  }

  const binary = decoder(`${normalized}${padding}`);

  return decodeURIComponent(
    Array.from(binary)
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  );
};

const getTokenExpirationTime = (accessToken: string): number | null => {
  try {
    const [, payload] = accessToken.split('.');
    if (!payload) {
      return null;
    }
    const parsed = JSON.parse(decodeBase64Url(payload)) as { exp?: number };
    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
};

const AuthContext = createContext<AuthContextValue>({
  isHydrated: false,
  token: null,
  user: null,
  sessionMessage: null,
  login: () => undefined,
  logout: () => undefined,
  clearSessionMessage: () => undefined,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const expirationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpirationTimeout = () => {
    if (!expirationTimeoutRef.current) {
      return;
    }
    clearTimeout(expirationTimeoutRef.current);
    expirationTimeoutRef.current = null;
  };

  const clearStoredSession = async () => {
    try {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn('[auth] no se pudo limpiar la sesion local', error);
    }
  };

  const resetSession = (message?: string) => {
    clearExpirationTimeout();
    setToken(null);
    setUser(null);
    setSessionMessage(message ?? null);
    void clearStoredSession();
  };

  const clearSessionMessage = () => {
    setSessionMessage(null);
  };

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
          await clearStoredSession();
          return;
        }
        const expiresAt = getTokenExpirationTime(session.token);
        if (!expiresAt) {
          await clearStoredSession();
          if (mounted) {
            setSessionMessage(INVALID_SESSION_MESSAGE);
          }
          return;
        }
        if (expiresAt <= Date.now()) {
          await clearStoredSession();
          if (mounted) {
            setSessionMessage(EXPIRED_SESSION_MESSAGE);
          }
          return;
        }
        if (!mounted) {
          return;
        }
        setToken(session.token);
        setUser(session.user);
      } catch (error) {
        console.warn('[auth] no se pudo restaurar la sesion local', error);
        await clearStoredSession();
        if (mounted) {
          setSessionMessage(INVALID_SESSION_MESSAGE);
        }
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

    clearExpirationTimeout();

    if (!token || !user) {
      return;
    }

    const expiresAt = getTokenExpirationTime(token);
    if (!expiresAt) {
      resetSession(INVALID_SESSION_MESSAGE);
      return;
    }

    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) {
      resetSession(EXPIRED_SESSION_MESSAGE);
      return;
    }

    expirationTimeoutRef.current = setTimeout(() => {
      resetSession(EXPIRED_SESSION_MESSAGE);
    }, remainingMs);

    return () => {
      clearExpirationTimeout();
    };
  }, [isHydrated, token, user]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persistSession = async () => {
      try {
        if (!token || !user) {
          await clearStoredSession();
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
      sessionMessage,
      login: ({ token: newToken, user: authUser }) => {
        clearSessionMessage();
        setToken(newToken);
        setUser(authUser);
      },
      logout: (options) => {
        resetSession(options?.message);
      },
      clearSessionMessage,
    }),
    [isHydrated, sessionMessage, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
