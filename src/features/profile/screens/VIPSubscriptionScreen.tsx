import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { useTheme } from '../../../theme/useTheme';

type TierFeature = { icon: string; text: string };

const VIP_TIERS = [
  {
    id: 'vip',
    name: 'VIP',
    tagline: 'Great value to get more from events',
    icon: '⭐',
    accentColor: '#059669',
    features: [
      { icon: '⭐', text: 'Double points on every event' },
      { icon: '🎫', text: 'Early access to events' },
      { icon: '👑', text: 'VIP badge on your profile' },
      { icon: '💰', text: '10% off selected events' },
      { icon: '📧', text: 'Weekly curated event picks' },
    ] as TierFeature[],
  },
  {
    id: 'vip-plus',
    name: 'VIP Plus',
    tagline: 'The full premium experience',
    icon: '👑',
    accentColor: '#D97706',
    features: [
      { icon: '⭐', text: 'Double points on every event' },
      { icon: '🎫', text: 'Early access to events' },
      { icon: '👑', text: 'VIP badge on your profile' },
      { icon: '💰', text: '20% off selected events' },
      { icon: '✨', text: 'Exclusive VIP-only events' },
      { icon: '💬', text: 'Priority support' },
      { icon: '🎁', text: 'Birthday & surprise perks' },
      { icon: '📧', text: 'Weekly curated event picks' },
    ] as TierFeature[],
  },
];

export const VIPSubscriptionScreen = (): React.JSX.Element => {
  const theme = useTheme();

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        paddingBottom: theme.spacing.xl,
      },
      hero: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
      },
      crown: {
        fontSize: 48,
        marginBottom: theme.spacing.sm,
      },
      heroTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
      },
      heroSubtitle: {
        fontSize: 15,
        color: theme.colors.mutedText,
        textAlign: 'center',
        lineHeight: 22,
      },
      sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.mutedText,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xs,
      },
      tierCard: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 20,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        overflow: 'hidden',
        ...theme.shadow('sm'),
      },
      tierHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
      },
      tierIcon: {
        fontSize: 32,
        marginRight: theme.spacing.md,
      },
      tierName: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
      },
      tierTagline: {
        fontSize: 14,
        color: theme.colors.mutedText,
        marginBottom: theme.spacing.md,
        lineHeight: 20,
      },
      featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.xs,
        paddingRight: theme.spacing.sm,
      },
      featureIcon: {
        fontSize: 18,
        marginRight: theme.spacing.sm,
        width: 24,
        textAlign: 'center',
      },
      featureText: {
        fontSize: 15,
        color: theme.colors.text,
        flex: 1,
      },
      plusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: 8,
        marginBottom: theme.spacing.sm,
      },
    });
  }, [theme]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <AppText style={styles.crown}>👑</AppText>
          <AppText style={styles.heroTitle}>VIP Subscription</AppText>
          <AppText style={styles.heroSubtitle}>
            Choose the tier that fits you. Unlock benefits and get more out of every event.
          </AppText>
        </View>

        <AppText style={styles.sectionLabel}>Plans</AppText>
        {VIP_TIERS.map((tier) => (
          <View key={tier.id} style={styles.tierCard}>
            {tier.id === 'vip-plus' && (
              <View style={[styles.plusBadge, { backgroundColor: tier.accentColor + '25' }]}>
                <AppText style={{ fontSize: 12, fontWeight: '600', color: tier.accentColor }}>
                  Most popular
                </AppText>
              </View>
            )}
            <View style={styles.tierHeader}>
              <AppText style={styles.tierIcon}>{tier.icon}</AppText>
              <AppText style={styles.tierName}>{tier.name}</AppText>
            </View>
            <AppText style={styles.tierTagline}>{tier.tagline}</AppText>
            {tier.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <AppText style={styles.featureIcon}>{feature.icon}</AppText>
                <AppText style={styles.featureText}>{feature.text}</AppText>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
};
