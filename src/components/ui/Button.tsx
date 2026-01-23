import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

import { useTheme } from '../../theme/useTheme';
import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'danger' | 'secondary';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: ViewStyle;
  disabled?: boolean;
}

export const Button = ({ label, onPress, variant = 'primary', size = 'medium', style, disabled = false }: ButtonProps): React.JSX.Element => {
  const theme = useTheme();

  const styles = React.useMemo(() => {
    let backgroundColor: string;
    let textColor: string;
    
    if (variant === 'danger') {
      backgroundColor = theme.colors.danger;
      textColor = theme.mode === 'dark' ? '#0B0F14' : '#FFFFFF';
    } else if (variant === 'secondary') {
      backgroundColor = theme.colors.border;
      textColor = theme.colors.text;
    } else {
      backgroundColor = theme.colors.primary;
      textColor = theme.mode === 'dark' ? '#0B0F14' : '#FFFFFF';
    }

    const paddingVertical = size === 'small' ? theme.spacing.xs : size === 'large' ? theme.spacing.md : theme.spacing.sm;
    const paddingHorizontal = size === 'small' ? theme.spacing.sm : size === 'large' ? theme.spacing.lg : theme.spacing.md;
    const fontSize = size === 'small' ? theme.typography.captionSize : size === 'large' ? theme.typography.bodySize : theme.typography.bodySize;

    return StyleSheet.create({
      root: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical,
        paddingHorizontal,
        borderRadius: size === 'small' ? 8 : 12,
        backgroundColor: disabled ? theme.colors.mutedText : backgroundColor,
        opacity: disabled ? 0.5 : 1,
      },
      label: {
        color: textColor,
        fontWeight: '600',
        fontSize,
      },
    });
  }, [theme.colors.danger, theme.colors.primary, theme.colors.border, theme.colors.text, theme.colors.mutedText, theme.mode, theme.spacing, theme.typography, variant, size, disabled]);

  return (
    <Pressable 
      accessibilityRole="button" 
      onPress={disabled ? undefined : onPress} 
      style={[styles.root, style]}
      disabled={disabled}
    >
      <AppText style={styles.label}>{label}</AppText>
    </Pressable>
  );
};
