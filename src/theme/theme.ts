import type { ThemeColors } from './colors';
import { darkColors, lightColors } from './colors';
import type { ThemeSpacing } from './spacing';
import { spacing } from './spacing';
import type { ThemeTypography } from './typography';
import { typography } from './typography';
import { getShadow, type ShadowPreset } from './shadows';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  shadow: (preset: ShadowPreset) => ReturnType<typeof getShadow>;
}

export const createTheme = (mode: ThemeMode): Theme => {
  const colors = mode === 'dark' ? darkColors : lightColors;
  return {
    mode,
    colors,
    spacing,
    typography,
    shadow: (preset) => getShadow(preset, mode === 'dark'),
  };
};
