import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { useTheme } from '../../../theme/useTheme';
import { useEventsStore } from '../../../store/events/eventsStore';
import { EventCard } from '../../events/components/EventCard';
import type { BookingsStackParamList, AppTabsParamList, EventsStackParamList } from '../../../navigation/types';
import { Routes } from '../../../navigation/routes';
import type { Event } from '../../events/types';

type Props = CompositeScreenProps<
  NativeStackScreenProps<BookingsStackParamList, typeof Routes.Bookings.Upcoming | typeof Routes.Bookings.Past>,
  CompositeScreenProps<
    BottomTabScreenProps<AppTabsParamList, typeof Routes.App.Bookings>,
    NativeStackScreenProps<EventsStackParamList>
  >
>;

export const MyBookingsScreen = ({ navigation, route }: Props): React.JSX.Element => {
  const theme = useTheme();
  const events = useEventsStore((s) => s.events);
  const isLoading = useEventsStore((s) => s.isLoading);
  const fetchEvents = useEventsStore((s) => s.fetchEvents);
  const refreshEvents = useEventsStore((s) => s.refreshEvents);

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'upcoming' | 'past'>(
    route.name === Routes.Bookings.Past ? 'past' : 'upcoming'
  );

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  React.useEffect(() => {
    // Update active tab when route changes
    if (route.name === Routes.Bookings.Past) {
      setActiveTab('past');
    } else {
      setActiveTab('upcoming');
    }
  }, [route.name]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshEvents();
    setIsRefreshing(false);
  };

  // Filter and split events
  const myEvents = React.useMemo(() => {
    const joined = events.filter((event) => event.isJoined);
    const now = new Date();
    // Set time to end of day for comparison (events are past after the day ends)
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    
    const upcoming: Event[] = [];
    const past: Event[] = [];
    
    joined.forEach((event) => {
      const eventDate = new Date(event.date);
      // Event is past if its date is before end of today
      if (eventDate <= endOfToday) {
        past.push(event);
      } else {
        upcoming.push(event);
      }
    });
    
    // Sort upcoming by date (soonest first)
    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // Sort past by date (most recent first)
    past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return { upcoming, past };
  }, [events]);

  const displayedEvents = activeTab === 'upcoming' ? myEvents.upcoming : myEvents.past;

  const handleEventPress = (eventId: string) => {
    navigation.navigate(Routes.App.Events, {
      screen: Routes.Events.Details,
      params: { eventId },
    });
  };

  const handleTabPress = (tab: 'upcoming' | 'past') => {
    setActiveTab(tab);
    if (tab === 'upcoming') {
      navigation.navigate(Routes.Bookings.Upcoming);
    } else {
      navigation.navigate(Routes.Bookings.Past);
    }
  };

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
      },
      tabContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
      },
      tab: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
      },
      tabActive: {
        borderBottomColor: theme.colors.primary,
      },
      tabText: {
        fontSize: theme.typography.bodySize,
        fontWeight: '600',
      },
      tabTextActive: {
        color: theme.colors.primary,
      },
      tabTextInactive: {
        color: theme.colors.mutedText,
      },
      content: {
        flex: 1,
        padding: theme.spacing.md,
      },
      emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
      },
      emptyStateText: {
        marginTop: theme.spacing.md,
        textAlign: 'center',
      },
    });
  }, [theme]);

  return (
    <Screen>
      <View style={styles.container}>
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
            onPress={() => handleTabPress('upcoming')}
          >
            <AppText
              style={[
                styles.tabText,
                activeTab === 'upcoming' ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              Upcoming ({myEvents.upcoming.length})
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'past' && styles.tabActive]}
            onPress={() => handleTabPress('past')}
          >
            <AppText
              style={[
                styles.tabText,
                activeTab === 'past' ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              Past ({myEvents.past.length})
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {displayedEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <AppText variant="title" color="muted">
                {activeTab === 'upcoming' ? '📅' : '📜'}
              </AppText>
              <AppText color="muted" style={styles.emptyStateText}>
                {activeTab === 'upcoming'
                  ? "You don't have any upcoming bookings."
                  : "You don't have any past bookings."}
              </AppText>
              <AppText color="muted" variant="caption" style={{ marginTop: theme.spacing.xs }}>
                {activeTab === 'upcoming'
                  ? 'Browse events to join some!'
                  : 'Your past event history will appear here.'}
              </AppText>
            </View>
          ) : (
            <FlatList
              data={displayedEvents}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <EventCard event={item} onPress={() => handleEventPress(item.id)} />
              )}
              contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
              }
            />
          )}
        </View>
      </View>
    </Screen>
  );
};
