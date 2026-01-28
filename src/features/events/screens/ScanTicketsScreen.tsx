import React from 'react';
import { StyleSheet, View, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
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
            Alert.alert(
              'Invalid Ticket ❌',
              result.message || 'This ticket is not valid for this event or has already been used.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setIsScanning(true);
                    setIsVerifying(false);
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

          Alert.alert(
            'Ticket Verified ✓',
            `Ticket ${ticketData.ticketNumber} has been verified and the attendee has been admitted.`,
            [
              {
                text: 'Scan Another',
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
              Alert.alert(
                'Invalid Ticket ❌',
                'Ticket QR code is missing user information. Cannot verify ticket locally.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setIsScanning(true);
                      setIsVerifying(false);
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
                Alert.alert(
                  'Invalid Ticket ❌',
                  'This ticket belongs to a user who is not an attendee of this event.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        setIsScanning(true);
                        setIsVerifying(false);
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

              Alert.alert(
                'Ticket Verified ✓ (Local)',
                `Ticket ${ticketData.ticketNumber} has been verified locally. Note: Backend endpoint not yet implemented.`,
                [
                  {
                    text: 'Scan Another',
                    onPress: () => {
                      setIsScanning(true);
                      setIsVerifying(false);
                    },
                  },
                ]
              );
            } catch (attendeesError) {
              Alert.alert(
                'Verification Error',
                'Failed to verify ticket. Please try again.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setIsScanning(true);
                      setIsVerifying(false);
                    },
                  },
                ]
              );
            }
          } else if (errorMessage.includes('not belong') || errorMessage.includes('invalid')) {
            // Check if it's a validation error (ticket doesn't belong to event)
            Alert.alert(
              'Invalid Ticket ❌',
              'This ticket does not belong to this event. Please scan a ticket for the correct event.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setIsScanning(true);
                    setIsVerifying(false);
                  },
                },
              ]
            );
          } else {
            Alert.alert(
              'Verification Error',
              errorMessage,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setIsScanning(true);
                    setIsVerifying(false);
                  },
                },
              ]
            );
          }
        }
      } catch (error) {
        // Handle parsing or other errors
        Alert.alert(
          'Scan Error',
          'Failed to process the QR code. Please make sure you are scanning a valid ticket.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsScanning(true);
                setIsVerifying(false);
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
