import React from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { challengesApi, type Challenge, type ChallengesStats } from '../../../api/challengesApi';
import { useTheme } from '../../../theme/useTheme';
import type { AppTabsParamList } from '../../../navigation/types';
import { Routes } from '../../../navigation/routes';

type Props = BottomTabScreenProps<AppTabsParamList, typeof Routes.App.Challenges>;

const LEVEL_TIERS = [
  { name: 'Newcomer', minPoints: 0, icon: '🌱', color: '#8B7355' },
  { name: 'Social Butterfly', minPoints: 100, icon: '🦋', color: '#9B59B6' },
  { name: 'Event Enthusiast', minPoints: 250, icon: '⭐', color: '#F39C12' },
  { name: 'Community Champion', minPoints: 500, icon: '🏆', color: '#E74C3C' },
  { name: 'Legend', minPoints: 1000, icon: '👑', color: '#2ECC71' },
];

function getLevel(points: number) {
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_TIERS[i].minPoints) return LEVEL_TIERS[i];
  }
  return LEVEL_TIERS[0];
}

function getNextLevel(points: number) {
  const current = getLevel(points);
  const idx = LEVEL_TIERS.findIndex((l) => l.name === current.name);
  return idx < LEVEL_TIERS.length - 1 ? LEVEL_TIERS[idx + 1] : null;
}

function getLevelProgress(points: number): { progress: number; pointsToNext: number } {
  const current = getLevel(points);
  const next = getNextLevel(points);
  if (!next) return { progress: 1, pointsToNext: 0 };
  const range = next.minPoints - current.minPoints;
  const progressInRange = points - current.minPoints;
  return {
    progress: Math.min(1, progressInRange / range),
    pointsToNext: next.minPoints - points,
  };
}

const CHALLENGE_ICONS: Record<string, string> = {
  'First Steps': '🎯',
  'Triple Threat': '⚡',
  'Social Explorer': '🗺️',
  'Event Enthusiast': '🔥',
  'Community Champion': '🌟',
  'Networking Pro': '🤝',
  'Social Legend': '👑',
};

