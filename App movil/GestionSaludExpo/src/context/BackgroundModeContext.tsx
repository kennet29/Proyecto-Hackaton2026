import React, { createContext, useContext, useMemo, useState } from 'react';

type BackgroundMode = 'dark' | 'light';

type BackgroundModeContextValue = {
  mode: BackgroundMode;
  toggleBackground: () => void;
};

const BackgroundModeContext = createContext<BackgroundModeContextValue>({
  mode: 'dark',
  toggleBackground: () => undefined,
});

export const BackgroundModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<BackgroundMode>('dark');
  const value = useMemo(
    () => ({
      mode,
      toggleBackground: () => setMode((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [mode],
  );

  return <BackgroundModeContext.Provider value={value}>{children}</BackgroundModeContext.Provider>;
};

export const useBackgroundMode = () => useContext(BackgroundModeContext);
