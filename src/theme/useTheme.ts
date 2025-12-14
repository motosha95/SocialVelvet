import { useThemeContext } from './ThemeProvider';

export const useTheme = () => {
  return useThemeContext().theme;
};
