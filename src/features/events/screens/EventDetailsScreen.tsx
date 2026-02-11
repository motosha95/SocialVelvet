import React from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, View, Image, TouchableOpacity, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { EventImage } from '../../../components/ui/EventImage';
import { DateDisplay } from '../../../components/ui/DateDisplay';
import { LocationMap } from '../../../components/ui/LocationMap';
import { useTheme } from '../../../theme/useTheme';
import { useEventsStore } from '../../../store/events/eventsStore';
import { eventsApi } from '../../../api/eventsApi';
import { useChatStore } from '../../../store/chat/chatStore';
import { useAuthStore } from '../../../store/auth/authStore';
import { chatApi } from '../../../api/chatApi';
import { followApi } from '../../../api/followApi';
import { fixAvatarUrl } from '../../../utils/avatarUtils';
import { TicketCard } from '../../bookings/components/TicketCard';
import { getAdmittedUserIds } from '../utils/admittedTicketsStore';
import { shareEvent } from '../utils/shareEvent';
import type { EventsStackParamList, AppTabsParamList } from '../../../navigation/types';
import { Routes } from '../../../navigation/routes';
import type { EventAttendee, EventCoHost } from '../types';
import { getSeriesLabel } from '../utils/seriesUtils';
import { calculatePointsForAttendance, getEffectivePriceForPoints } from '../utils/pointsUtils';

type Props = CompositeScreenProps<NativeStackScreenProps<EventsStackParamList, typeof Routes.Events.Details>, BottomTabScreenProps<AppTabsParamList>>;

