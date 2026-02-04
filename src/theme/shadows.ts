import { Platform, ViewStyle } from 'react-native';

export type ShadowPreset = 'none' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Platform-aware shadow styles for consistent elevation across iOS and Android.
 */
export function getShadow(preset: ShadowPreset, isDark: boolean = false): ViewStyle {
  const shadowColor = isDark ? '#000000' : '#000000';
  const shadowOpacity = isDark ? 0.4 : 0.08;

  switch (preset) {
    case 'none':
      return {};
    case 'sm':
      return Platform.select({
        ios: {
          shadowColor,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: shadowOpacity * 0.8,
          shadowRadius: 2,
        },
        android: { elevation: 2 },
      }) || {};
    case 'md':
      return Platform.select({
        ios: {
          shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity,
          shadowRadius: 4,
        },
        android: { elevation: 4 },
      }) || {};
    case 'lg':
      return Platform.select({
        ios: {
          shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: shadowOpacity * 1.2,
          shadowRadius: 8,
        },
        android: { elevation: 8 },
      }) || {};
    case 'xl':
      return Platform.select({
        ios: {
          shadowColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: shadowOpacity * 1.5,
          shadowRadius: 12,
        },
        android: { elevation: 12 },
      }) || {};
    default:
      return {};
  }
}
