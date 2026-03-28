import React, { createContext, useContext, useMemo, useState } from 'react';

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
  token: string | null;
  user: AuthUser | null;
  login: (payload: LoginPayload) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  user: null,
  login: () => undefined,
  logout: () => undefined,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
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
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
