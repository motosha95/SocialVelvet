export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  primary: string;
  danger: string;
  border: string;
}

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F6F7F9',
  text: '#0B0F14',
  mutedText: '#5B6472',
  primary: '#2D6CDF',
  danger: '#D12C2C',
  border: '#E3E7EE',
};

export const darkColors: ThemeColors = {
  background: '#0B0F14',
  surface: '#111823',
  text: '#E9EEF6',
  mutedText: '#A7B2C3',
  primary: '#6FA3FF',
  danger: '#FF6B6B',
  border: '#1E2A3A',
};
