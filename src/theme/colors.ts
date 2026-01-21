export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  primary: string;
  danger: string;
  border: string;
}

// Brand colors based on logo: Vibrant red, cream/beige, black
export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FAFAFA',
  text: '#0B0F14',
  mutedText: '#5B6472',
  primary: '#DC2626', // Vibrant red from logo
  danger: '#D12C2C',
  border: '#E5E5E5',
};

export const darkColors: ThemeColors = {
  background: '#0B0F14', // Black background matching logo
  surface: '#1A1A1A',
  text: '#F5F5DC', // Cream/beige matching logo text
  mutedText: '#A8A8A8',
  primary: '#E63946', // Slightly brighter red for dark mode visibility
  danger: '#FF6B6B',
  border: '#2A2A2A',
};
