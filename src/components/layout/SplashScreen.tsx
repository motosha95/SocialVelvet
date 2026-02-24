import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import * as SplashScreenModule from 'expo-splash-screen';

import { useTheme } from '../../theme/useTheme';
import { Logo } from '../ui/Logo';
import { AppText } from '../ui/AppText';

// Keep the native splash screen visible while we fetch resources
SplashScreenModule.preventAutoHideAsync();

interface SplashScreenProps {
  style?: ViewStyle;
}

export const SplashScreen = ({ style }: SplashScreenProps): React.JSX.Element => {
  const theme = useTheme();

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
      },
      logo: {
        marginBottom: theme.spacing.xl,
      },
      subtitle: {
        marginTop: theme.spacing.lg,
      },
      loading: {
        marginTop: theme.spacing.lg,
      },
    });
  }, [theme.colors.background, theme.spacing.lg, theme.spacing.xl]);

  return (
    <View style={[styles.container, style]}>
      <Logo size={160} style={styles.logo} />
      <AppText variant="title" style={{ color: theme.colors.primary }}>
        Socializing
      </AppText>
      <AppText color="muted" style={styles.subtitle}>
        Meet People
      </AppText>
      <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loading} />
    </View>
  );
};

/**
 * Hook to hide the splash screen when app is ready
 */
export const useHideSplashScreen = (isReady: boolean): void => {
  useEffect(() => {
    if (!isReady) {
      return undefined;
    }

    const hideSplash = async (): Promise<void> => {
      try {
        await SplashScreenModule.hideAsync();
      } catch (error) {
        console.warn('Error hiding splash screen:', error);
      }
    };

    // Small delay for smooth transition
    const timer = setTimeout(() => {
      void hideSplash();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [isReady]);
};
