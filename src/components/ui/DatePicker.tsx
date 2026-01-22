import React from 'react';
import { StyleSheet, View, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../theme/useTheme';
import { AppText } from './AppText';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  label?: string;
}

export const DatePicker = ({ 
  value, 
  onChange, 
  mode = 'date', 
  minimumDate,
  label 
}: DatePickerProps): React.JSX.Element => {
  const theme = useTheme();
  const [showPicker, setShowPicker] = React.useState<boolean>(false);

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        marginBottom: theme.spacing.sm,
      },
      label: {
        marginBottom: theme.spacing.xs,
      },
      pickerButton: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      pickerText: {
        color: theme.colors.text,
      },
      pickerContainer: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 12,
        padding: theme.spacing.sm,
        marginTop: theme.spacing.xs,
      },
    });
  }, [theme]);

  const formatDisplayValue = (): string => {
    if (mode === 'datetime') {
      return value.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (mode === 'time') {
      return value.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      return value.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <AppText style={styles.label} color="muted">
          {label}
        </AppText>
      )}
      <TouchableOpacity 
        style={styles.pickerButton} 
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <AppText style={styles.pickerText}>{formatDisplayValue()}</AppText>
        <AppText color="muted" variant="caption">📅</AppText>
      </TouchableOpacity>

      {showPicker && (
        Platform.OS === 'ios' ? (
          <View style={styles.pickerContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <AppText variant="caption" style={{ color: theme.colors.primary }}>
                  Cancel
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <AppText variant="caption" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                  Done
                </AppText>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={value}
              mode={mode}
              display="spinner"
              onChange={handleDateChange}
              minimumDate={minimumDate}
              textColor={theme.colors.text}
              themeVariant={theme.mode}
            />
          </View>
        ) : (
          <DateTimePicker
            value={value}
            mode={mode}
            display="default"
            onChange={handleDateChange}
            minimumDate={minimumDate}
          />
        )
      )}
    </View>
  );
};
