import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { useThemeContext } from '../../../theme/ThemeProvider';
import { useAuthStore } from '../../../store/auth/authStore';

export const ProfileScreen = (): React.JSX.Element => {
  const { theme, setMode } = useThemeContext();
  const signOut = useAuthStore((s) => s.signOut);

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      row: {
        marginTop: theme.spacing.md,
        gap: theme.spacing.sm,
      },
      card: {
        marginTop: theme.spacing.lg,
        padding: theme.spacing.md,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      },
    });
  }, [theme.colors.border, theme.colors.surface, theme.spacing.lg, theme.spacing.md, theme.spacing.sm]);

  const toggleTheme = (): void => {
    setMode(theme.mode === 'dark' ? 'light' : 'dark');
  };

  return (
    <Screen>
      <AppText variant="title">Profile</AppText>
      <AppText color="muted">Session + theme controls.</AppText>

      <View style={styles.card}>
        <AppText>Theme: {theme.mode}</AppText>
        <View style={styles.row}>
          <Button label="Toggle theme" onPress={toggleTheme} />
          <Button label="Sign out" onPress={() => void signOut()} variant="danger" />
        </View>
      </View>
    </Screen>
  );
};
