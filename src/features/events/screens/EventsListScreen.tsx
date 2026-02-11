import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { useTheme } from '../../../theme/useTheme';
import { useEventsStore } from '../../../store/events/eventsStore';
import { EventCard } from '../components/EventCard';
import { EVENT_TOPICS } from '../constants/topics';
import type { EventsStackParamList, AppTabsParamList } from '../../../navigation/types';
import { Routes } from '../../../navigation/routes';

type Props = CompositeScreenProps<NativeStackScreenProps<EventsStackParamList, typeof Routes.Events.List>, BottomTabScreenProps<AppTabsParamList>>;

export const EventsListScreen = ({ navigation }: Props): React.JSX.Element => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const events = useEventsStore((s) => s.events);
  const isLoading = useEventsStore((s) => s.isLoading);
  const error = useEventsStore((s) => s.error);
  const fetchEvents = useEventsStore((s) => s.fetchEvents);
  const refreshEvents = useEventsStore((s) => s.refreshEvents);

  type HostFilter = 'all' | 'following' | 'newHost';
  const HOST_FILTER_LABELS: Record<HostFilter, string> = {
    all: 'All',
    following: 'Following',
    newHost: 'New',
  };
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [hostFilter, setHostFilter] = React.useState<HostFilter>('all');
  const [selectedTopics, setSelectedTopics] = React.useState<string[]>([]);

  const flatListRef = React.useRef<FlatList>(null);
  const filterAnim = React.useRef(new Animated.Value(1)).current;
  const [showFilters, setShowFilters] = React.useState(true);
  const lastTargetRef = React.useRef<boolean | null>(null);
  const HIDE_THRESHOLD = 100;
  const SHOW_THRESHOLD = 40;
  const FILTER_HEIGHT = 140;

  const toggleTopicFilter = React.useCallback((topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }, []);

  const filteredEvents = React.useMemo(() => {
    let result = events;

    if (hostFilter === 'following') {
      result = result.filter((event) => event.isFromFollowedHost === true);
    } else if (hostFilter === 'newHost') {
      result = result.filter((event) => event.isFromFollowedHost !== true);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.organizerName.toLowerCase().includes(query)
      );
    }

    if (selectedTopics.length > 0) {
      result = result.filter((event) =>
        event.topics?.some((t) => selectedTopics.includes(t))
      );
    }

    return result;
  }, [events, hostFilter, searchQuery, selectedTopics]);

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      header: {
        paddingTop: insets.top + theme.spacing.md,
        marginBottom: theme.spacing.md,
      },
      titleRow: {
        marginBottom: theme.spacing.sm,
      },
      searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
      },
      searchInput: {
        flex: 1,
        minWidth: 0,
      },
      createButton: {
        flexShrink: 0,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
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
      filterSection: {
        paddingTop: theme.spacing.sm,
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      },
      filterRowLabel: {
        fontSize: 10,
        color: theme.colors.mutedText,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
      hostSegmentedContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        padding: 2,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      hostSegment: {
        flex: 1,
        paddingVertical: 6,
        paddingHorizontal: theme.spacing.xs,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
      },
      hostSegmentSelected: {
        backgroundColor: theme.colors.primary,
      },
      hostSegmentText: {
        fontSize: 11,
        fontWeight: '500',
        color: theme.colors.text,
      },
      hostSegmentTextSelected: {
        color: theme.mode === 'dark' ? '#0B0F14' : '#FFFFFF',
        fontWeight: '600',
      },
      topicSection: {
        marginTop: theme.spacing.sm,
      },
      topicTabsContainer: {
        marginBottom: 4,
      },
      topicTabsScroll: {
        flexGrow: 0,
        paddingVertical: 2,
      },
      topicTabRow: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
        paddingHorizontal: 2,
      },
      topicChip: {
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      topicChipSelected: {
        backgroundColor: theme.colors.primary + '25',
        borderColor: theme.colors.primary,
      },
      topicChipText: {
        fontSize: 11,
        fontWeight: '500',
        color: theme.colors.text,
      },
      topicChipTextSelected: {
        color: theme.colors.primary,
        fontWeight: '600',
      },
    });
  }, [theme.colors.border, theme.colors.surface, theme.colors.primary, theme.colors.background, theme.colors.text, theme.colors.mutedText, theme.spacing.md, theme.spacing.xl, theme.spacing.sm, theme.spacing.xs, theme.spacing.lg, theme.typography.captionSize, theme.mode, insets.top]);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await refreshEvents();
    setIsRefreshing(false);
  }, [refreshEvents]);

  const handleEventPress = React.useCallback(
    (eventId: string) => {
      navigation.navigate(Routes.Events.Details, { eventId });
    },
    [navigation]
  );

  const handleCreateEvent = React.useCallback(() => {
    navigation.navigate(Routes.Events.Create);
  }, [navigation]);

  const handleScrollToTop = React.useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleScroll = React.useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const y = e.nativeEvent.contentOffset.y;
      const wantShow = y < SHOW_THRESHOLD;
      const wantHide = y > HIDE_THRESHOLD;
      const lastTarget = lastTargetRef.current;
      if (wantHide && lastTarget !== false) {
        lastTargetRef.current = false;
        setShowFilters(false);
        Animated.timing(filterAnim, {
          toValue: 0,
          duration: 380,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }).start();
      } else if (wantShow && lastTarget !== true) {
        lastTargetRef.current = true;
        setShowFilters(true);
        Animated.timing(filterAnim, {
          toValue: 1,
          duration: 380,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }).start();
      }
    },
    [filterAnim]
  );

  const filterSectionHeight = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FILTER_HEIGHT],
    extrapolate: 'clamp',
  });
  const filterSectionOpacity = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const scrollToTopOpacity = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (isLoading && events.length === 0) {
    return (
      <Screen>
        <View style={styles.header}>
          <AppText variant="title" style={styles.titleRow}>
            Events
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText color="muted" style={{ marginTop: theme.spacing.md }}>
            Loading events...
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title" style={styles.titleRow}>
          Events
        </AppText>
        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search events..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button label="Create" onPress={handleCreateEvent} style={styles.createButton} />
        </View>

        <Animated.View
          style={[
            styles.filterSection,
            {
              height: filterSectionHeight,
              opacity: filterSectionOpacity,
              overflow: 'hidden',
              marginBottom: 0,
            },
          ]}
        >
          <AppText style={styles.filterRowLabel}>Host</AppText>
          <View style={styles.hostSegmentedContainer}>
            {(['all', 'following', 'newHost'] as const).map((filter) => {
              const selected = hostFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.hostSegment, selected && styles.hostSegmentSelected]}
                  onPress={() => setHostFilter(filter)}
                  activeOpacity={0.7}
                >
                  <AppText style={[styles.hostSegmentText, selected && styles.hostSegmentTextSelected]}>
                    {HOST_FILTER_LABELS[filter]}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.topicSection}>
            <AppText style={styles.filterRowLabel}>Topic</AppText>
            <View style={styles.topicTabsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topicTabsScroll}
              >
                <View style={styles.topicTabRow}>
                  {EVENT_TOPICS.map((topic) => {
                    const selected = selectedTopics.includes(topic);
                    return (
                      <TouchableOpacity
                        key={topic}
                        style={[styles.topicChip, selected && styles.topicChipSelected]}
                        onPress={() => toggleTopicFilter(topic)}
                        activeOpacity={0.7}
                      >
                        <AppText style={[styles.topicChipText, selected && styles.topicChipTextSelected]}>
                          {topic}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
          {(selectedTopics.length > 0 || hostFilter !== 'all') && (
            <AppText color="muted" style={{ fontSize: 10, marginTop: 4 }}>
              {hostFilter !== 'all' && `${HOST_FILTER_LABELS[hostFilter]} • `}
              {selectedTopics.length > 0 && `${selectedTopics.length} topic${selectedTopics.length === 1 ? '' : 's'} selected • `}
              tap to toggle
            </AppText>
          )}
        </Animated.View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AppText color="muted">{error}</AppText>
          <Button label="Retry" onPress={fetchEvents} style={{ marginTop: theme.spacing.sm }} />
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} onPress={() => handleEventPress(item.id)} />}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={
          filteredEvents.length === 0
            ? styles.emptyContainer
            : { paddingBottom: theme.spacing.md }
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <AppText color="muted">
                {searchQuery.trim() || selectedTopics.length > 0 || hostFilter !== 'all'
                  ? 'No events match your filters.'
                  : 'No events yet.'}
              </AppText>
              {!searchQuery.trim() && selectedTopics.length === 0 && hostFilter === 'all' && (
                <Button label="Create your first event" onPress={handleCreateEvent} style={{ marginTop: theme.spacing.md }} />
              )}
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      />

      <Animated.View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          right: theme.spacing.md,
          bottom: insets.bottom + 80,
          opacity: scrollToTopOpacity,
        }}
      >
        <TouchableOpacity
          onPress={handleScrollToTop}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            ...theme.shadow('md'),
          }}
          activeOpacity={0.8}
        >
          <AppText style={{ fontSize: 20, color: theme.mode === 'dark' ? '#0B0F14' : '#FFFFFF' }}>↑</AppText>
        </TouchableOpacity>
      </Animated.View>
    </Screen>
  );
};
