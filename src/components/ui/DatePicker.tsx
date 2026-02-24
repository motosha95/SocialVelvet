import React from 'react';
import { StyleSheet, View, Platform, TouchableOpacity, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../theme/useTheme';
import { AppText } from './AppText';
import { Button } from './Button';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  label?: string;
}

type PickerStep = 'date' | 'time';

export const DatePicker = ({ 
  value, 
  onChange, 
  mode = 'date', 
  minimumDate,
  label 
}: DatePickerProps): React.JSX.Element => {
  const theme = useTheme();
  const [showPicker, setShowPicker] = React.useState<boolean>(false);
  const [currentStep, setCurrentStep] = React.useState<PickerStep>('date');
  const [tempDate, setTempDate] = React.useState<Date>(value);
  const [isConfirming, setIsConfirming] = React.useState<boolean>(false);
  const isInternalUpdateRef = React.useRef<boolean>(false);

  // Sync tempDate when value prop changes (from parent)
  // But ignore changes that come from our own confirmation
  React.useEffect(() => {
    if (!showPicker && !isConfirming && !isInternalUpdateRef.current) {
      setTempDate(new Date(value));
    }
    // Reset the flag after a short delay to allow for external updates
    if (isInternalUpdateRef.current) {
      const timer = setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [value, showPicker, isConfirming]);

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
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      modalContent: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: theme.spacing.lg,
        width: '90%',
        maxWidth: 400,
      },
      modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
      },
      modalTitle: {
        fontSize: theme.typography.titleSize,
        fontWeight: '600',
      },
      previewText: {
        fontSize: theme.typography.bodySize,
        color: theme.colors.text,
        textAlign: 'center',
        fontWeight: '500',
      },
      previewContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.lg,
        marginVertical: theme.spacing.md,
        minHeight: 60,
      },
      closeButton: {
        padding: theme.spacing.xs,
      },
      pickerContainer: {
        alignItems: 'center',
        marginVertical: theme.spacing.md,
        minHeight: 200,
      },
      stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
        gap: theme.spacing.sm,
      },
      stepButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: 8,
        borderWidth: 1,
      },
      stepButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      stepButtonInactive: {
        backgroundColor: 'transparent',
        borderColor: theme.colors.border,
      },
      actionButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
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

  const handleOpenPicker = (): void => {
    if (isConfirming) {
      return; // Prevent opening while confirming
    }
    setTempDate(new Date(value));
    if (mode === 'datetime') {
      setCurrentStep('date');
    }
    setShowPicker(true);
  };

  const handleClosePicker = (): void => {
    setShowPicker(false);
    setTempDate(new Date(value)); // Reset to original value
    setCurrentStep('date'); // Reset step
    setIsConfirming(false); // Reset confirming state
    isInternalUpdateRef.current = false; // Reset internal update flag
  };

  const handleDateChange = (event: any, selectedDate?: Date): void => {
    try {
      // On Android, event.type can be 'set' (user confirmed) or 'dismissed' (user cancelled)
      // On iOS, event.type is typically undefined for spinner changes
      // If it's a 'set' event, the user clicked the native OK button - treat as confirmation
      if (event.type === 'set' && selectedDate) {
        // User confirmed via native OK button - handle as confirmation
        if (isConfirming) {
          return; // Prevent double confirmation
        }
        
        setIsConfirming(true);
        isInternalUpdateRef.current = true;
        
        // Update tempDate first
        let finalDate: Date;
        if (mode === 'datetime' && currentStep === 'date') {
          const newDate = new Date(selectedDate);
          newDate.setHours(tempDate.getHours());
          newDate.setMinutes(tempDate.getMinutes());
          newDate.setSeconds(0);
          newDate.setMilliseconds(0);
          finalDate = newDate;
          setTempDate(finalDate);
          // Move to time step
          setIsConfirming(false);
          isInternalUpdateRef.current = false;
          setCurrentStep('time');
          return;
        } else if (mode === 'datetime' && currentStep === 'time') {
          const newDate = new Date(tempDate);
          newDate.setHours(selectedDate.getHours());
          newDate.setMinutes(selectedDate.getMinutes());
          newDate.setSeconds(0);
          newDate.setMilliseconds(0);
          finalDate = newDate;
        } else {
          finalDate = new Date(selectedDate);
          finalDate.setSeconds(0);
          finalDate.setMilliseconds(0);
        }
        
        setTempDate(finalDate);
        
        // Close modal and confirm
        if (mode === 'datetime' && currentStep === 'time') {
          setShowPicker(false);
          setCurrentStep('date');
          onChange(finalDate);
          setTimeout(() => {
            setIsConfirming(false);
          }, 100);
        } else if (mode !== 'datetime') {
          setShowPicker(false);
          onChange(finalDate);
          setTimeout(() => {
            setIsConfirming(false);
          }, 100);
        }
        return;
      }
      
      // Regular change event (user scrolling/spinning) - just update tempDate
      if (selectedDate && event.type !== 'dismissed') {
        if (mode === 'datetime' && currentStep === 'date') {
          // Update date but keep current time
          const newDate = new Date(selectedDate);
          newDate.setHours(tempDate.getHours());
          newDate.setMinutes(tempDate.getMinutes());
          newDate.setSeconds(0);
          newDate.setMilliseconds(0);
          setTempDate(newDate);
        } else if (mode === 'datetime' && currentStep === 'time') {
          // Update time but keep current date
          const newDate = new Date(tempDate);
          newDate.setHours(selectedDate.getHours());
          newDate.setMinutes(selectedDate.getMinutes());
          newDate.setSeconds(0);
          newDate.setMilliseconds(0);
          setTempDate(newDate);
        } else {
          // Single mode (date or time)
          const newDate = new Date(selectedDate);
          newDate.setSeconds(0);
          newDate.setMilliseconds(0);
          setTempDate(newDate);
        }
      }
    } catch (error) {
      console.error('DatePicker onChange error:', error);
    }
  };

  const handleConfirm = (): void => {
    if (isConfirming) {
      return; // Prevent double confirmation
    }

    setIsConfirming(true);
    isInternalUpdateRef.current = true; // Mark that we're making an internal update
    
    if (mode === 'datetime') {
      if (currentStep === 'date') {
        // Move to time step - don't call onChange yet
        setIsConfirming(false);
        isInternalUpdateRef.current = false;
        setCurrentStep('time');
        return;
      } else {
        // Final confirmation - call onChange and close
        const finalDate = new Date(tempDate);
        setShowPicker(false);
        setCurrentStep('date'); // Reset step
        onChange(finalDate);
        // Reset confirming state after a brief delay to ensure modal closes
        setTimeout(() => {
          setIsConfirming(false);
        }, 100);
      }
    } else {
      // Single mode - call onChange and close
      const finalDate = new Date(tempDate);
      setShowPicker(false);
      onChange(finalDate);
      // Reset confirming state after a brief delay to ensure modal closes
      setTimeout(() => {
        setIsConfirming(false);
      }, 100);
    }
  };

  const handleBack = (): void => {
    if (mode === 'datetime' && currentStep === 'time') {
      // Go back to date step
      setCurrentStep('date');
    } else {
      // Cancel - close picker and reset
      handleClosePicker();
    }
  };

  const renderPicker = (): React.JSX.Element => {
    const pickerMode = mode === 'datetime' ? currentStep : mode;
    
    const pickerProps: any = {
      value: tempDate,
      mode: pickerMode,
      display: Platform.OS === 'ios' ? 'spinner' : 'default',
      onChange: handleDateChange,
    };

    if (minimumDate) {
      pickerProps.minimumDate = minimumDate;
    }

    if (Platform.OS === 'ios') {
      pickerProps.textColor = theme.colors.text;
      pickerProps.themeVariant = theme.mode;
    }
    
    return <DateTimePicker {...pickerProps} />;
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
        onPress={handleOpenPicker}
        activeOpacity={0.7}
        disabled={isConfirming}
      >
        <AppText style={styles.pickerText}>{formatDisplayValue()}</AppText>
        <AppText color="muted" variant="caption">📅</AppText>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={isConfirming ? undefined : handleClosePicker}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={isConfirming ? undefined : handleClosePicker}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.modalTitle}>
                    {mode === 'datetime' 
                      ? (currentStep === 'date' ? 'Select Date' : 'Select Time')
                      : mode === 'time' 
                      ? 'Select Time'
                      : 'Select Date'}
                  </AppText>
                </View>
                <TouchableOpacity onPress={handleClosePicker} style={styles.closeButton}>
                  <AppText style={{ fontSize: 24 }}>✕</AppText>
                </TouchableOpacity>
              </View>

              {mode === 'datetime' && (
                <View style={styles.stepIndicator}>
                  <TouchableOpacity
                    style={[
                      styles.stepButton,
                      currentStep === 'date' ? styles.stepButtonActive : styles.stepButtonInactive,
                    ]}
                    onPress={() => setCurrentStep('date')}
                  >
                    <AppText style={{ color: currentStep === 'date' ? '#fff' : theme.colors.text }}>
                      📅 Date
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.stepButton,
                      currentStep === 'time' ? styles.stepButtonActive : styles.stepButtonInactive,
                    ]}
                    onPress={() => setCurrentStep('time')}
                  >
                    <AppText style={{ color: currentStep === 'time' ? '#fff' : theme.colors.text }}>
                      🕐 Time
                    </AppText>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.previewContainer}>
                <AppText style={styles.previewText}>
                  {mode === 'datetime' 
                    ? tempDate.toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : mode === 'time'
                    ? tempDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : tempDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                </AppText>
              </View>

              <View style={styles.pickerContainer}>
                {renderPicker()}
              </View>

              <View style={styles.actionButtons}>
                <Button
                  label={mode === 'datetime' && currentStep === 'time' ? 'Back' : 'Cancel'}
                  onPress={handleBack}
                  variant="secondary"
                  size="small"
                  style={{ flex: 1 }}
                  disabled={isConfirming}
                />
                <Button
                  label={mode === 'datetime' && currentStep === 'date' ? 'Next →' : 'Done'}
                  onPress={handleConfirm}
                  size="small"
                  style={{ flex: 1 }}
                  disabled={isConfirming}
                />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
