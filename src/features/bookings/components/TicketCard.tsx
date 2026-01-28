import React from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppText } from '../../../components/ui/AppText';
import { EventImage } from '../../../components/ui/EventImage';
import { useTheme } from '../../../theme/useTheme';
import type { Event } from '../../events/types';

interface TicketCardProps {
  event: Event;
  ticketNumber: string;
  userId?: string; // User ID for QR code verification
}

export const TicketCard = ({ event, ticketNumber, userId }: TicketCardProps): React.JSX.Element => {
  const theme = useTheme();

  // Generate QR code data - encode ticket information as JSON
  const qrData = React.useMemo(() => {
    if (!ticketNumber || !event?.id) {
      return 'TICKET-' + ticketNumber;
    }
    const data = {
      ticketNumber,
      eventId: event.id,
      eventTitle: event.title,
      date: event.date,
      userId: userId || '', // Include userId for verification
    };
    console.log('Generating QR code with data:', data);
    return JSON.stringify(data);
  }, [ticketNumber, event?.id, event?.title, event?.date, userId]);

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      card: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.primary,
        borderWidth: 2,
        borderRadius: 16,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        overflow: 'hidden',
      },
      header: {
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary,
        borderStyle: 'dashed',
        paddingBottom: theme.spacing.sm,
        marginBottom: theme.spacing.md,
      },
      ticketLabel: {
        fontSize: theme.typography.captionSize,
        color: theme.colors.mutedText,
        marginBottom: theme.spacing.xs,
      },
      ticketNumber: {
        fontSize: theme.typography.titleSize,
        fontWeight: '700',
        color: theme.colors.primary,
        letterSpacing: 2,
      },
      imageContainer: {
        marginBottom: theme.spacing.md,
        borderRadius: 12,
        overflow: 'hidden',
      },
      title: {
        marginBottom: theme.spacing.xs,
      },
      meta: {
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      },
      metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.xs,
        gap: theme.spacing.xs,
      },
      qrContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
      },
    });
  }, [theme]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText style={styles.ticketLabel} variant="caption">
          TICKET
        </AppText>
        <AppText style={styles.ticketNumber}>
          #{ticketNumber}
        </AppText>
      </View>

      {event.imageUrl && (
        <View style={styles.imageContainer}>
          <EventImage imageUrl={event.imageUrl} aspectRatio={16 / 9} />
        </View>
      )}

      <AppText variant="title" style={styles.title}>
        {event.title}
      </AppText>

      <View style={styles.meta}>
        <View style={styles.metaRow}>
          <AppText color="muted" variant="caption">
            📅 {formatDate(event.date)}
          </AppText>
        </View>
        <View style={styles.metaRow}>
          <AppText color="muted" variant="caption">
            🕐 {formatTime(event.date)}
          </AppText>
        </View>
        <View style={styles.metaRow}>
          <AppText color="muted" variant="caption">
            📍 {event.location}
          </AppText>
        </View>
        <View style={styles.metaRow}>
          <AppText color="muted" variant="caption">
            👤 {event.organizerName}
          </AppText>
        </View>
      </View>

      <View style={styles.qrContainer}>
        <QRCode
          value={qrData}
          size={200}
          color={theme.mode === 'dark' ? '#FFFFFF' : '#000000'}
          backgroundColor={theme.mode === 'dark' ? '#1A1A1A' : '#FFFFFF'}
          logoSize={0}
          logoMargin={0}
          logoBackgroundColor="transparent"
        />
      </View>
    </View>
  );
};
