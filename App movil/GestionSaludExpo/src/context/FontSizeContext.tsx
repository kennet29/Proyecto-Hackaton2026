import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type FontSizePreference = 'small' | 'default' | 'large';

const fontScales: Record<FontSizePreference, number> = {
  small: 0.88,
  default: 1,
  large: 1.18,
};

type FontSizeContextValue = {
  preference: FontSizePreference;
  fontScale: number;
  setFontSizePreference: (preference: FontSizePreference) => void;
};

const FontSizeContext = createContext<FontSizeContextValue>({
  preference: 'default',
  fontScale: fontScales.default,
  setFontSizePreference: () => undefined,
});

const FONT_SIZE_KEY = '@gestion_salud/font_size';

export const FontSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreference] = useState<FontSizePreference>('default');

  useEffect(() => {
    AsyncStorage.getItem(FONT_SIZE_KEY)
      .then((savedPreference) => {
        if (savedPreference === 'small' || savedPreference === 'default' || savedPreference === 'large') {
          setPreference(savedPreference);
        }
      })
      .catch(() => undefined);
  }, []);

  const setFontSizePreference = (nextPreference: FontSizePreference) => {
    setPreference(nextPreference);
    void AsyncStorage.setItem(FONT_SIZE_KEY, nextPreference).catch(() => undefined);
  };

  const value = useMemo(
    () => ({ preference, fontScale: fontScales[preference], setFontSizePreference }),
    [preference],
  );

  return <FontSizeContext.Provider value={value}>{children}</FontSizeContext.Provider>;
};

export const useFontSize = () => useContext(FontSizeContext);
