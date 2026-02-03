import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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

  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [selectedTopics, setSelectedTopics] = React.useState<string[]>([]);

  const toggleTopicFilter = React.useCallback((topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }, []);

  const filteredEvents = React.useMemo(() => {
    let result = events;

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
  }, [events, searchQuery, selectedTopics]);

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
      topicTabsContainer: {
        marginBottom: theme.spacing.md,
      },
      topicTabsScroll: {
        flexGrow: 0,
        paddingVertical: theme.spacing.xs,
      },
      topicTabRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        paddingHorizontal: 2,
      },
      topicTab: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
      },
      topicTabSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      topicTabText: {
        fontSize: theme.typography.captionSize,
        fontWeight: '500',
        color: theme.colors.text,
      },
      topicTabTextSelected: {
        color: theme.mode === 'dark' ? '#0B0F14' : '#FFFFFF',
        fontWeight: '600',
      },
    });
  }, [theme.colors.border, theme.colors.surface, theme.colors.primary, theme.colors.background, theme.colors.text, theme.spacing.md, theme.spacing.xl, theme.spacing.sm, theme.spacing.xs, theme.spacing.lg, theme.typography.captionSize, theme.mode, insets.top]);

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
                    style={[styles.topicTab, selected && styles.topicTabSelected]}
                    onPress={() => toggleTopicFilter(topic)}
                    activeOpacity={0.7}
                  >
                    <AppText style={[styles.topicTabText, selected && styles.topicTabTextSelected]}>
                      {topic}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          {selectedTopics.length > 0 && (
            <AppText color="muted" style={{ fontSize: 12, marginTop: theme.spacing.xs }}>
              {selectedTopics.length} topic{selectedTopics.length === 1 ? '' : 's'} selected • tap to toggle
            </AppText>
          )}
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AppText color="muted">{error}</AppText>
          <Button label="Retry" onPress={fetchEvents} style={{ marginTop: theme.spacing.sm }} />
        </View>
      )}

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} onPress={() => handleEventPress(item.id)} />}
        contentContainerStyle={filteredEvents.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <AppText color="muted">
                {searchQuery.trim() || selectedTopics.length > 0
                  ? 'No events match your filters.'
                  : 'No events yet.'}
              </AppText>
              {!searchQuery.trim() && selectedTopics.length === 0 && (
                <Button label="Create your first event" onPress={handleCreateEvent} style={{ marginTop: theme.spacing.md }} />
              )}
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
};
