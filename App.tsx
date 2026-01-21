import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { SplashScreen, useHideSplashScreen } from './src/components/layout/SplashScreen';
import { useAuthStore } from './src/store/auth/authStore';

const AppContent = (): React.JSX.Element => {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  useHideSplashScreen(hasHydrated);

  if (!hasHydrated) {
    return <SplashScreen />;
  }

  return <AppNavigator />;
};

export default function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <AppContent />
    </ThemeProvider>
  );
}
