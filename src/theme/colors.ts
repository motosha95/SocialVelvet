export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  primary: string;
  primaryLight: string;
  danger: string;
  success: string;
  border: string;
  shadow: string;
}

// Brand: Velvet red, warm neutrals, refined palette
export const lightColors: ThemeColors = {
  background: '#F8F7F5',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  mutedText: '#6B7280',
  primary: '#C41E3A',
  primaryLight: '#FEE2E7',
  danger: '#DC2626',
  success: '#059669',
  border: '#E8E6E3',
  shadow: 'rgba(0,0,0,0.08)',
};

export const darkColors: ThemeColors = {
  background: '#0F0F0F',
  surface: '#1C1C1E',
  text: '#F5F5F0',
  mutedText: '#9CA3AF',
  primary: '#E63946',
  primaryLight: '#3D1F24',
  danger: '#EF4444',
  success: '#10B981',
  border: '#2C2C2E',
  shadow: 'rgba(0,0,0,0.4)',
};