export const ChallengesScreen = (_props: Props): React.JSX.Element => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [data, setData] = React.useState<{ challenges: Challenge[]; stats: ChallengesStats } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      challengesApi
        .getChallenges()
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setIsLoading(false));
    }, [])
  );

  const level = data ? getLevel(data.stats.totalPoints) : LEVEL_TIERS[0];
  const levelProgress = data ? getLevelProgress(data.stats.totalPoints) : { progress: 0, pointsToNext: 100 };
  const nextChallenge = data?.challenges.find((c) => !c.isCompleted);
  const eventsToNext = nextChallenge
    ? nextChallenge.targetCount - nextChallenge.currentCount
    : 0;

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        paddingTop: insets.top + theme.spacing.md,
        paddingBottom: insets.bottom + theme.spacing.xl,
      },
      heroCard: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 20,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        overflow: 'hidden',
        ...theme.shadow('md'),
      },
      heroGradient: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: theme.colors.primary + '15',
      },
      statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.lg,
      },
      statBox: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
      },
      statValue: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.text,
      },
      statLabel: {
        fontSize: 11,
        color: theme.colors.mutedText,
        marginTop: 2,
      },
      levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: 12,
        alignSelf: 'center',
      },
      levelProgressBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.border,
        marginTop: theme.spacing.sm,
        overflow: 'hidden',
      },
      levelProgressFill: {
        height: '100%',
        borderRadius: 3,
      },
      nextMilestoneCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderRadius: 14,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderStyle: 'dashed',
      },
      completionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: theme.spacing.md,
      },
      card: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadow('sm'),
      },
      sectionTitle: {
        marginBottom: theme.spacing.sm,
      },
      challengeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: theme.spacing.sm,
      },
      challengeIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
      },
      challengeContent: {
        flex: 1,
      },
      progressBar: {
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.border,
        marginTop: theme.spacing.xs,
        overflow: 'hidden',
      },
      progressFill: {
        height: '100%',
        borderRadius: 2,
      },
      rewardBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 6,
        borderRadius: 10,
        marginLeft: theme.spacing.sm,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
      },
    });
  }, [theme, insets.top, insets.bottom]);

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText color="muted" style={{ marginTop: theme.spacing.md }}>
            Loading your quests...
          </AppText>
        </View>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.container}>
          <AppText variant="title" style={{ marginBottom: theme.spacing.sm }}>
            Challenges & Quests
          </AppText>
          <View style={[styles.card, { paddingVertical: theme.spacing.xl }]}>
            <AppText color="muted" style={{ textAlign: 'center' }}>
              Unable to load challenges. Pull to refresh or try again later.
            </AppText>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  const { challenges, stats } = data;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero stats card */}
        <View style={styles.heroCard}>
          <View style={[styles.heroGradient, { right: -50, top: -50 }]} />
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <AppText style={styles.statValue}>★ {stats.totalPoints}</AppText>
              <AppText style={styles.statLabel}>Total Points</AppText>
            </View>
            <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.colors.border }]}>
              <AppText style={styles.statValue}>{stats.totalEventsAttended}</AppText>
              <AppText style={styles.statLabel}>Events Attended</AppText>
            </View>
            <View style={styles.statBox}>
              <AppText style={styles.statValue}>
                {stats.completedChallenges}/{stats.totalChallenges}
              </AppText>
              <AppText style={styles.statLabel}>Quests Done</AppText>
            </View>
          </View>

          <View style={[styles.levelBadge, { backgroundColor: level.color + '25', borderColor: level.color + '50', borderWidth: 1 }]}>
            <AppText style={{ fontSize: 20, marginRight: 6 }}>{level.icon}</AppText>
            <AppText style={{ fontWeight: '700', fontSize: 14, color: level.color }}>{level.name}</AppText>
          </View>

          {getNextLevel(stats.totalPoints) && (
            <View style={styles.levelProgressBar}>
              <View
                style={[
                  styles.levelProgressFill,
                  {
                    width: `${levelProgress.progress * 100}%`,
                    backgroundColor: level.color,
                  },
                ]}
              />
            </View>
          )}
          {levelProgress.pointsToNext > 0 && (
            <AppText color="muted" style={{ fontSize: 11, marginTop: 4, textAlign: 'center' }}>
              {levelProgress.pointsToNext} pts to {getNextLevel(stats.totalPoints)?.name}
            </AppText>
          )}
        </View>

        {/* Next milestone callout */}
        {nextChallenge && eventsToNext > 0 && (
          <View
            style={[
              styles.nextMilestoneCard,
              {
                backgroundColor: theme.colors.primary + '12',
                borderColor: theme.colors.primary + '40',
              },
            ]}
          >
            <AppText style={{ fontSize: 28, marginRight: theme.spacing.md }}>🎯</AppText>
            <View style={{ flex: 1 }}>
              <AppText style={{ fontWeight: '600', fontSize: 14 }}>
                {eventsToNext === 1 ? 'One more event!' : `${eventsToNext} events to go`}
              </AppText>
              <AppText color="muted" style={{ fontSize: 12, marginTop: 2 }}>
                Complete "{nextChallenge.name}" for +{nextChallenge.rewardPoints} bonus points
              </AppText>
            </View>
          </View>
        )}

        {/* All quests completed celebration */}
        {stats.completedChallenges === stats.totalChallenges && stats.totalChallenges > 0 && (
          <View
            style={[
              styles.nextMilestoneCard,
              {
                backgroundColor: theme.colors.primary + '15',
                borderColor: theme.colors.primary + '50',
              },
            ]}
          >
            <AppText style={{ fontSize: 32, marginRight: theme.spacing.md }}>🎉</AppText>
            <View style={{ flex: 1 }}>
              <AppText style={{ fontWeight: '700', fontSize: 15 }}>All quests complete!</AppText>
              <AppText color="muted" style={{ fontSize: 12, marginTop: 2 }}>
                You're a true community champion. Keep attending events to earn more points!
              </AppText>
            </View>
          </View>
        )}

        {/* Quests list */}
        <View style={styles.card}>
          <View style={[styles.completionBadge, { backgroundColor: theme.colors.primary + '20' }]}>
            <AppText style={{ fontSize: 12, fontWeight: '600', color: theme.colors.primary }}>
              {stats.completedChallenges} of {stats.totalChallenges} completed
            </AppText>
          </View>

          {challenges.length === 0 ? (
            <AppText color="muted" style={{ textAlign: 'center', paddingVertical: theme.spacing.lg }}>
              No challenges available. Check back later!
            </AppText>
          ) : (
            challenges.map((c) => {
              const progress = Math.min(1, c.currentCount / c.targetCount);
              const icon = CHALLENGE_ICONS[c.name] ?? '📌';
              return (
                <View
                  key={c.id}
                  style={[
                    styles.challengeItem,
                    {
                      backgroundColor: c.isCompleted ? theme.colors.primary + '12' : theme.colors.background,
                      borderColor: c.isCompleted ? theme.colors.primary + '35' : theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.challengeIcon,
                      {
                        backgroundColor: c.isCompleted ? theme.colors.primary + '25' : theme.colors.border + '80',
                      },
                    ]}
                  >
                    <AppText style={{ fontSize: 20 }}>{icon}</AppText>
                  </View>
                  <View style={styles.challengeContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <AppText style={{ fontWeight: '600', flex: 1 }}>{c.name}</AppText>
                      {c.isCompleted && (
                        <AppText style={{ fontSize: 12, color: theme.colors.primary, fontWeight: '600' }}>✓ Done</AppText>
                      )}
                    </View>
                    <AppText color="muted" style={{ fontSize: 12, marginTop: 2 }}>
                      {c.description}
                    </AppText>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${progress * 100}%`,
                            backgroundColor: c.isCompleted ? theme.colors.primary : theme.colors.primary + '99',
                          },
                        ]}
                      />
                    </View>
                    <AppText style={{ fontSize: 11, marginTop: 4, color: theme.colors.mutedText }}>
                      {c.currentCount}/{c.targetCount} events
                    </AppText>
                  </View>
                  <View style={[styles.rewardBadge, { backgroundColor: theme.colors.primary + '25' }]}>
                    <AppText style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 12 }}>
                      +{c.rewardPoints} pts
                    </AppText>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
};