export const EventDetailsScreen = ({ route, navigation }: Props): React.JSX.Element => {
  const theme = useTheme();
  const { eventId } = route.params;

  const events = useEventsStore((s) => s.events);
  const joinEvent = useEventsStore((s) => s.joinEvent);
  const leaveEvent = useEventsStore((s) => s.leaveEvent);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const userId = useAuthStore((s) => s.session?.userId);

  const [event, setEvent] = React.useState(events.find((e) => e.id === eventId));
  const [attendees, setAttendees] = React.useState<EventAttendee[]>([]);
  const [coHosts, setCoHosts] = React.useState<EventCoHost[]>([]);
  const [isLoadingEvent, setIsLoadingEvent] = React.useState<boolean>(!event);
  const [isLoadingAttendees, setIsLoadingAttendees] = React.useState<boolean>(true);
  const [isLoadingCoHosts, setIsLoadingCoHosts] = React.useState<boolean>(false);
  const [isJoining, setIsJoining] = React.useState<boolean>(false);
  const [isLeaving, setIsLeaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [menuVisible, setMenuVisible] = React.useState<boolean>(false);
  const [selectedCoHost, setSelectedCoHost] = React.useState<{ userId: string; canEdit: boolean } | null>(null);
  const [ticketModalVisible, setTicketModalVisible] = React.useState<boolean>(false);
  const [showTicketAfterJoin, setShowTicketAfterJoin] = React.useState<boolean>(false);
  const [admittedUserIds, setAdmittedUserIds] = React.useState<Set<string>>(new Set());
  const [admissionCelebrationVisible, setAdmissionCelebrationVisible] = React.useState<boolean>(false);
  const [admissionCelebrationPoints, setAdmissionCelebrationPoints] = React.useState<number | null>(null);
  const hasShownAdmissionCelebrationRef = React.useRef<boolean>(false);
  const [isFollowingHost, setIsFollowingHost] = React.useState<boolean>(false);
  const [isFollowLoading, setIsFollowLoading] = React.useState<boolean>(false);
  const lastApiUpdateRef = React.useRef<number>(0);
  const updateEvent = useEventsStore((s) => s.updateEvent);

  // Load admitted user IDs from store when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const admitted = getAdmittedUserIds(eventId);
      console.log('Loading admitted user IDs for event:', eventId, 'Count:', admitted.size);
      setAdmittedUserIds(admitted);
    }, [eventId])
  );

  // Poll for admission when ticket modal is visible (attendee waiting for their ticket to be scanned)
  React.useEffect(() => {
    if (!ticketModalVisible || !userId || !event?.isJoined) return;

    const checkAdmission = async (): Promise<void> => {
      if (hasShownAdmissionCelebrationRef.current) return;
      try {
        const list = await eventsApi.getAttendees(eventId);
        const me = list.find((a) => a.userId === userId);
        if (me?.admittedAt) {
          hasShownAdmissionCelebrationRef.current = true;
          const points = calculatePointsForAttendance(getEffectivePriceForPoints(event.price, event.pricingTiers));
          setAdmissionCelebrationPoints(points);
          setAdmissionCelebrationVisible(true);
        }
      } catch {
        // Ignore poll errors
      }
    };

    const interval = setInterval(checkAdmission, 3000);
    void checkAdmission(); // Check immediately
    return () => clearInterval(interval);
  }, [ticketModalVisible, userId, eventId, event?.isJoined, event?.price, event?.pricingTiers]);

  // Check if user can edit (organizer or co-host with permission)
  const canEdit = React.useMemo(() => {
    if (!event || !userId) return false;
    // First check if user is organizer
    if (event.organizerId === userId) return true;
    // Then check if user is a co-host with edit permission
    // (This takes priority over event.canEdit because we load co-hosts separately)
    if (coHosts.length > 0) {
      const coHost = coHosts.find((ch) => ch.userId === userId);
      if (coHost) {
        return coHost.canEdit === true;
      }
    }
    // Fallback to event.canEdit if co-hosts aren't loaded yet
    return event.canEdit === true;
  }, [event, userId, coHosts]);

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        paddingBottom: theme.spacing.xl,
      },
      imageContainer: {
        marginBottom: theme.spacing.md,
        marginHorizontal: -theme.spacing.md,
      },
      header: {
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
      },
      section: {
        marginTop: theme.spacing.lg,
      },
      sectionTitle: {
        marginBottom: theme.spacing.sm,
      },
      card: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
      },
      metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.xs,
        gap: theme.spacing.sm,
      },
      actions: {
        marginTop: theme.spacing.lg,
        gap: theme.spacing.sm,
      },
      attendeeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      },
      avatarImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
      },
      attendeeInfo: {
        flex: 1,
        marginLeft: theme.spacing.sm,
      },
      messageButton: {
        marginLeft: theme.spacing.sm,
      },
      errorContainer: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginTop: theme.spacing.md,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
      },
      seriesBadge: {
        backgroundColor: theme.colors.primary + '20',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs / 2,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: theme.spacing.xs,
      },
      seriesBadgeText: {
        color: theme.colors.primary,
        fontSize: theme.typography.captionSize,
        fontWeight: '600',
      },
      menuButton: {
        padding: theme.spacing.xs,
        borderRadius: 20,
        minWidth: 40,
        alignItems: 'center',
        justifyContent: 'center',
      },
      menuModal: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingTop: 100,
        paddingRight: theme.spacing.md,
      },
      menuContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        paddingVertical: theme.spacing.xs,
        minWidth: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
      menuItem: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      menuItemLast: {
        borderBottomWidth: 0,
      },
      menuItemText: {
        fontSize: theme.typography.bodySize,
      },
      menuItemTextDanger: {
        color: theme.colors.danger,
      },
      badge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: 4,
      },
      badgeText: {
        color: theme.mode === 'dark' ? '#0B0F14' : '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
      },
      modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: theme.spacing.md,
      },
      modalContent: {
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        padding: theme.spacing.md,
        width: '100%',
        maxHeight: '90%',
      },
      modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
      },
      modalScrollContent: {
        paddingBottom: theme.spacing.md,
      },
    });
  }, [theme]);

  React.useEffect(() => {
    const loadEvent = async (): Promise<void> => {
      if (event) {
        setIsLoadingEvent(false);
        // Load co-hosts for everyone (public information)
        setIsLoadingCoHosts(true);
        try {
          const loadedCoHosts = await eventsApi.getCoHosts(eventId);
          setCoHosts(loadedCoHosts);
        } catch (err) {
          // Ignore errors
        } finally {
          setIsLoadingCoHosts(false);
        }
        return;
      }

      try {
        const loadedEvent = await eventsApi.getById(eventId);
        if (loadedEvent) {
          setEvent(loadedEvent);
          // Load co-hosts for everyone (public information)
          setIsLoadingCoHosts(true);
          try {
            const loadedCoHosts = await eventsApi.getCoHosts(eventId);
            setCoHosts(loadedCoHosts);
          } catch (err) {
            // Ignore errors
          } finally {
            setIsLoadingCoHosts(false);
          }
        } else {
          setError('Event not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setIsLoadingEvent(false);
      }
    };

    void loadEvent();
  }, [event, eventId, userId]);

  React.useEffect(() => {
    const loadAttendees = async (): Promise<void> => {
      try {
        const loadedAttendees = await eventsApi.getAttendees(eventId);
        setAttendees(loadedAttendees);
      } catch (err) {
        console.error('Failed to load attendees:', err);
      } finally {
        setIsLoadingAttendees(false);
      }
    };

    void loadAttendees();
  }, [eventId]);

  // Fetch whether current user follows the host (when not the organizer)
  React.useEffect(() => {
    if (!event || !userId || event.organizerId === userId) {
      return;
    }
    let cancelled = false;
    followApi
      .isFollowing(event.organizerId)
      .then((following) => {
        if (!cancelled) setIsFollowingHost(following);
      })
      .catch(() => {
        if (!cancelled) setIsFollowingHost(false);
      });
    return () => {
      cancelled = true;
    };
  }, [event?.organizerId, userId]);

  // Update event when store changes (but not if we just updated it from API or optimistically)
  React.useEffect(() => {
    // Skip if we're currently joining/leaving (optimistic update in progress)
    if (isJoining) {
      return;
    }
    
    // Skip if we just updated this event from API or optimistically (within last 15 seconds)
    const timeSinceLastApiUpdate = Date.now() - lastApiUpdateRef.current;
    if (timeSinceLastApiUpdate < 15000) {
      return;
    }
    
    const updatedEvent = events.find((e) => e.id === eventId);
    if (updatedEvent && event) {
      // CRITICAL: Don't override if the isJoined status would change
      // This prevents store from reverting our optimistic update
      if (updatedEvent.isJoined !== event.isJoined) {
        // Store has different isJoined status - don't override optimistic update
        return;
      }
      
      // Only update if the store event is significantly different (different updatedAt)
      // AND the store event is newer (has a more recent updatedAt)
      const storeUpdatedAt = new Date(updatedEvent.updatedAt).getTime();
      const localUpdatedAt = new Date(event.updatedAt).getTime();
      
      // Only update if store has newer data (more than 1000ms difference to avoid race conditions)
      // AND the isJoined status matches (double check)
      if (storeUpdatedAt > localUpdatedAt + 1000 && updatedEvent.isJoined === event.isJoined) {
        setEvent(updatedEvent);
      }
    } else if (updatedEvent && !event) {
      // If we don't have a local event yet, use the store event
      setEvent(updatedEvent);
    }
  }, [events, eventId, event, isJoining, isLeaving]);

  const handleJoin = async (): Promise<void> => {
    setIsJoining(true);
    setError(null);

    // Set ref FIRST to prevent useEffect from overriding
    lastApiUpdateRef.current = Date.now();

    // Store the original event state for potential revert
    const originalEvent = event;

    // Optimistically update UI immediately
    if (event) {
      const optimisticEvent = {
        ...event,
        isJoined: true,
        attendeeCount: (event.attendeeCount || 0) + 1,
      };
      setEvent(optimisticEvent);
    }

    try {
      await joinEvent(eventId);
      // Wait a bit for backend to process, then refresh event data
      // This prevents getting stale data from the backend
      await new Promise((resolve) => setTimeout(resolve, 300));
      const updatedEvent = await eventsApi.getById(eventId);
      if (updatedEvent && updatedEvent.isJoined === true) {
        // Only update if backend confirms we're joined
        lastApiUpdateRef.current = Date.now();
        setEvent(updatedEvent);
        // Show ticket if event is ticketed
        if (updatedEvent.isTicketed) {
          setShowTicketAfterJoin(true);
          setTicketModalVisible(true);
        }
      }
      // Refresh attendees after joining
      const updatedAttendees = await eventsApi.getAttendees(eventId);
      setAttendees(updatedAttendees);

      // Ask if user wants to follow the host (only if not organizer and not already following)
      const currentEvent = updatedEvent ?? event;
      if (
        userId &&
        currentEvent &&
        currentEvent.organizerId !== userId &&
        !isFollowingHost
      ) {
        Alert.alert(
          'Follow host?',
          `Would you like to follow ${currentEvent.organizerName} to see their future events first?`,
          [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Follow',
              onPress: async () => {
                try {
                  await followApi.follow(currentEvent.organizerId);
                  setIsFollowingHost(true);
                } catch {
                  // Silently ignore follow failure (user can follow from button later)
                }
              },
            },
          ]
        );
      }
    } catch (err) {
      // Revert optimistic update on error
      if (originalEvent) {
        setEvent(originalEvent);
      }
      setError(err instanceof Error ? err.message : 'Failed to join event');
    } finally {
      setIsJoining(false);
      setIsLeaving(false);
    }
  };

  const handleLeave = async (): Promise<void> => {
    setIsLeaving(true);
    setIsJoining(false);
    setError(null);

    // Set ref FIRST to prevent useEffect from overriding
    lastApiUpdateRef.current = Date.now();

    // Store the original event state for potential revert
    const originalEvent = event;

    // Optimistically update UI immediately
    if (event) {
      const optimisticEvent = {
        ...event,
        isJoined: false,
        attendeeCount: Math.max(0, (event.attendeeCount || 1) - 1),
      };
      setEvent(optimisticEvent);
    }

    try {
      await leaveEvent(eventId);
      // Wait a bit for backend to process, then refresh event data
      // This prevents getting stale data from the backend
      await new Promise((resolve) => setTimeout(resolve, 300));
      const updatedEvent = await eventsApi.getById(eventId);
      if (updatedEvent && updatedEvent.isJoined === false) {
        // Only update if backend confirms we're not joined
        lastApiUpdateRef.current = Date.now();
        setEvent(updatedEvent);
      }
      // Refresh attendees after leaving
      const updatedAttendees = await eventsApi.getAttendees(eventId);
      setAttendees(updatedAttendees);
    } catch (err) {
      // Revert optimistic update on error
      if (originalEvent) {
        setEvent(originalEvent);
      }
      setError(err instanceof Error ? err.message : 'Failed to leave event');
    } finally {
      setIsJoining(false);
      setIsLeaving(false);
    }
  };

  const generateTicketNumber = (): string => {
    if (!event || !userId) return '';
    return `${event.id.slice(0, 8).toUpperCase()}-${userId.slice(0, 8).toUpperCase()}`;
  };

  const handleShowTicket = (): void => {
    setTicketModalVisible(true);
    setShowTicketAfterJoin(false);
  };

  const handleMessageAttendee = async (attendeeUserId: string): Promise<void> => {
    if (!userId || attendeeUserId === userId) {
      return; // Can't message yourself
    }

    try {
      // Check if conversation already exists
      await fetchConversations();
      const conversations = useChatStore.getState().conversations;
      const existingConv = conversations.find((conv) => {
        const participantIds = conv.participants.map((p) => p.userId);
        return participantIds.includes(userId) && participantIds.includes(attendeeUserId);
      });

      let conversationToNavigate;
      
      if (existingConv) {
        conversationToNavigate = existingConv;
      } else {
        // Create new conversation
        conversationToNavigate = await chatApi.createConversation({
          eventId,
          participantIds: [attendeeUserId],
        });
        // Refresh conversations list
        await fetchConversations();
      }
      
      // Navigate to chat tab and then to detail screen
      selectConversation(conversationToNavigate);
      (navigation as any).getParent()?.navigate(Routes.App.Chat, {
        screen: Routes.Chat.Detail,
        params: { conversationId: conversationToNavigate.id },
      });
    } catch (err) {
      alert('Failed to start conversation');
    }
  };

  const handleFollowToggle = async (): Promise<void> => {
    if (!event || !userId || event.organizerId === userId || isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      if (isFollowingHost) {
        await followApi.unfollow(event.organizerId);
        setIsFollowingHost(false);
      } else {
        await followApi.follow(event.organizerId);
        setIsFollowingHost(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update follow');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (isLoadingEvent) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText color="muted" style={{ marginTop: theme.spacing.md }}>
            Loading event...
          </AppText>
        </View>
      </Screen>
    );
  }

  if (!event || error) {
    return (
      <Screen>
        <View style={styles.errorContainer}>
          <AppText color="muted">{error || 'Event not found'}</AppText>
          <Button label="Go back" onPress={() => navigation.goBack()} style={{ marginTop: theme.spacing.sm }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {event.imageUrl && (
          <View style={styles.imageContainer}>
            <EventImage imageUrl={event.imageUrl} aspectRatio={16 / 9} />
          </View>
        )}

        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.sm }}>
            <AppText variant="title" style={{ flex: 1 }}>{event.title}</AppText>
            <TouchableOpacity
              onPress={() => void shareEvent(event)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: theme.colors.primaryLight,
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppText style={{ fontSize: 14 }}>📤</AppText>
              <AppText style={{ fontSize: 13, fontWeight: '600', color: theme.colors.primary }}>Share</AppText>
            </TouchableOpacity>
          </View>
          {event.seriesInterval && (
            <View style={styles.seriesBadge}>
              <AppText style={styles.seriesBadgeText} variant="caption">
                {getSeriesLabel(event.seriesInterval)}
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <AppText color="muted">{event.description}</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="title" style={styles.sectionTitle}>
            Details
          </AppText>
          <View style={styles.card}>
            <View style={{ marginBottom: theme.spacing.md }}>
              <AppText color="muted" variant="caption" style={{ marginBottom: theme.spacing.xs }}>
                📅 Date & Time
              </AppText>
              <DateDisplay date={event.date} mode="datetime" />
            </View>
            <View>
              <AppText color="muted" variant="caption" style={{ marginBottom: theme.spacing.xs }}>
                📍 Location
              </AppText>
              <LocationMap location={event.location} height={200} />
            </View>
            <View style={[styles.metaRow, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
              <View style={styles.metaRow}>
                <AppText color="muted" variant="caption">
                  👤
                </AppText>
                <AppText>Organized by {event.organizerName}</AppText>
              </View>
              {userId && event.organizerId !== userId && (
                <Button
                  label={isFollowLoading ? '...' : isFollowingHost ? 'Following' : 'Follow'}
                  onPress={handleFollowToggle}
                  variant={isFollowingHost ? 'secondary' : 'primary'}
                  size="small"
                  disabled={isFollowLoading}
                />
              )}
            </View>
            {event.topics && event.topics.length > 0 && (
              <View style={styles.metaRow}>
                <AppText color="muted" variant="caption">
                  🏷️
                </AppText>
                <AppText>Topics: {event.topics.join(', ')}</AppText>
              </View>
            )}
            <View style={styles.metaRow}>
              <AppText color="muted" variant="caption">
                👥
              </AppText>
              <AppText>
                {event.attendeeCount}
                {event.maxAttendees ? ` / ${event.maxAttendees}` : ''} attendees
              </AppText>
            </View>
            <View style={styles.metaRow}>
              <AppText color="muted" variant="caption">
                💰
              </AppText>
              <View style={{ flex: 1 }}>
                {event.isPaid ? (
                  event.pricingTiers && event.pricingTiers.length > 0 ? (
                    event.pricingTiers.map((tier, idx) => (
                      <AppText key={idx}>
                        {tier.name}: {tier.price} {event.currency || 'AED'}
                      </AppText>
                    ))
                  ) : (
                    <AppText>
                      {event.price != null ? `${event.price} ${event.currency || 'AED'}` : 'Paid event'}
                    </AppText>
                  )
                ) : (
                  <AppText>Free event</AppText>
                )}
              </View>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <AppText color="muted">{error}</AppText>
          </View>
        )}

        {/* Points reward callout - show for non-organizers */}
        {event.organizerId !== userId && (
          <View
            style={{
              marginBottom: theme.spacing.md,
              padding: theme.spacing.md,
              borderRadius: 12,
              backgroundColor: theme.colors.primaryLight,
              borderWidth: 1,
              borderColor: theme.colors.primary + '40',
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.primary + '30',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <AppText style={{ fontSize: 20 }}>🎯</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={{ fontWeight: '600', color: theme.colors.primary, marginBottom: 2 }}>
                Earn {calculatePointsForAttendance(getEffectivePriceForPoints(event.price, event.pricingTiers))} points
              </AppText>
              <AppText color="muted" variant="caption">
                {event.isJoined
                  ? 'Get your ticket scanned at the event to collect your points!'
                  : 'Join & attend to earn points when your ticket is scanned'}
              </AppText>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          {canEdit && (
            <>
              {event.isTicketed && (
                <Button
                  label="Scan Tickets"
                  onPress={() => navigation.navigate(Routes.Events.ScanTickets, { eventId })}
                />
              )}
              <Button
                label="Edit Event"
                onPress={() => navigation.navigate(Routes.Events.Edit, { eventId })}
                variant="secondary"
              />
            </>
          )}
          {/* Don't show join/leave button if user is the organizer */}
          {event.organizerId !== userId && (
            event.isJoined ? (
              <View style={{ gap: theme.spacing.sm }}>
                {event.isTicketed && (
                  <Button 
                    label="View Ticket" 
                    onPress={handleShowTicket} 
                    variant="danger"
                  />
                )}
                <Button 
                  label={isLeaving ? 'Leaving...' : 'Leave event'} 
                  onPress={handleLeave} 
                  variant="secondary" 
                  size="small"
                />
              </View>
            ) : (
              <Button label={isJoining ? 'Joining...' : 'Join event'} onPress={handleJoin} />
            )
          )}
        </View>

        <View style={styles.section}>
          <AppText variant="title" style={styles.sectionTitle}>
            Attendees ({attendees.length})
          </AppText>
          {isLoadingAttendees ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.card}>
              {attendees.length === 0 ? (
                <AppText color="muted">No attendees yet.</AppText>
              ) : (
                <FlatList
                  data={attendees}
                  keyExtractor={(item) => item.userId}
                  renderItem={({ item }) => (
                    <View style={styles.attendeeCard}>
                      <View style={styles.avatar}>
                        {item.avatarUrl ? (
                          <Image source={{ uri: fixAvatarUrl(item.avatarUrl) || item.avatarUrl }} style={styles.avatarImage} onError={() => console.warn('Failed to load attendee avatar:', item.avatarUrl)} />
                        ) : (
                          <AppText variant="caption" style={{ fontSize: 20 }}>
                            {item.name[0]?.toUpperCase()}
                          </AppText>
                        )}
                      </View>
                      <View style={styles.attendeeInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                          <AppText>{item.name}</AppText>
                          {item.userId === event.organizerId && (
                            <View style={styles.badge}>
                              <AppText variant="caption" style={styles.badgeText}>Host</AppText>
                            </View>
                          )}
                          {coHosts.some((ch) => ch.userId === item.userId) && (
                            <View style={styles.badge}>
                              <AppText variant="caption" style={styles.badgeText}>Co-Host</AppText>
                            </View>
                          )}
                          {canEdit && (admittedUserIds.has(item.userId) || item.admittedAt) && (
                            <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
                              <AppText variant="caption" style={styles.badgeText}>✓ Admitted</AppText>
                            </View>
                          )}
                        </View>
                        <AppText color="muted" variant="caption">
                          Joined {new Date(item.joinedAt).toLocaleDateString()}
                        </AppText>
                      </View>
                      {userId && item.userId !== userId && (
                        <Button
                          label="Message"
                          onPress={() => handleMessageAttendee(item.userId)}
                          variant="secondary"
                          style={styles.messageButton}
                        />
                      )}
                    </View>
                  )}
                  scrollEnabled={false}
                />
              )}
            </View>
          )}
        </View>

        {/* Hosts Section (visible to everyone, management only for organizer) */}
        {coHosts.length > 0 || event.organizerId === userId ? (
          <View style={styles.section}>
            <AppText variant="title" style={styles.sectionTitle}>
              Hosts ({coHosts.length + 1})
            </AppText>
            <View style={styles.card}>
              {event.organizerId === userId ? (
                <AppText color="muted" style={{ marginBottom: theme.spacing.sm }}>
                  Hosts can help manage your event. You can grant co-hosts permission to edit event details.
                </AppText>
              ) : (
                <AppText color="muted" style={{ marginBottom: theme.spacing.sm }}>
                  Event organizers and co-hosts.
                </AppText>
              )}
              {isLoadingCoHosts ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : (
                <FlatList
                  data={[
                    // Host (organizer) - always first
                    {
                      userId: event.organizerId,
                      userName: event.organizerName,
                      userAvatarUrl: undefined, // Could fetch organizer avatar if needed
                      role: 'Host' as const,
                      canEdit: true,
                      isOrganizer: true,
                    },
                    // Co-hosts
                    ...coHosts.map((ch) => ({
                      ...ch,
                      role: 'Co-Host' as const,
                      isOrganizer: false,
                    })),
                  ]}
                  keyExtractor={(item) => item.userId}
                  renderItem={({ item }) => (
                    <View style={styles.attendeeCard}>
                      <View style={styles.avatar}>
                        {item.userAvatarUrl ? (
                          <Image source={{ uri: fixAvatarUrl(item.userAvatarUrl) || item.userAvatarUrl }} style={styles.avatarImage} onError={() => console.warn('Failed to load co-host avatar:', item.userAvatarUrl)} />
                        ) : (
                          <AppText variant="caption" style={{ fontSize: 20 }}>
                            {item.userName[0]?.toUpperCase()}
                          </AppText>
                        )}
                      </View>
                      <View style={styles.attendeeInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                          <AppText>{item.userName}</AppText>
                          <View
                            style={{
                              backgroundColor: theme.colors.primary + '20',
                              paddingHorizontal: theme.spacing.xs,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <AppText variant="caption" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                              {item.role}
                            </AppText>
                          </View>
                        </View>
                        <AppText color="muted" variant="caption">
                          {item.isOrganizer
                            ? 'Can edit event'
                            : item.canEdit
                              ? 'Can edit event'
                              : 'View only'}
                        </AppText>
                      </View>
                      {!item.isOrganizer && event.organizerId === userId && (
                        <TouchableOpacity
                          style={styles.menuButton}
                          onPress={() => {
                            setSelectedCoHost({ userId: item.userId, canEdit: item.canEdit });
                            setMenuVisible(true);
                          }}
                        >
                          <AppText style={{ fontSize: 20 }}>⋯</AppText>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  scrollEnabled={false}
                />
              )}
              {event.organizerId === userId && (
                <Button
                  label="Add Co-Host"
                  onPress={async () => {
                    // Show list of attendees who aren't hosts or co-hosts
                    const availableAttendees = attendees.filter(
                      (a) => a.userId !== event.organizerId && !coHosts.some((ch) => ch.userId === a.userId)
                    );
                    if (availableAttendees.length === 0) {
                      Alert.alert('No Available Attendees', 'All attendees are already hosts or co-hosts.');
                      return;
                    }
                    // For simplicity, add the first available attendee
                    // In a real app, you'd show a picker/modal
                    const attendeeToAdd = availableAttendees[0];
                    try {
                      await eventsApi.addCoHost(eventId, { userId: attendeeToAdd.userId, canEdit: true });
                      // Reload co-hosts
                      const updatedCoHosts = await eventsApi.getCoHosts(eventId);
                      setCoHosts(updatedCoHosts);
                    } catch (err) {
                      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add co-host');
                    }
                  }}
                  variant="secondary"
                  style={{ marginTop: theme.spacing.sm }}
                />
              )}
            </View>
          </View>
        ) : null}

        {/* Co-Host Menu Modal */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setMenuVisible(false);
            setSelectedCoHost(null);
          }}
        >
          <TouchableOpacity
            style={styles.menuModal}
            activeOpacity={1}
            onPress={() => {
              setMenuVisible(false);
              setSelectedCoHost(null);
            }}
          >
            <View style={styles.menuContainer}>
              {selectedCoHost && (
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={async () => {
                      setMenuVisible(false);
                      try {
                        await eventsApi.updateCoHostPermission(eventId, selectedCoHost.userId, {
                          canEdit: !selectedCoHost.canEdit,
                        });
                        // Reload co-hosts to ensure state is in sync
                        const updatedCoHosts = await eventsApi.getCoHosts(eventId);
                        setCoHosts(updatedCoHosts);
                      } catch (err) {
                        Alert.alert('Error', 'Failed to update co-host permission');
                      }
                      setSelectedCoHost(null);
                    }}
                  >
                    <AppText style={styles.menuItemText}>
                      {selectedCoHost.canEdit ? 'Remove Edit Permission' : 'Allow Edit Permission'}
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.menuItem, styles.menuItemLast]}
                    onPress={() => {
                      setMenuVisible(false);
                      Alert.alert('Remove Co-Host', 'Are you sure you want to remove this co-host?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await eventsApi.removeCoHost(eventId, selectedCoHost.userId);
                              // Reload co-hosts to ensure state is in sync
                              const updatedCoHosts = await eventsApi.getCoHosts(eventId);
                              setCoHosts(updatedCoHosts);
                            } catch (err) {
                              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to remove co-host');
                            }
                            setSelectedCoHost(null);
                          },
                        },
                      ]);
                    }}
                  >
                    <AppText style={[styles.menuItemText, styles.menuItemTextDanger]}>Remove Co-Host</AppText>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Attendee admission celebration popup (shown when ticket is scanned while viewing ticket) */}
        {event && admissionCelebrationVisible && (
          <Modal
            visible={admissionCelebrationVisible}
            transparent
            animationType="fade"
            onRequestClose={() => {
              setAdmissionCelebrationVisible(false);
              setAdmissionCelebrationPoints(null);
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
                setAdmissionCelebrationVisible(false);
                setAdmissionCelebrationPoints(null);
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
                  You're in!
                </AppText>
                {admissionCelebrationPoints != null && admissionCelebrationPoints > 0 ? (
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
                      You earned
                    </AppText>
                    <AppText
                      style={{
                        fontSize: 32,
                        fontWeight: '700',
                        color: theme.colors.primary,
                      }}
                    >
                      {admissionCelebrationPoints} points
                    </AppText>
                  </View>
                ) : (
                  <AppText color="muted" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.lg, textAlign: 'center' }}>
                    Your ticket has been verified
                  </AppText>
                )}
                <Button
                  label="Awesome!"
                  onPress={() => {
                    setAdmissionCelebrationVisible(false);
                    setAdmissionCelebrationPoints(null);
                  }}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Ticket Modal */}
        {event && event.isTicketed && event.isJoined && (
          <Modal
            visible={ticketModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => {
              setTicketModalVisible(false);
              setShowTicketAfterJoin(false);
            }}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <AppText variant="title">Your Ticket</AppText>
                  <TouchableOpacity
                    onPress={() => {
                      setTicketModalVisible(false);
                      setShowTicketAfterJoin(false);
                    }}
                  >
                    <AppText style={{ fontSize: 24 }}>✕</AppText>
                  </TouchableOpacity>
                </View>
                {showTicketAfterJoin && (
                  <View style={{ marginBottom: theme.spacing.md, padding: theme.spacing.sm, backgroundColor: theme.colors.primary + '20', borderRadius: 8 }}>
                    <AppText color="muted" variant="caption">
                      🎉 You've successfully joined this ticketed event! Your ticket is below.
                    </AppText>
                  </View>
                )}
                <ScrollView contentContainerStyle={styles.modalScrollContent}>
                  <TicketCard event={event} ticketNumber={generateTicketNumber()} userId={userId || undefined} />
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
    </Screen>
  );
};

