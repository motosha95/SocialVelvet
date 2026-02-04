import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { EventImage } from '../../../components/ui/EventImage';
import { useTheme } from '../../../theme/useTheme';
import type { Event } from '../types';
import { getSeriesShortLabel } from '../utils/seriesUtils';
import { shareEvent } from '../utils/shareEvent';

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
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
      },
      imageContainer: {
        marginBottom: theme.spacing.xs,
      },
      content: {
        padding: theme.spacing.sm,
      },
      header: {
        marginBottom: 4,
      },
      titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: theme.spacing.xs,
      },
      title: {
        flex: 1,
        marginBottom: 2,
      },
      meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginTop: 4,
      },
      metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
      },
      badge: {
        backgroundColor: event.isJoined ? theme.colors.primary : theme.colors.border,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
      },
      badgeText: {
        color: event.isJoined ? (theme.mode === 'dark' ? '#0B0F14' : '#FFFFFF') : theme.colors.text,
        fontSize: theme.typography.captionSize,
        fontWeight: '600',
      },
      seriesBadge: {
        backgroundColor: theme.colors.primary + '20',
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
        marginRight: theme.spacing.xs,
      },
      seriesBadgeText: {
        color: theme.colors.primary,
        fontSize: theme.typography.captionSize,
        fontWeight: '600',
      },
      followedBadge: {
        backgroundColor: theme.colors.primary + '30',
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
        marginRight: theme.spacing.xs,
      },
      followedBadgeText: {
        color: theme.colors.primary,
        fontSize: theme.typography.captionSize,
        fontWeight: '600',
      },
      shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: theme.colors.primary + '25',
      },
      shareText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
      },
    });
  }, [event.isJoined, event.seriesInterval, event.isFromFollowedHost, theme]);

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

  const handleShare = React.useCallback(() => {
    void shareEvent(event);
  }, [event]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.card}>
        {event.imageUrl && (
          <View style={styles.imageContainer}>
            <EventImage imageUrl={event.imageUrl} aspectRatio={2.2} />
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <AppText variant="title" style={[styles.title, { fontSize: 16 }]} numberOfLines={1}>
                {event.title}
              </AppText>
              <TouchableOpacity
                onPress={handleShare}
                style={styles.shareButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppText style={styles.shareText}>📤 Share</AppText>
              </TouchableOpacity>
            </View>
            <AppText color="muted" variant="caption" numberOfLines={1} style={{ lineHeight: 18 }}>
              {event.description}
            </AppText>
          </View>

          <View style={[styles.meta, { marginTop: 6 }]}>
            <AppText color="muted" variant="caption">
              📅 {formatDate(event.date)} · 🕐 {formatTime(event.date)}
            </AppText>
          </View>
          <View style={styles.meta}>
            <AppText color="muted" variant="caption" numberOfLines={1}>
              📍 {event.location}
            </AppText>
          </View>
          <View style={styles.meta}>
            <AppText color="muted" variant="caption">
              👤 {event.organizerName} · {event.attendeeCount}
              {event.maxAttendees ? `/${event.maxAttendees}` : ''} going
            </AppText>
          </View>

        {event.topics && event.topics.length > 0 && (
          <View style={[styles.meta, { marginTop: 4, flexWrap: 'wrap', gap: 4 }]}>
            {event.topics.map((t) => (
              <View key={t} style={styles.seriesBadge}>
                <AppText style={styles.seriesBadgeText} variant="caption">
                  {t}
                </AppText>
              </View>
            ))}
          </View>
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, gap: 4 }}>
          {event.isFromFollowedHost && (
            <View style={styles.followedBadge}>
              <AppText style={styles.followedBadgeText} variant="caption">
                Following
              </AppText>
            </View>
          )}
          {event.seriesInterval && (
            <View style={styles.seriesBadge}>
              <AppText style={styles.seriesBadgeText} variant="caption">
                {getSeriesShortLabel(event.seriesInterval)}
              </AppText>
            </View>
          )}
          {event.isJoined && (
            <View style={styles.badge}>
              <AppText style={styles.badgeText} variant="caption">
                Joined
              </AppText>
            </View>
          )}
        </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

