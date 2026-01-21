import React from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, View, Image, TouchableOpacity, Modal } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { EventImage } from '../../../components/ui/EventImage';
import { useTheme } from '../../../theme/useTheme';
import { useEventsStore } from '../../../store/events/eventsStore';
import { eventsApi } from '../../../api/eventsApi';
import { useChatStore } from '../../../store/chat/chatStore';
import { useAuthStore } from '../../../store/auth/authStore';
import { chatApi } from '../../../api/chatApi';
import type { EventsStackParamList, AppTabsParamList } from '../../../navigation/types';
import { Routes } from '../../../navigation/routes';
import type { EventAttendee, EventCoHost } from '../types';

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
  const [error, setError] = React.useState<string | null>(null);
  const [menuVisible, setMenuVisible] = React.useState<boolean>(false);
  const [selectedCoHost, setSelectedCoHost] = React.useState<{ userId: string; canEdit: boolean } | null>(null);
  const updateEvent = useEventsStore((s) => s.updateEvent);

  // Check if user can edit (organizer or co-host with permission)
  const canEdit = React.useMemo(() => {
    if (!event || !userId) return false;
    // If canEdit is already set, use it
    if (event.canEdit !== undefined) return event.canEdit;
    // Otherwise check if user is organizer
    if (event.organizerId === userId) return true;
    // Check if user is a co-host with edit permission
    const coHost = coHosts.find((ch) => ch.userId === userId);
    return coHost?.canEdit === true;
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
    });
  }, [theme]);

  React.useEffect(() => {
    const loadEvent = async (): Promise<void> => {
      if (event) {
        setIsLoadingEvent(false);
        // Load co-hosts if user is organizer
        if (event.organizerId === userId) {
          setIsLoadingCoHosts(true);
          try {
            const loadedCoHosts = await eventsApi.getCoHosts(eventId);
            setCoHosts(loadedCoHosts);
          } catch (err) {
            // Ignore errors - user might not be organizer
          } finally {
            setIsLoadingCoHosts(false);
          }
        }
        return;
      }

      try {
        const loadedEvent = await eventsApi.getById(eventId);
        if (loadedEvent) {
          setEvent(loadedEvent);
          // Load co-hosts if user is organizer
          if (loadedEvent.organizerId === userId) {
            setIsLoadingCoHosts(true);
            try {
              const loadedCoHosts = await eventsApi.getCoHosts(eventId);
              setCoHosts(loadedCoHosts);
            } catch (err) {
              // Ignore errors
            } finally {
              setIsLoadingCoHosts(false);
            }
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

  // Update event when store changes
  React.useEffect(() => {
    const updatedEvent = events.find((e) => e.id === eventId);
    if (updatedEvent) {
      setEvent(updatedEvent);
    }
  }, [events, eventId]);

  const handleJoin = async (): Promise<void> => {
    setIsJoining(true);
    setError(null);

    try {
      await joinEvent(eventId);
      // Refresh attendees after joining
      const updatedAttendees = await eventsApi.getAttendees(eventId);
      setAttendees(updatedAttendees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join event');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async (): Promise<void> => {
    setIsJoining(true);
    setError(null);

    try {
      await leaveEvent(eventId);
      // Refresh attendees after leaving
      const updatedAttendees = await eventsApi.getAttendees(eventId);
      setAttendees(updatedAttendees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave event');
    } finally {
      setIsJoining(false);
    }
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
          <AppText variant="title">{event.title}</AppText>
        </View>

        <View style={styles.card}>
          <AppText color="muted">{event.description}</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="title" style={styles.sectionTitle}>
            Details
          </AppText>
          <View style={styles.card}>
            <View style={styles.metaRow}>
              <AppText color="muted" variant="caption">
                📅
              </AppText>
              <AppText>{formatDate(event.date)}</AppText>
            </View>
            <View style={styles.metaRow}>
              <AppText color="muted" variant="caption">
                🕐
              </AppText>
              <AppText>{formatTime(event.date)}</AppText>
            </View>
            <View style={styles.metaRow}>
              <AppText color="muted" variant="caption">
                📍
              </AppText>
              <AppText>{event.location}</AppText>
            </View>
            <View style={styles.metaRow}>
              <AppText color="muted" variant="caption">
                👤
              </AppText>
              <AppText>Organized by {event.organizerName}</AppText>
            </View>
            <View style={styles.metaRow}>
              <AppText color="muted" variant="caption">
                👥
              </AppText>
              <AppText>
                {event.attendeeCount}
                {event.maxAttendees ? ` / ${event.maxAttendees}` : ''} attendees
              </AppText>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <AppText color="muted">{error}</AppText>
          </View>
        )}

        <View style={styles.actions}>
          {canEdit && (
            <Button
              label="Edit Event"
              onPress={() => navigation.navigate(Routes.Events.Edit, { eventId })}
              variant="secondary"
            />
          )}
          {event.isJoined ? (
            <Button label={isJoining ? 'Leaving...' : 'Leave event'} onPress={handleLeave} variant="danger" />
          ) : (
            <Button label={isJoining ? 'Joining...' : 'Join event'} onPress={handleJoin} />
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
                          <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
                        ) : (
                          <AppText variant="caption" style={{ fontSize: 20 }}>
                            {item.name[0]?.toUpperCase()}
                          </AppText>
                        )}
                      </View>
                      <View style={styles.attendeeInfo}>
                        <AppText>{item.name}</AppText>
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

        {/* Hosts Management (only visible to organizer) */}
        {event.organizerId === userId && (
          <View style={styles.section}>
            <AppText variant="title" style={styles.sectionTitle}>
              Hosts ({coHosts.length + 1})
            </AppText>
            <View style={styles.card}>
              <AppText color="muted" style={{ marginBottom: theme.spacing.sm }}>
                Hosts can help manage your event. You can grant co-hosts permission to edit event details.
              </AppText>
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
                          <Image source={{ uri: item.userAvatarUrl }} style={styles.avatarImage} />
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
                      {!item.isOrganizer && (
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
            </View>
          </View>
        )}

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
      </ScrollView>
    </Screen>
  );
};

