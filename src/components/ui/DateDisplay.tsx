import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../theme/useTheme';
import { AppText } from './AppText';

interface DateDisplayProps {
  date: string; // ISO 8601 format
  mode?: 'date' | 'time' | 'datetime';
  disabled?: boolean;
}

export const DateDisplay = ({ date, mode = 'date', disabled = true }: DateDisplayProps): React.JSX.Element => {
  const theme = useTheme();
  const dateObj = new Date(date);

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 12,
        padding: theme.spacing.sm,
        overflow: 'hidden',
        minHeight: Platform.OS === 'ios' ? 200 : 100,
      },
      pickerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
      },
    });
  }, [theme]);

  // Format date for display fallback
  const formatDateDisplay = (): string => {
    if (mode === 'datetime') {
      return dateObj.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (mode === 'time') {
      return dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.pickerContainer}>
        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={dateObj}
            mode={mode}
            display="spinner"
            disabled={disabled}
            style={{ width: '100%' }}
            textColor={theme.colors.text}
            themeVariant={theme.mode}
          />
        ) : (
          // Android shows a formatted text since the picker opens a modal
          <AppText variant="body" style={{ textAlign: 'center' }}>
            {formatDateDisplay()}
          </AppText>
        )}
      </View>
    </View>
  );
};
