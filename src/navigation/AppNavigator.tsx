import React from 'react';
import { NavigationContainer, type Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTheme } from '../theme/useTheme';
import { useAuthStore } from '../store/auth/authStore';
import type { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainTabs } from './MainTabs';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = (): React.JSX.Element => {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);

  const navTheme = React.useMemo<NavTheme>(() => {
    return {
      dark: theme.mode === 'dark',
      colors: {
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.primary,
      },
      fonts: {
        regular: {
          fontFamily: theme.typography.fontRegular,
          fontWeight: '400',
        },
        medium: {
          fontFamily: theme.typography.fontMedium,
          fontWeight: '500',
        },
        bold: {
          fontFamily: theme.typography.fontMedium,
          fontWeight: '600',
        },
        heavy: {
          fontFamily: theme.typography.fontMedium,
          fontWeight: '700',
        },
      },
    };
  }, [theme.colors.background, theme.colors.border, theme.colors.primary, theme.colors.surface, theme.colors.text, theme.mode, theme.typography.fontMedium, theme.typography.fontRegular]);

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <RootStack.Screen name="AppTabs" component={MainTabs} />
        ) : (
          <RootStack.Screen name="AuthStack" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
