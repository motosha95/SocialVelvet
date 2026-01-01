import React from 'react';
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native';

import { useTheme } from '../../theme/useTheme';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Screen = ({ children, style }: ScreenProps): React.JSX.Element => {
  const theme = useTheme();

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      root: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.md,
      },
    });
  }, [theme.colors.background, theme.spacing.md]);

  return <SafeAreaView style={[styles.root, style]}>{children}</SafeAreaView>;
};
