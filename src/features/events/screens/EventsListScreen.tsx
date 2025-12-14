import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { useTheme } from '../../../theme/useTheme';

export const EventsListScreen = (): React.JSX.Element => {
  const theme = useTheme();

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      card: {
        marginTop: theme.spacing.lg,
        padding: theme.spacing.md,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      },
    });
  }, [theme.colors.border, theme.colors.surface, theme.spacing.lg, theme.spacing.md]);

  return (
    <Screen>
      <AppText variant="title">Events</AppText>
      <AppText color="muted">This is a placeholder until we wire a real API.</AppText>

      <View style={styles.card}>
        <AppText>Next steps: typed event models + list + details screen.</AppText>
      </View>
    </Screen>
  );
};
