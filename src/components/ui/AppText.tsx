import React from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';

import { useTheme } from '../../theme/useTheme';

type AppTextVariant = 'title' | 'body' | 'caption';

type Props = TextProps & {
  variant?: AppTextVariant;
  color?: 'text' | 'muted';
  style?: TextStyle;
};

export const AppText = ({ variant = 'body', color = 'text', style, ...rest }: Props): React.JSX.Element => {
  const theme = useTheme();

  const styles = React.useMemo(() => {
    const fontSize =
      variant === 'title'
        ? theme.typography.titleSize
        : variant === 'caption'
          ? theme.typography.captionSize
          : theme.typography.bodySize;

    return StyleSheet.create({
      text: {
        fontSize,
        color: color === 'muted' ? theme.colors.mutedText : theme.colors.text,
      },
    });
  }, [color, theme.colors.mutedText, theme.colors.text, theme.typography.bodySize, theme.typography.captionSize, theme.typography.titleSize, variant]);

  return <Text {...rest} style={[styles.text, style]} />;
};
