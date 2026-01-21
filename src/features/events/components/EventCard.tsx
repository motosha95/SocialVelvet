import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { EventImage } from '../../../components/ui/EventImage';
import { useTheme } from '../../../theme/useTheme';
import type { Event } from '../types';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

export const EventCard = ({ event, onPress }: EventCardProps): React.JSX.Element => {
  const theme = useTheme();

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      card: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: theme.spacing.md,
      },
      imageContainer: {
        marginBottom: theme.spacing.md,
      },
      content: {
        padding: theme.spacing.md,
      },
      header: {
        marginBottom: theme.spacing.xs,
      },
      title: {
        marginBottom: theme.spacing.xs,
      },
      meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.xs,
      },
      metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
      },
      badge: {
        backgroundColor: event.isJoined ? theme.colors.primary : theme.colors.border,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs / 2,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: theme.spacing.xs,
      },
      badgeText: {
        color: event.isJoined ? (theme.mode === 'dark' ? '#0B0F14' : '#FFFFFF') : theme.colors.text,
        fontSize: theme.typography.captionSize,
        fontWeight: '600',
      },
    });
  }, [event.isJoined, theme.colors.border, theme.colors.primary, theme.colors.surface, theme.colors.text, theme.mode, theme.spacing.md, theme.spacing.sm, theme.spacing.xs, theme.typography.captionSize]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Past event';
    }
    if (diffDays === 0) {
      return 'Today';
    }
    if (diffDays === 1) {
      return 'Tomorrow';
    }
    if (diffDays < 7) {
      return `In ${diffDays} days`;
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.card}>
        {event.imageUrl && (
          <View style={styles.imageContainer}>
            <EventImage imageUrl={event.imageUrl} aspectRatio={16 / 9} />
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.header}>
            <AppText variant="title" style={styles.title}>
              {event.title}
            </AppText>
            <AppText color="muted" numberOfLines={2}>
              {event.description}
            </AppText>
          </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <AppText color="muted" variant="caption">
              📅 {formatDate(event.date)}
            </AppText>
          </View>
          <View style={styles.metaItem}>
            <AppText color="muted" variant="caption">
              🕐 {formatTime(event.date)}
            </AppText>
          </View>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <AppText color="muted" variant="caption">
              📍 {event.location}
            </AppText>
          </View>
        </View>

        <View style={styles.meta}>
          <AppText color="muted" variant="caption">
            👤 {event.organizerName}
          </AppText>
          <AppText color="muted" variant="caption">
            • {event.attendeeCount}
            {event.maxAttendees ? ` / ${event.maxAttendees}` : ''} attendees
          </AppText>
        </View>

          {event.isJoined && (
            <View style={styles.badge}>
              <AppText style={styles.badgeText} variant="caption">
                Joined
              </AppText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

