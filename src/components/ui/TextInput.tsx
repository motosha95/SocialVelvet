import React from 'react';
import { StyleSheet, TextInput as RNTextInput, TextInputProps as RNTextInputProps, View, ViewStyle } from 'react-native';

import { useTheme } from '../../theme/useTheme';

interface TextInputProps extends RNTextInputProps {
  containerStyle?: ViewStyle;
}

export const TextInput = ({ containerStyle, style, ...rest }: TextInputProps): React.JSX.Element => {
  const theme = useTheme();

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
      },
      input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        color: theme.colors.text,
        backgroundColor: theme.colors.surface,
        fontSize: theme.typography.bodySize,
      },
    });
  }, [theme.colors.border, theme.colors.surface, theme.colors.text, theme.spacing.md, theme.spacing.sm, theme.typography.bodySize]);

  return (
    <View style={[styles.container, containerStyle]}>
      <RNTextInput
        placeholderTextColor={theme.colors.mutedText}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
};

