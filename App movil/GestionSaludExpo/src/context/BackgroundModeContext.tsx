import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type BackgroundMode = 'dark' | 'light';

type BackgroundModeContextValue = {
  mode: BackgroundMode;
  toggleBackground: () => void;
};

const BackgroundModeContext = createContext<BackgroundModeContextValue>({
  mode: 'dark',
  toggleBackground: () => undefined,
});

const BACKGROUND_MODE_KEY = '@gestion_salud/background_mode';

export const BackgroundModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<BackgroundMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(BACKGROUND_MODE_KEY)
      .then((savedMode) => {
        if (savedMode === 'dark' || savedMode === 'light') setMode(savedMode);
      })
      .catch(() => undefined);
  }, []);

  const toggleBackground = () => {
    setMode((current) => {
      const nextMode: BackgroundMode = current === 'dark' ? 'light' : 'dark';
      void AsyncStorage.setItem(BACKGROUND_MODE_KEY, nextMode).catch(() => undefined);
      return nextMode;
    });
  };

  const value = useMemo(
    () => ({
      mode,
      toggleBackground,
    }),
    [mode],
  );

  return <BackgroundModeContext.Provider value={value}>{children}</BackgroundModeContext.Provider>;
};

export const useBackgroundMode = () => useContext(BackgroundModeContext);
