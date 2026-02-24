import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../../theme/useTheme';

export type VipTier = null | 'vip' | 'vip_plus';

interface UserNameWithBadgeProps {
  name: string;
  vipTier?: VipTier;
  variant?: 'title' | 'body' | 'caption';
  style?: object;
  /** When true, badge is inline (name and badge on same line). Default true. */
  inline?: boolean;
}

export const UserNameWithBadge = ({
  name,
  vipTier,
  variant = 'default',
  style,
  inline = true,
}: UserNameWithBadgeProps): React.JSX.Element => {
  const theme = useTheme();
  const showBadge = vipTier === 'vip' || vipTier === 'vip_plus';
  const badgeLabel = vipTier === 'vip_plus' ? 'VIP Plus' : 'VIP';

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 6,
        },
        badge: {
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 6,
          backgroundColor: theme.colors.success + '25',
          borderWidth: 1,
          borderColor: theme.colors.success + '50',
        },
        badgeText: {
          fontSize: 10,
          fontWeight: '700',
          color: theme.colors.success,
        },
      }),
    [theme]
  );

  if (!showBadge) {
    return (
      <AppText variant={variant} style={style}>
        {name}
      </AppText>
    );
  }

  return (
    <View style={[inline ? styles.row : undefined, inline ? undefined : { flexDirection: 'column', alignItems: 'flex-start', gap: 2 }]}>
      <AppText variant={variant} style={style}>
        {name}
      </AppText>
      <View style={styles.badge}>
        <AppText style={styles.badgeText}>👑 {badgeLabel}</AppText>
      </View>
    </View>
  );
};
