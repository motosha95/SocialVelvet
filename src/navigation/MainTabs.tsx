import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, TouchableOpacity } from 'react-native';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppTabsParamList } from './types';
import { Routes } from './routes';
import { EventsStack } from './EventsStack';
import { ChatStack } from './ChatStack';
import { BookingsStack } from './BookingsStack';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { AppText } from '../components/ui/AppText';
import { useTheme } from '../theme/useTheme';

const Tabs = createBottomTabNavigator<AppTabsParamList>();

const getTabIcon = (routeName: string): string => {
  switch (routeName) {
    case Routes.App.Events:
      return '📅';
    case Routes.App.Chat:
      return '💬';
    case Routes.App.Bookings:
      return '🎫';
    case Routes.App.Profile:
      return '👤';
    default:
      return '•';
  }
};

export const MainTabs = (): React.JSX.Element => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const tabBarStyles = React.useMemo(() => {
    return StyleSheet.create({
      tabBar: {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
        borderTopWidth: 1,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 8),
        height: 60 + Math.max(insets.bottom - 8, 0),
      },
      tabBarItem: {
        paddingVertical: 4,
        borderRadius: 12,
        marginHorizontal: 4,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      },
      tabBarItemFocused: {
        backgroundColor: theme.colors.primary + '20', // 20% opacity background
      },
      tabBarLabel: {
        fontSize: theme.typography.captionSize,
        marginTop: 4,
      },
    });
  }, [theme, insets.bottom]);

  const CustomTabBarButton = ({ children, onPress, accessibilityState }: BottomTabBarButtonProps) => {
    const isFocused = accessibilityState?.selected ?? false;

    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          tabBarStyles.tabBarItem,
          isFocused && tabBarStyles.tabBarItemFocused,
        ]}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  };

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          const icon = getTabIcon(route.name);
          return (
            <AppText 
              style={{ 
                fontSize: 24,
                opacity: focused ? 1 : 0.6,
              }}
            >
              {icon}
            </AppText>
          );
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedText,
        tabBarStyle: tabBarStyles.tabBar,
        tabBarLabelStyle: tabBarStyles.tabBarLabel,
        tabBarButton: (props) => <CustomTabBarButton {...props} />,
        headerShown: false,
      })}
    >
      <Tabs.Screen 
        name={Routes.App.Events} 
        component={EventsStack} 
        options={{ title: 'Events' }} 
      />
      <Tabs.Screen 
        name={Routes.App.Bookings} 
        component={BookingsStack} 
        options={{ title: 'My Bookings' }} 
      />
      <Tabs.Screen 
        name={Routes.App.Chat} 
        component={ChatStack} 
        options={{ title: 'Chat' }} 
      />
      <Tabs.Screen 
        name={Routes.App.Profile} 
        component={ProfileScreen} 
        options={{ title: 'Profile' }} 
      />
    </Tabs.Navigator>
  );
};
