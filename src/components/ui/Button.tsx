import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

import { useTheme } from '../../theme/useTheme';
import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
}

export const Button = ({ label, onPress, variant = 'primary', style }: ButtonProps): React.JSX.Element => {
  const theme = useTheme();

  const styles = React.useMemo(() => {
    const backgroundColor = variant === 'danger' ? theme.colors.danger : theme.colors.primary;

    return StyleSheet.create({
      root: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: 12,
        backgroundColor,
      },
      label: {
        color: theme.mode === 'dark' ? '#0B0F14' : '#FFFFFF',
        fontWeight: '600',
      },
    });
  }, [theme.colors.danger, theme.colors.primary, theme.mode, theme.spacing.md, theme.spacing.sm, variant]);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.root, style]}>
      <AppText style={styles.label}>{label}</AppText>
    </Pressable>
  );
};
