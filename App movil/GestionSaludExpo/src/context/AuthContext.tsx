import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getTokenExpirationTime } from '../utils/jwt';
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from '../utils/secureSessionStorage';

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
  initialPrivateRoute?: 'MedicoRegistro' | 'AdminSolicitudes' | 'AdminClinicas';
};

type LogoutOptions = {
  message?: string;
};

interface AuthContextValue {
  isHydrated: boolean;
  token: string | null;
  user: AuthUser | null;
  sessionMessage: string | null;
  initialPrivateRoute: 'MedicoRegistro' | 'AdminSolicitudes' | 'AdminClinicas' | null;
  login: (payload: LoginPayload) => void;
  logout: (options?: LogoutOptions) => void;
  clearSessionMessage: () => void;
}

const EXPIRED_SESSION_MESSAGE = 'Tu sesion ha caducado. Inicia sesion nuevamente.';
const INVALID_SESSION_MESSAGE = 'Tu sesion ya no es valida. Inicia sesion nuevamente.';

const AuthContext = createContext<AuthContextValue>({
  isHydrated: false,
  token: null,
  user: null,
  sessionMessage: null,
  initialPrivateRoute: null,
  login: () => undefined,
  logout: () => undefined,
  clearSessionMessage: () => undefined,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [initialPrivateRoute, setInitialPrivateRoute] = useState<
    'MedicoRegistro' | 'AdminSolicitudes' | 'AdminClinicas' | null
  >(null);
  const expirationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpirationTimeout = () => {
    if (!expirationTimeoutRef.current) {
      return;
    }
    clearTimeout(expirationTimeoutRef.current);
    expirationTimeoutRef.current = null;
  };

  const resetSession = (message?: string) => {
    clearExpirationTimeout();
    setToken(null);
    setUser(null);
    setSessionMessage(message ?? null);
    setInitialPrivateRoute(null);
    void clearStoredSession().catch((error) => {
      console.warn('[auth] no se pudo limpiar la sesion local', error);
    });
  };

  const clearSessionMessage = () => {
    setSessionMessage(null);
  };

  useEffect(() => {
    let mounted = true;

    const hydrateSession = async () => {
      try {
        const session = await readStoredSession();
        if (!session) {
          return;
        }
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
        await writeStoredSession({ token, user });
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
      initialPrivateRoute,
      login: ({ token: newToken, user: authUser, initialPrivateRoute: requestedRoute }) => {
        clearSessionMessage();
        setInitialPrivateRoute(requestedRoute ?? null);
        setToken(newToken);
        setUser(authUser);
      },
      logout: (options) => {
        resetSession(options?.message);
      },
      clearSessionMessage,
    }),
    [initialPrivateRoute, isHydrated, sessionMessage, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
