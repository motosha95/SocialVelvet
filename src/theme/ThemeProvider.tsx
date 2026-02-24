import React from 'react';
import { Appearance } from 'react-native';

import type { Theme, ThemeMode } from './theme';
import { createTheme } from './theme';

interface ThemeContextValue {
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps): React.JSX.Element => {
  const initialMode: ThemeMode = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  const [mode, setMode] = React.useState<ThemeMode>(initialMode);

  const value = React.useMemo<ThemeContextValue>(() => {
    return {
      theme: createTheme(mode),
      setMode,
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = (): ThemeContextValue => {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return ctx;
};
