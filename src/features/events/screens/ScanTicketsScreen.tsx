import React from 'react';
import { StyleSheet, View, Alert, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../theme/useTheme';
import { eventsApi } from '../../../api/eventsApi';
import { addAdmittedUserId, setAdmittedUserIds } from '../utils/admittedTicketsStore';
import type { EventsStackParamList, AppTabsParamList } from '../../../navigation/types';
import { Routes } from '../../../navigation/routes';

type Props = CompositeScreenProps<
  NativeStackScreenProps<EventsStackParamList, typeof Routes.Events.ScanTickets>,
  BottomTabScreenProps<AppTabsParamList>
>;

interface TicketData {
  ticketNumber: string;
  eventId: string;
  eventTitle?: string;
  date?: string;
  userId?: string; // User ID for verification
}

export const ScanTicketsScreen = ({ route, navigation }: Props): React.JSX.Element => {
  const theme = useTheme();
  const { eventId } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = React.useState<boolean>(true);
  const [scannedTickets, setScannedTickets] = React.useState<Set<string>>(new Set());
  const [admittedUserIds, setAdmittedUserIds] = React.useState<Set<string>>(new Set());
  const [isVerifying, setIsVerifying] = React.useState<boolean>(false);
  const lastScannedRef = React.useRef<{ ticketNumber: string; timestamp: number } | null>(null);
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);
  const [celebrationVisible, setCelebrationVisible] = React.useState<boolean>(false);
  const [celebrationPoints, setCelebrationPoints] = React.useState<number | null>(null);

  // Initialize audio mode
  React.useEffect(() => {
    const setupAudio = async (): Promise<void> => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      } catch (error) {
        console.warn('Failed to set audio mode:', error);
      }
    };
    void setupAudio();

    return () => {
      // Cleanup sound on unmount
      if (sound) {
        void sound.unloadAsync();
      }
    };
  }, [sound]);

  // Play success sound (positive beep)
  const playSuccessSound = React.useCallback(async (): Promise<void> => {
    try {
      // Use a simple approach: play a short beep using expo-av
      // Generate audio data for a success beep (high pitch, short)
      const duration = 0.15; // 150ms
      const frequency = 800; // Higher frequency for success
      const sampleRate = 22050; // Lower sample rate for smaller file
      const numSamples = Math.floor(sampleRate * duration);
      
      // Create audio buffer
      const samples = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Sine wave with fade in/out
        const fade = Math.min(1, Math.min(t * 10, (duration - t) * 10));
        samples[i] = Math.sin(2 * Math.PI * frequency * t) * fade * 0.3;
      }
      
      // Convert to 16-bit PCM
      const pcmData = new Int16Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        pcmData[i] = Math.max(-32768, Math.min(32767, Math.floor(samples[i] * 32768)));
      }
      
      // Create WAV file
      const wavBuffer = createWavFile(pcmData, sampleRate);
      const base64 = arrayBufferToBase64(wavBuffer);
      const dataUri = `data:audio/wav;base64,${base64}`;
      
      const { sound: successSound } = await Audio.Sound.createAsync(
        { uri: dataUri },
        { shouldPlay: true, volume: 0.8 }
      );
      
      successSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          void successSound.unloadAsync();
        }
      });
    } catch (error) {
      console.warn('Could not play success sound:', error);
    }
  }, []);

  // Play error sound (negative buzzer)
  const playErrorSound = React.useCallback(async (): Promise<void> => {
    try {
      // Generate audio data for an error beep (low pitch, longer)
      const duration = 0.25; // 250ms
      const frequency = 300; // Lower frequency for error
      const sampleRate = 22050;
      const numSamples = Math.floor(sampleRate * duration);
      
      // Create audio buffer with sawtooth wave for harsher sound
      const samples = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const fade = Math.min(1, Math.min(t * 8, (duration - t) * 8));
        // Sawtooth wave
        const phase = (t * frequency) % 1;
        samples[i] = (phase * 2 - 1) * fade * 0.3;
      }
      
      // Convert to 16-bit PCM
      const pcmData = new Int16Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        pcmData[i] = Math.max(-32768, Math.min(32767, Math.floor(samples[i] * 32768)));
      }
      
      // Create WAV file
      const wavBuffer = createWavFile(pcmData, sampleRate);
      const base64 = arrayBufferToBase64(wavBuffer);
      const dataUri = `data:audio/wav;base64,${base64}`;
      
      const { sound: errorSound } = await Audio.Sound.createAsync(
        { uri: dataUri },
        { shouldPlay: true, volume: 0.8 }
      );
      
      errorSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          void errorSound.unloadAsync();
        }
      });
    } catch (error) {
      console.warn('Could not play error sound:', error);
    }
  }, []);

  // Helper function to create WAV file from PCM data
  const createWavFile = (pcmData: Int16Array, sampleRate: number): ArrayBuffer => {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.length * (bitsPerSample / 8);
    const fileSize = 36 + dataSize;
    
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // RIFF header
    view.setUint8(0, 0x52); // 'R'
    view.setUint8(1, 0x49); // 'I'
    view.setUint8(2, 0x46); // 'F'
    view.setUint8(3, 0x46); // 'F'
    view.setUint32(4, fileSize, true);
    view.setUint8(8, 0x57); // 'W'
    view.setUint8(9, 0x41); // 'A'
    view.setUint8(10, 0x56); // 'V'
    view.setUint8(11, 0x45); // 'E'
    
    // fmt chunk
    view.setUint8(12, 0x66); // 'f'
    view.setUint8(13, 0x6D); // 'm'
    view.setUint8(14, 0x74); // 't'
    view.setUint8(15, 0x20); // ' '
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    
    // data chunk
    view.setUint8(36, 0x64); // 'd'
    view.setUint8(37, 0x61); // 'a'
    view.setUint8(38, 0x74); // 't'
    view.setUint8(39, 0x61); // 'a'
    view.setUint32(40, dataSize, true);
    
    // Write PCM data
    const pcmView = new DataView(buffer, 44);
    for (let i = 0; i < pcmData.length; i++) {
      pcmView.setInt16(i * 2, pcmData[i], true);
    }
    
    return buffer;
  };

  // Helper function to convert ArrayBuffer to base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // Use a polyfill for btoa if needed, or use a library
    if (typeof btoa !== 'undefined') {
      return btoa(binary);
    }
    // Fallback for React Native
    try {
      // Try using Buffer if available (Node.js environment)
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(bytes).toString('base64');
      }
    } catch {
      // Ignore
    }
    // If all else fails, return empty string (sound won't play but won't crash)
    console.warn('btoa not available, sound playback may not work');
    return '';
  };

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
      },
      cameraContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
      },
      scanArea: {
        width: 250,
        height: 250,
        borderWidth: 3,
        borderColor: theme.colors.primary,
        borderRadius: 16,
        backgroundColor: 'transparent',
      },
      instructions: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
      },
      bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      },
      scannedCount: {
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
      },
      permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
      },
      permissionText: {
        textAlign: 'center',
        marginBottom: theme.spacing.md,
      },
    });
  }, [theme]);

  const handleBarCodeScanned = React.useCallback(
    async ({ data }: { data: string }) => {
      if (!isScanning || isVerifying) {
        return;
      }

      // Parse QR code data first to get ticket number
      let ticketData: TicketData;
      try {
        ticketData = JSON.parse(data);
      } catch {
        ticketData = {
          ticketNumber: data,
          eventId,
        };
      }

      // Prevent immediate re-scanning of the same ticket (cooldown: 5 seconds)
      const now = Date.now();
      if (
        lastScannedRef.current &&
        lastScannedRef.current.ticketNumber === ticketData.ticketNumber &&
        now - lastScannedRef.current.timestamp < 5000
      ) {
        return; // Ignore duplicate scan within cooldown period
      }

      // Update last scanned reference
      lastScannedRef.current = {
        ticketNumber: ticketData.ticketNumber,
        timestamp: now,
      };

      setIsVerifying(true);
      setIsScanning(false);

      try {
        // Validate ticket belongs to this event (client-side check first)
        if (ticketData.eventId && ticketData.eventId !== eventId) {
          void playErrorSound();
          Alert.alert(
            'Invalid Ticket ❌',
            'This ticket does not belong to this event. Please scan a ticket for the correct event.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Add a small delay before resuming to prevent immediate re-scan
                  setTimeout(() => {
                    setIsScanning(true);
                    setIsVerifying(false);
                  }, 500);
                },
              },
            ]
          );
          return;
        }

        // Check if already scanned locally
        if (scannedTickets.has(ticketData.ticketNumber)) {
          void playErrorSound();
          Alert.alert(
            'Already Scanned',
            `Ticket ${ticketData.ticketNumber} has already been scanned.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Add a small delay before resuming to prevent immediate re-scan
                  setTimeout(() => {
                    setIsScanning(true);
                    setIsVerifying(false);
                  }, 500);
                },
              },
            ]
          );
          return;
        }

        // Verify ticket with backend API
        try {
          const result = await eventsApi.verifyTicket(
            eventId,
            ticketData.ticketNumber,
            ticketData.userId
          );

          if (!result.admitted) {
            // Backend rejected the ticket
            void playErrorSound();
            Alert.alert(
              'Invalid Ticket ❌',
              result.message || 'This ticket is not valid for this event or has already been used.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Add a small delay before resuming to prevent immediate re-scan
                    setTimeout(() => {
                      setIsScanning(true);
                      setIsVerifying(false);
                    }, 500);
                  },
                },
              ]
            );
            return;
          }

          // Ticket verified successfully - mark as scanned
          setScannedTickets((prev) => new Set(prev).add(ticketData.ticketNumber));

          // If userId is present, mark user as admitted
          if (ticketData.userId) {
            console.log('Marking user as admitted:', ticketData.userId);
            const newAdmittedSet = new Set(admittedUserIds);
            newAdmittedSet.add(ticketData.userId);
            setAdmittedUserIds(newAdmittedSet);
            addAdmittedUserId(eventId, ticketData.userId);
          } else {
            console.warn('No userId found in ticket data:', ticketData);
          }

          // Play success sound
          void playSuccessSound();

          // Show celebrating popup with points
          setCelebrationPoints(result.pointsAwarded ?? null);
          setCelebrationVisible(true);
        } catch (apiError) {
          // Handle API errors (network, invalid ticket, etc.)
          const errorMessage =
            apiError instanceof Error
              ? apiError.message
              : 'Failed to verify ticket with server.';
          
          // Check status code for 404
          const statusCode = (apiError as any)?.statusCode;
          const is404 = statusCode === 404 || errorMessage.includes('404') || errorMessage.includes('Not Found');

          // Check if it's a 404 (endpoint not implemented yet) - use local verification as fallback
          if (is404) {
            console.warn('Backend endpoint not found (404), using local verification as fallback');
            
            // Fallback: Local verification (client-side only)
            // This allows the app to work while backend endpoint is being implemented
            if (!ticketData.userId) {
              void playErrorSound();
              Alert.alert(
                'Invalid Ticket ❌',
                'Ticket QR code is missing user information. Cannot verify ticket locally.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setTimeout(() => {
                        setIsScanning(true);
                        setIsVerifying(false);
                      }, 500);
                    },
                  },
                ]
              );
              return;
            }

            // Verify locally: Check if user is an attendee of this event
            // Note: This is a temporary fallback - backend should implement the endpoint
            try {
              const attendees = await eventsApi.getAttendees(eventId);
              const isAttendee = attendees.some((a) => a.userId === ticketData.userId);
              
              if (!isAttendee) {
                void playErrorSound();
                Alert.alert(
                  'Invalid Ticket ❌',
                  'This ticket belongs to a user who is not an attendee of this event.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        setTimeout(() => {
                          setIsScanning(true);
                          setIsVerifying(false);
                        }, 500);
                      },
                    },
                  ]
                );
                return;
              }

              // Local verification passed - mark as scanned
              setScannedTickets((prev) => new Set(prev).add(ticketData.ticketNumber));

              // Mark user as admitted locally
              console.log('Marking user as admitted (local verification):', ticketData.userId);
              const newAdmittedSet = new Set(admittedUserIds);
              newAdmittedSet.add(ticketData.userId);
              setAdmittedUserIds(newAdmittedSet);
              addAdmittedUserId(eventId, ticketData.userId);

              // Play success sound
              void playSuccessSound();

              // Local verification - no points from backend
              setCelebrationPoints(null);
              setCelebrationVisible(true);
            } catch (attendeesError) {
              void playErrorSound();
              Alert.alert(
                'Verification Error',
                'Failed to verify ticket. Please try again.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setTimeout(() => {
                        setIsScanning(true);
                        setIsVerifying(false);
                      }, 500);
                    },
                  },
                ]
              );
            }
          } else if (errorMessage.includes('not belong') || errorMessage.includes('invalid')) {
            // Check if it's a validation error (ticket doesn't belong to event)
            void playErrorSound();
            Alert.alert(
              'Invalid Ticket ❌',
              'This ticket does not belong to this event. Please scan a ticket for the correct event.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setTimeout(() => {
                      setIsScanning(true);
                      setIsVerifying(false);
                    }, 500);
                  },
                },
              ]
            );
          } else {
            void playErrorSound();
            Alert.alert(
              'Verification Error',
              errorMessage,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setTimeout(() => {
                      setIsScanning(true);
                      setIsVerifying(false);
                    }, 500);
                  },
                },
              ]
            );
          }
        }
      } catch (error) {
        // Handle parsing or other errors
        void playErrorSound();
        Alert.alert(
          'Scan Error',
          'Failed to process the QR code. Please make sure you are scanning a valid ticket.',
          [
            {
              text: 'OK',
              onPress: () => {
                setTimeout(() => {
                  setIsScanning(true);
                  setIsVerifying(false);
                }, 500);
              },
            },
          ]
        );
      }
    },
    [eventId, isScanning, isVerifying, scannedTickets]
  );

  if (!permission) {
    return (
      <Screen>
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View style={styles.permissionContainer}>
          <AppText variant="title" style={styles.permissionText}>
            Camera Permission Required
          </AppText>
          <AppText color="muted" style={styles.permissionText}>
            We need access to your camera to scan QR codes for ticket verification.
          </AppText>
          <Button label="Grant Permission" onPress={requestPermission} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <CameraView
          style={styles.cameraContainer}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={isScanning && !isVerifying ? handleBarCodeScanned : undefined}
          enableTorch={false}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea} />
            <View style={styles.instructions}>
              <AppText variant="title" style={{ color: '#FFFFFF', marginBottom: theme.spacing.xs }}>
                Scan Ticket QR Code
              </AppText>
              <AppText style={{ color: '#FFFFFF', textAlign: 'center' }}>
                Position the QR code within the frame
              </AppText>
            </View>
          </View>
        </CameraView>

        {/* Celebrating popup modal */}
        <Modal
          visible={celebrationVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setCelebrationVisible(false);
            setCelebrationPoints(null);
            setTimeout(() => {
              setIsScanning(true);
              setIsVerifying(false);
            }, 300);
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: theme.spacing.lg,
            }}
            activeOpacity={1}
            onPress={() => {
              setCelebrationVisible(false);
              setCelebrationPoints(null);
              setTimeout(() => {
                setIsScanning(true);
                setIsVerifying(false);
              }, 300);
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 24,
                padding: theme.spacing.xl,
                alignItems: 'center',
                minWidth: 280,
                borderWidth: 1,
                borderColor: theme.colors.border,
                ...theme.shadow('lg'),
              }}
            >
              <AppText style={{ fontSize: 56, marginBottom: theme.spacing.sm }}>🎉</AppText>
              <AppText variant="title" style={{ marginBottom: theme.spacing.xs, textAlign: 'center' }}>
                Ticket Verified!
              </AppText>
              {celebrationPoints != null && celebrationPoints > 0 ? (
                <View
                  style={{
                    marginTop: theme.spacing.md,
                    marginBottom: theme.spacing.lg,
                    paddingHorizontal: theme.spacing.lg,
                    paddingVertical: theme.spacing.md,
                    backgroundColor: theme.colors.primaryLight,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: theme.colors.primary + '50',
                  }}
                >
                  <AppText color="muted" variant="caption" style={{ marginBottom: 4 }}>
                    They earned
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 32,
                      fontWeight: '700',
                      color: theme.colors.primary,
                    }}
                  >
                    {celebrationPoints} points
                  </AppText>
                </View>
              ) : (
                <AppText color="muted" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.lg, textAlign: 'center' }}>
                  Attendee admitted
                </AppText>
              )}
              <Button
                label="Scan Another"
                onPress={() => {
                  setCelebrationVisible(false);
                  setCelebrationPoints(null);
                  setTimeout(() => {
                    setIsScanning(true);
                    setIsVerifying(false);
                  }, 300);
                }}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <View style={styles.bottomBar}>
          <AppText variant="caption" style={styles.scannedCount} color="muted">
            {scannedTickets.size} ticket{scannedTickets.size !== 1 ? 's' : ''} scanned
          </AppText>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Button
              label={isScanning ? 'Pause' : 'Resume'}
              onPress={() => setIsScanning(!isScanning)}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <Button
              label="Done"
              onPress={() => {
                // Save final admitted user IDs to store
                setAdmittedUserIds(eventId, admittedUserIds);
                navigation.goBack();
              }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
};
