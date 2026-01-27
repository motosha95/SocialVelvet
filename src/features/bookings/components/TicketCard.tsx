import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { EventImage } from '../../../components/ui/EventImage';
import { useTheme } from '../../../theme/useTheme';
import type { Event } from '../../events/types';

interface TicketCardProps {
  event: Event;
  ticketNumber: string;
}

export const TicketCard = ({ event, ticketNumber }: TicketCardProps): React.JSX.Element => {
  const theme = useTheme();

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
      qrPlaceholder: {
        width: '100%',
        height: 120,
        backgroundColor: theme.colors.border,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.md,
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

      <View style={styles.qrPlaceholder}>
        <AppText color="muted" variant="caption">
          QR Code
        </AppText>
      </View>
    </View>
  );
};
