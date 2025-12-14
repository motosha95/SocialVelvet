import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { useTheme } from '../../../theme/useTheme';

export const ChatListScreen = (): React.JSX.Element => {
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
      <AppText variant="title">Chat</AppText>
      <AppText color="muted">Placeholder chat list.</AppText>

      <View style={styles.card}>
        <AppText>Next steps: deterministic message store + realtime service isolation.</AppText>
      </View>
    </Screen>
  );
};
